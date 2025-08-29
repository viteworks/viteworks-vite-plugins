import { attachScopes, makeLegalIdentifier, type AttachedScope } from '@rollup/pluginutils'
import type {
  Node,
  Program,
  ImportDeclaration,
  ExportNamedDeclaration,
  ExportAllDeclaration,
  ExportSpecifier,
  Property,
  Identifier,
  Literal,
} from 'estree'
import type MagicString from 'magic-string'

interface WalkFunction {
  (node: Node, options: {
    enter?: (node: Node, parent?: Node) => void
    leave?: (node: Node, parent?: Node) => void
  }): void
}

interface IsReferenceFunction {
  (node: Node, parent?: Node): boolean
}

let walk: WalkFunction
let isReference: IsReferenceFunction

async function prepare(): Promise<void> {
  if (!walk || !isReference) {
    const [{ walk: walkFn }, { default: isReferenceFn }] = await Promise.all([
      import('estree-walker'),
      import('is-reference'),
    ])
    walk = walkFn as WalkFunction
    isReference = isReferenceFn as IsReferenceFunction
  }
}

interface NodeWithPosition {
  start?: number
  end?: number
}

interface IdentifierWithPosition extends Identifier {
  start?: number
  end?: number
  isOverwritten?: boolean
}

type GetNameFunction = (name: string) => string | undefined
type GetDynamicWrapperFunction = (name: string) => string

function analyzeImport(
  node: ImportDeclaration,
  importBindings: Map<string, string>,
  code: MagicString,
  getName: GetNameFunction,
  globals: Set<string>,
): boolean {
  const source = node.source as Literal
  const sourceValue = source.value as string
  const name = sourceValue && getName(sourceValue)
  if (!name) {
    return false
  }
  globals.add(name)

  for (const spec of node.specifiers) {
    let importedName = 'default'
    if (spec.type === 'ImportSpecifier') {
      importedName = (spec.imported as Identifier).name
    } else if (spec.type === 'ImportNamespaceSpecifier') {
      importedName = '*'
    }

    importBindings.set(
      spec.local.name,
      makeGlobalName(importedName, name),
    )
  }

  const nodeWithPos = node as NodeWithPosition
  if (nodeWithPos.start !== undefined && nodeWithPos.end !== undefined) {
    code.remove(nodeWithPos.start, nodeWithPos.end)
  }
  return true
}

function makeGlobalName(prop: string, globalName: string): string {
  if (prop === 'default') {
    return globalName
  }
  return `${globalName}.${prop}`
}

function writeSpecLocal(
  code: MagicString,
  root: NodeWithPosition,
  spec: ExportSpecifier,
  globalName: string,
  tempNames: Set<string>,
  constBindings: boolean,
): void {
  const specWithPos = spec as ExportSpecifier & { isOverwritten?: boolean }
  if (specWithPos.isOverwritten) return

  // We always need an extra assignment for named export statement
  // https://github.com/eight04/rollup-plugin-external-globals/issues/19
  const localName = `_global_${makeLegalIdentifier(globalName)}`
  if (!tempNames.has(localName)) {
    const rootStart = root.start ?? 0
    code.appendRight(
      rootStart,
      `${constBindings ? 'const' : 'var'} ${localName} = ${globalName};\n`,
    )
    tempNames.add(localName)
  }

  const local = spec.local as IdentifierWithPosition
  const exported = spec.exported as IdentifierWithPosition

  if (local.name === localName) {
    return
  }

  if (
    local.start === exported.start &&
        local.end === exported.end
  ) {
    code.appendRight(local.start ?? 0, `${localName} as `)
  } else {
    code.overwrite(local.start ?? 0, local.end ?? 0, localName)
  }
  specWithPos.isOverwritten = true
}

function writeIdentifier(
  code: MagicString,
  node: IdentifierWithPosition,
  parent: Node,
  name: string,
): void {
  if (node.name === name || node.isOverwritten) {
    return
  }

  const nodeStart = node.start ?? 0
  const nodeEnd = node.end ?? 0

  // Handle Property nodes
  if (parent.type === 'Property') {
    const propParent = parent as Property
    const key = propParent.key as IdentifierWithPosition
    const value = propParent.value as IdentifierWithPosition

    if (key.start === value.start) {
      code.appendLeft(nodeEnd, `: ${name}`)
      if (key.start !== undefined) key.isOverwritten = true
      if (value.start !== undefined) value.isOverwritten = true
    }
  }
  // Handle ExportSpecifier nodes
  else if (parent.type === 'ExportSpecifier') {
    const exportParent = parent as ExportSpecifier
    const local = exportParent.local as IdentifierWithPosition
    const exported = exportParent.exported as IdentifierWithPosition

    if (local.start === exported.start) {
      code.appendLeft(nodeStart, `${name} as `)
      local.isOverwritten = true
      exported.isOverwritten = true
    }
  }
  // Default case
  else {
    code.overwrite(nodeStart, nodeEnd, name, { contentOnly: true })
    node.isOverwritten = true
  }
}

function analyzeExportNamed(
  node: ExportNamedDeclaration,
  code: MagicString,
  getName: GetNameFunction,
  tempNames: Set<string>,
  constBindings: boolean,
): boolean {
  if (node.declaration || !node.source) {
    return false
  }

  const source = node.source as Literal
  const sourceValue = source.value as string
  const name = getName(sourceValue)
  if (!name) {
    return false
  }

  const nodeWithPos = node as NodeWithPosition
  const sourceWithPos = source as NodeWithPosition

  for (const spec of node.specifiers) {
    const local = spec.local as Identifier
    const globalName = makeGlobalName(local.name, name)
    writeSpecLocal(code, nodeWithPos, spec, globalName, tempNames, constBindings)
  }

  if (node.specifiers.length) {
    const lastSpec = node.specifiers[node.specifiers.length - 1] as NodeWithPosition
    code.overwrite(
      lastSpec.end ?? 0,
      sourceWithPos.end ?? 0,
      '}',
    )
  } else {
    code.remove(nodeWithPos.start ?? 0, nodeWithPos.end ?? 0)
  }
  return true
}

function analyzeExportAll(node: ExportAllDeclaration, getName: GetNameFunction): void {
  if (!node.source) {
    return
  }

  const source = node.source as Literal
  const sourceValue = source.value as string
  const name = getName(sourceValue)
  if (!name) {
    return
  }
  throw new Error('Cannot export all properties from an external variable')
}

function writeDynamicImport(code: MagicString, node: NodeWithPosition, content: string): void {
  code.overwrite(node.start ?? 0, node.end ?? 0, content)
}

function getDynamicImportSource(node: Node): string | undefined {
  if (node.type === 'ImportExpression') {
    const importExpr = node as { source: Literal }
    const source = importExpr.source
    return source.value as string
  }
  if (node.type === 'CallExpression') {
    const callExpr = node as { callee?: { type: string }, arguments?: Literal[] }
    if (callExpr.callee?.type === 'Import' && callExpr.arguments?.[0]) {
      const arg = callExpr.arguments[0]
      return arg.value as string
    }
  }
  return undefined
}

// Export left hand analyzer
class ExportLeftHand {
  private inDeclaration = false
  private inLeftHand = false

  enter(node: Node, parent?: Node): void {
    if (parent && parent.type === 'Program') {
      this.inDeclaration = node.type === 'ExportNamedDeclaration'
    }
    if (
      this.inDeclaration &&
            parent?.type === 'VariableDeclarator' &&
            (parent as { id: Node }).id === node
    ) {
      this.inLeftHand = true
    }
  }

  leave(_node: Node, parent?: Node): void {
    if (this.inLeftHand && parent?.type === 'VariableDeclarator') {
      this.inLeftHand = false
    }
  }

  get isInLeftHand(): boolean {
    return this.inLeftHand
  }
}

interface ImportToGlobalsOptions {
  ast: Program
  code: MagicString
  getName: GetNameFunction
  getDynamicWrapper: GetDynamicWrapperFunction
  constBindings: boolean
}

export default async function importToGlobals({
  ast,
  code,
  getName,
  getDynamicWrapper,
  constBindings,
}: ImportToGlobalsOptions): Promise<boolean> {
  await prepare()

  let scope = attachScopes(ast, 'scope')
  const bindings = new Map<string, string>()
  const globals = new Set<string>()
  let isTouched = false
  const tempNames = new Set<string>()
  const exportLeftHand = new ExportLeftHand()

  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration') {
      isTouched =
                analyzeImport(node as ImportDeclaration, bindings, code, getName, globals) ||
                isTouched
    } else if (node.type === 'ExportNamedDeclaration') {
      isTouched =
                analyzeExportNamed(
                  node as ExportNamedDeclaration,
                  code,
                  getName,
                  tempNames,
                  constBindings,
                ) || isTouched
    } else if (node.type === 'ExportAllDeclaration') {
      analyzeExportAll(node as ExportAllDeclaration, getName)
    }
  }

  let topStatement: NodeWithPosition | undefined

  walk(ast, {
    enter(node: Node, parent?: Node) {
      exportLeftHand.enter(node, parent)
      if (parent && parent.type === 'Program') {
        topStatement = node as NodeWithPosition
      }
      if (/^importdec/i.test(node.type)) {
        ; (this as { skip: () => void }).skip()
        return
      }
      if ((node as unknown as { scope?: AttachedScope }).scope) {
        scope = (node as unknown as { scope: AttachedScope }).scope
      }
      if (isReference(node, parent)) {
        const identifier = node as IdentifierWithPosition
        const nodeName = identifier.name
        if (bindings.has(nodeName) && !scope.contains(nodeName)) {
          if (parent?.type === 'ExportSpecifier') {
            writeSpecLocal(
              code,
              topStatement!,
              parent as ExportSpecifier,
              bindings.get(nodeName)!,
              tempNames,
              constBindings,
            )
          } else {
            writeIdentifier(
              code,
              identifier,
              parent!,
              bindings.get(nodeName)!,
            )
          }
        } else if (globals.has(nodeName) && scope.contains(nodeName)) {
          // Conflict with local variable
          writeIdentifier(
            code,
            identifier,
            parent!,
            `_local_${nodeName}`,
          )
          if (exportLeftHand.isInLeftHand) {
            const topEnd = topStatement?.end ?? 0
            const topStart = topStatement?.start ?? 0
            code.appendLeft(
              topEnd,
              `export {_local_${nodeName} as ${nodeName}};\n`,
            )
            code.remove(
              topStart,
              (topStatement as { declaration?: { start?: number } })?.declaration?.start ?? topStart,
            )
          }
        }
      }
      const source = getDynamicImportSource(node)
      const name = source && getName(source)
      const dynamicName = name && getDynamicWrapper(name)
      if (dynamicName) {
        writeDynamicImport(code, node as NodeWithPosition, dynamicName)
        isTouched = true
        ; (this as { skip: () => void }).skip()
      }
    },
    leave(node: Node, parent?: Node) {
      exportLeftHand.leave(node, parent)
      if ((node as unknown as { scope?: AttachedScope }).scope) {
        scope = (node as unknown as { scope: AttachedScope }).scope.parent!
      }
    },
  })

  return isTouched
}

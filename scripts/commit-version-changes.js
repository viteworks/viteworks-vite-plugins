#!/usr/bin/env node
/* eslint-disable no-undef */

import { execSync } from 'child_process'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

/**
 * 执行命令并返回输出
 */
function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'inherit'],
      ...options,
    }).trim()
  } catch(error) {
    console.error(`Command failed: ${command}`)
    throw error
  }
}

/**
 * 检查是否有变更需要提交
 */
function hasChanges() {
  try {
    const status = exec('git status --porcelain')
    return status.length > 0
  } catch {
    return false
  }
}

/**
 * 获取所有 packages 目录下的 package.json 文件
 */
function getPackageJsonFiles() {
  const packagesDir = 'packages'
  const packageFiles = []

  try {
    const packages = readdirSync(packagesDir)

    for (const pkg of packages) {
      const pkgPath = join(packagesDir, pkg)
      const stat = statSync(pkgPath)

      if (stat.isDirectory()) {
        const packageJsonPath = join(pkgPath, 'package.json')
        try {
          statSync(packageJsonPath)
          packageFiles.push(packageJsonPath)
        } catch {
          // package.json 不存在，跳过
        }
      }
    }
  } catch(error) {
    console.warn('Failed to read packages directory:', error.message)
  }

  return packageFiles
}

/**
 * 获取包的版本变更信息
 */
function getVersionChanges() {
  const packageFiles = getPackageJsonFiles()
  const changes = []

  for (const filePath of packageFiles) {
    try {
      // 检查这个文件是否在 git 变更中
      const gitStatus = exec(`git status --porcelain "${filePath}"`)
      if (!gitStatus) continue

      const packageJson = JSON.parse(readFileSync(filePath, 'utf-8'))
      const { name, version } = packageJson

      if (name && version) {
        changes.push({ name, version, path: filePath })
      }
    } catch(error) {
      console.warn(`Failed to read ${filePath}:`, error.message)
    }
  }

  return changes
}

/**
 * 生成 commit 信息
 */
function generateCommitMessage() {
  const versionChanges = getVersionChanges()

  if (versionChanges.length === 0) {
    return 'chore: 🚀 release packages'
  }

  const title = versionChanges.length === 1
    ? 'chore: 🚀 release package'
    : 'chore: 🚀 release packages'

  const body = versionChanges
    .map(pkg => `- ${pkg.name}@${pkg.version}`)
    .join('\n')

  return `${title}\n\n${body}`
}

/**
 * 配置 git 用户信息
 */
function configureGit() {
  console.log('Configuring git user...')
  exec('git config user.name "github-actions[bot]"')
  exec('git config user.email "github-actions[bot]@users.noreply.github.com"')
}

/**
 * 主函数
 */
function main() {
  try {
    console.log('Starting version commit process...')

    // 配置 git
    configureGit()

    // 添加所有变更
    console.log('Adding changes...')
    exec('git add .')

    // 显示状态
    console.log('Git status:')
    const status = exec('git status --porcelain')
    console.log(status || 'No changes')

    // 检查是否有变更
    if (!hasChanges()) {
      console.log('No changes to commit')
      return
    }

    // 生成 commit 信息
    const commitMessage = generateCommitMessage()
    console.log('Commit message:')
    console.log(commitMessage)

    // 提交变更
    console.log('Committing changes...')
    exec(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`)

    console.log('✅ Version changes committed successfully')

  } catch(error) {
    console.error('❌ Failed to commit version changes:', error.message)
    process.exit(1)
  }
}

main()

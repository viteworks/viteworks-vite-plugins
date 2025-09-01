#!/usr/bin/env node
/* eslint-disable no-undef */

import { execSync } from 'child_process'

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
    exec('git diff-index --quiet HEAD')
    return false
  } catch {
    return true
  }
}

/**
 * 获取 changeset 状态并生成 commit 信息
 */
function generateCommitMessage() {
  try {
    const statusOutput = exec('pnpm changeset status --json')
    const changes = JSON.parse(statusOutput)

    if (!changes || changes.length === 0) {
      return 'chore: 🚀 version packages'
    }

    const packageUpdates = changes
      .map(pkg => `${pkg.name} → ${pkg.newVersion}`)
      .join('\n')

    return `chore: 🚀 version packages\n\n${packageUpdates}`
  } catch {
    console.warn('Failed to get changeset status, using default message')
    return 'chore: 🚀 version packages'
  }
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
    console.log(exec('git status --porcelain'))

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

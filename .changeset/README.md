# Changesets

这个项目使用 [Changesets](https://github.com/changesets/changesets) 来管理版本和发布。

## 如何添加 changeset

当你做了需要发布的更改时，运行：

```bash
pnpm changeset
```

然后按照提示选择：

- 哪些包需要更新版本
- 版本类型（patch/minor/major）
- 描述更改内容

## 发布流程

1. 创建 PR 并添加 changeset
2. PR 合并到 main 分支后，GitHub Actions 会：
   - 自动创建一个 "Version Packages" PR
   - 或者如果已有版本 PR，会更新它
3. 合并 "Version Packages" PR 后，会自动发布到 npm

## 版本类型

- **patch**: 修复 bug，向后兼容
- **minor**: 新功能，向后兼容
- **major**: 破坏性更改，不向后兼容

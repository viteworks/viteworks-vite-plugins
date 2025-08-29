# Requirements Document

## Introduction

本功能旨在创建一个基于 vite-plugin-external 的 wrapper 插件，名为 vite-plugin-external-globals-chain。该插件允许开发者使用数组形式配置外部依赖的全局变量路径，插件会自动将数组转换为链式全局变量访问形式（如 window.xxx.yyy），然后传递给底层的 vite-plugin-external 插件处理。

## Requirements

### Requirement 1

**User Story:** 作为一个前端开发者，我希望能够使用数组形式配置外部依赖的全局变量路径，这样我可以更清晰地表达嵌套的全局变量结构。

#### Acceptance Criteria

1. WHEN 用户配置 `react: ['ralWindows', 'React']` THEN 插件 SHALL 将其转换为 `react: 'window.ralWindows.React'`
2. WHEN 用户配置 `'react-dom': ['ralWindows', 'ReactDOM']` THEN 插件 SHALL 将其转换为 `'react-dom': 'window.ralWindows.ReactDOM'`
3. WHEN 用户提供数组配置 THEN 插件 SHALL 自动在数组前添加 'window' 前缀并用点号连接所有元素

### Requirement 2

**User Story:** 作为一个前端开发者，我希望插件能够无缝集成 vite-plugin-external 的所有功能，这样我只需要改变配置格式而不需要学习新的 API。

#### Acceptance Criteria

1. WHEN 插件转换完配置后 THEN 插件 SHALL 将转换后的配置传递给 vite-plugin-external
2. WHEN vite-plugin-external 返回结果 THEN 插件 SHALL 直接返回该结果给 Vite
3. IF 用户提供的配置项不是数组 THEN 插件 SHALL 保持原值不变并传递给 vite-plugin-external

### Requirement 3

**User Story:** 作为一个前端开发者，我希望插件具有良好的错误处理和类型安全，这样我可以在开发时获得准确的错误提示。

#### Acceptance Criteria

1. WHEN 用户提供空数组 THEN 插件 SHALL 抛出有意义的错误信息
2. WHEN 用户提供包含非字符串元素的数组 THEN 插件 SHALL 抛出类型错误
3. WHEN 插件配置格式正确 THEN 插件 SHALL 提供 TypeScript 类型定义支持

### Requirement 4

**User Story:** 作为一个前端开发者，我希望插件实现简单且最小化，这样我可以快速集成到现有项目中。

#### Acceptance Criteria

1. WHEN 插件被调用 THEN 插件 SHALL 仅执行配置转换和委托给 vite-plugin-external 的逻辑
2. WHEN 插件实现完成 THEN 插件 SHALL 不包含超出核心功能的额外特性
3. WHEN 用户安装插件 THEN 插件 SHALL 具有最小的依赖项（仅依赖 vite-plugin-external）
# Implementation Plan

- [x] 1. 设置项目结构和核心接口

  - 创建基本的目录结构（src/, tests/）
  - 定义 TypeScript 接口和类型定义
  - 设置基本的 package.json 和 tsconfig.json
  - _Requirements: 4.3_

- [x] 2. 实现配置转换核心逻辑

  - [x] 2.1 创建配置转换函数

    - 编写 transformConfig 函数，处理数组到字符串的转换
    - 实现 window 前缀添加和点号连接逻辑
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 添加输入验证和错误处理

    - 实现空数组检测和错误抛出
    - 添加非字符串元素的类型检查
    - 创建有意义的错误消息
    - _Requirements: 3.1, 3.2_

  - [x] 2.3 处理混合配置类型
    - 支持数组和字符串值的混合配置
    - 确保非数组值直接传递不变
    - _Requirements: 2.3_

- [ ] 3. 创建主插件函数

  - [x] 3.1 实现 windowExternal 主函数

    - 创建插件入口函数，接收用户配置
    - 调用配置转换器处理输入
    - 委托转换后的配置给 vite-plugin-external
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 添加 TypeScript 类型支持
    - 导出 WindowExternalConfig 接口
    - 确保插件函数返回正确的 Plugin 类型
    - 提供完整的类型定义文件
    - _Requirements: 3.3_

- [x] 4. 编写单元测试

  - [x] 4.1 测试配置转换逻辑

    - 编写数组到字符串转换的测试用例
    - 测试字符串值的直接传递
    - 验证 window 前缀和点号连接的正确性
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 4.2 测试错误处理

    - 编写空数组错误处理测试
    - 测试非字符串元素的类型错误
    - 验证错误消息的准确性
    - _Requirements: 3.1, 3.2_

  - [x] 4.3 测试边界条件
    - 测试空配置对象
    - 测试单元素数组
    - 测试多层嵌套数组
    - 测试混合配置（数组和字符串）
    - _Requirements: 2.3, 3.1_

- [x] 5. 创建集成测试

  - [x] 5.1 测试与 vite-plugin-external 的集成

    - 验证转换后的配置能被 vite-plugin-external 正确处理
    - 测试插件返回值的正确性
    - _Requirements: 2.1, 2.2_

  - [x] 5.2 创建端到端测试示例
    - 创建简单的 Vite 项目测试用例
    - 验证实际构建过程中的外部化行为
    - 测试运行时全局变量访问的正确性
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. 完善项目配置和文档

  - [x] 6.1 配置构建和发布

    - 设置 TypeScript 编译配置
    - 配置 npm 包发布设置
    - 创建构建脚本
    - _Requirements: 4.3_

  - [x] 6.2 创建使用文档和示例
    - 编写 README.md 文件
    - 提供配置示例和使用说明
    - 添加 API 文档
    - _Requirements: 4.2_

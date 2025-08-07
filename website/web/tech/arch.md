# 前端项目架构文档

## 项目结构

```
website/web/
├── node_modules/    # 第三方依赖
├── public/         # 静态资源
├── src/            # 源代码
│   ├── components/  # 公共组件
│   ├── model/       # 数据模型和工具
│   ├── pages/       # 页面组件
│   ├── services/    # 服务层
│   ├── styles/      # 全局样式
│   └── main.tsx     # 应用入口
├── tech/           # 技术文档
├── index.html      # 主HTML文件
├── package.json    # 项目配置
├── tsconfig.json   # TypeScript配置
└── vite.config.ts  # 构建配置
```

## 技术栈

- **框架**: React 18
- **构建工具**: Vite
- **语言**: TypeScript
- **样式**: Less (CSS Modules)
- **UI库**: Ant Design
- **可视化**:
  - 偏算法研究的使用 Cytoscape.js
  - 偏业务使用 @antv/g6、
  - 偏知识图谱使用 @antv/x6、
  - Agent工作流使用 @xyflow/react、@antv/xflow
  - 偏数据分析使用 @antv/g2plot、@antv/g2
- **状态管理**: React Hooks、zustand
- **数据流**: 大对象处理使用immer优化
- **测试**: vitest@3.2.4

## 核心模块

### 1. 图可视化系统

- **组件**: `GraphCytoscape.tsx`
- **功能**:
  - 支持邻接表数据结构
  - 多种布局算法(力导向/圆形/网格/拓扑排序)
  - 节点交互(拖拽/点击/右键菜单)
  - 实时更新

### 2. 数据模型

- **位置**: `model/graph/`
- 包含:
  - `tool.ts`: 数据转换/布局配置
  - `data.ts`: 示例数据

### 3. 页面结构

- 采用模块化组织:
  - 每个页面有独立目录
  - 包含 `index.tsx` 和样式文件

## 开发规范

1. 组件使用 `.module.less` 实现CSS模块化
2. 类型定义优先使用TypeScript接口
3. 复杂功能拆分为自定义Hook
4. 工具函数集中放在`model`目录

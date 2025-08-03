import cytoscape from 'cytoscape';

export interface GraphNode {
  id: string;
  status?: 'running' | 'failed' | 'success'; // 节点状态
  label?: string; // 自定义显示标签
  [key: string]: any; // 其他属性
}

export interface GraphEdge {
  source: string;
  target: string;
  weight?: number; // 边权重
  type?: string; // 边类型（如条件分支）
  [key: string]: any; // 其他属性
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * 将节点状态转换为颜色
 */
export const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'running': return '#FFA500'; // 橙色
    case 'failed': return '#FF0000';   // 红色
    case 'success': return '#00FF00';  // 绿色
    default: return '#5470C6';         // 默认蓝色
  }
};

/**
 * 将邻接表格式转换为Cytoscape元素格式
 */
export const convertAdjListToCytoscape = (data: GraphData): cytoscape.ElementDefinition[] => {
  const elements: cytoscape.ElementDefinition[] = [];

  // 添加节点
  data.nodes.forEach(node => {
    elements.push({
      data: {
        ...node // 保留所有原始属性
      },
      group: 'nodes'
    });
  });

  // 添加边
  data.edges.forEach((edge, index) => {
    elements.push({
      data: {
        id: `e_${index}`,
        ...edge // 保留所有原始属性
      },
      group: 'edges'
    });
  });

  return elements;
};

/**
 * 创建基础样式配置
 */
export const createBaseStyles = (): any[] => {
  return [
    // 节点样式
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)', // 使用节点数据中的color属性
        'label': 'data(label)', // 使用节点数据中的label属性
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#fff',
        'font-size': '12px',
        'width': 30,
        'height': 30,
        'text-outline-color': '#000',
        'text-outline-width': 1
      } as any
    },
    // 边样式
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#999',
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#999',
        'label': 'data(weight)',
        'font-size': '10px'
      } as any
    },
    // 高亮节点样式
    {
      selector: 'node:selected',
      style: {
        'background-color': '#8A2BE2',
        'border-width': 2,
        'border-color': '#fff',
        'border-opacity': 1
      } as any
    },
    // 高亮边样式
    {
      selector: 'edge:selected',
      style: {
        'width': 3,
        'line-color': '#8A2BE2',
        'target-arrow-color': '#8A2BE2'
      } as any
    }
  ];
};

/**
 * 执行拓扑排序算法
 */
export const topologicalSort = (nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] => {
  // 构建邻接表
  const graph: Map<string, string[]> = new Map();
  const inDegree: Map<string, number> = new Map();

  // 初始化图和入度
  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // 构建邻接表和计算入度
  edges.forEach(edge => {
    const { source, target } = edge;
    if (graph.has(source)) {
      graph.get(source)!.push(target);
    }
    if (inDegree.has(target)) {
      inDegree.set(target, inDegree.get(target)! + 1);
    }
  });

  // 拓扑排序
  const queue: string[] = [];
  const result: string[] = [];

  // 将所有入度为0的节点加入队列
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
    }
  });

  // BFS遍历
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    // 更新相邻节点的入度
    if (graph.has(current)) {
      const neighbors = graph.get(current)!;
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
  }

  // 如果存在环，处理剩余节点
  if (result.length < nodes.length) {
    nodes.forEach(node => {
      if (!result.includes(node.id)) {
        result.push(node.id);
      }
    });
  }

  // 根据排序结果重新排序节点
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach(node => nodeMap.set(node.id, node));

  return result.map(id => nodeMap.get(id)!);
};

/**
 * 创建布局配置
 */
export const createLayoutConfig = (name: string = 'cose'): cytoscape.LayoutOptions => {
  const layouts: Record<string, cytoscape.LayoutOptions> = {
    // 拓扑排序布局 - 适合有向无环图
    'topological': {
      name: 'breadthfirst',
      fit: true,
      padding: 30,
      directed: true,
      spacingFactor: 1.2,
      avoidOverlap: true,
      rankDir: 'LR', // 从左到右排列
      rankSep: 100, // 层级间距
      nodeDimensionsIncludeLabels: true
    } as any,
    // 力导向布局 - 适合大多数图
    'cose': {
      name: 'cose',
      idealEdgeLength: 100,
      nodeOverlap: 20,
      refresh: 20,
      fit: true,
      padding: 30,
      randomize: false,
      componentSpacing: 100,
      nodeRepulsion: 200000, // 降低了节点排斥力，减少抖动
      edgeElasticity: 50,    // 降低了边弹性，减少抖动
      nestingFactor: 5,
      gravity: 50,           // 降低了重力，减少抖动
      numIter: 1500,         // 增加迭代次数，使布局更稳定
      initialTemp: 150,      // 降低初始温度，减少抖动
      coolingFactor: 0.97,   // 提高冷却因子，使布局更平滑
      minTemp: 0.5           // 降低最小温度，使布局更稳定
    },
    // 圆形布局 - 适合环状结构
    'circle': {
      name: 'circle',
      fit: true,
      padding: 30,
      radius: 100,
      startAngle: 3 / 2 * Math.PI,
      sweep: undefined,
      clockwise: true,
      sort: undefined
    },
    // 网格布局 - 适合规则结构
    'grid': {
      name: 'grid',
      fit: true,
      padding: 30,
      avoidOverlap: true,
      rows: undefined
    },
    // 树形布局 - 适合层次结构
    'breadthfirst': {
      name: 'breadthfirst',
      fit: true,
      padding: 30,
      directed: true,
      spacingFactor: 1.75,
      avoidOverlap: true
    }
  };

  return layouts[name] || layouts['cose'];
};

/**
 * 处理节点数据，添加颜色属性
 */
export const processNodeData = (nodes: GraphNode[]): GraphNode[] => {
  return nodes.map(node => ({
    ...node,
    color: getStatusColor(node.status),
    label: node.label || node.id
  }));
};
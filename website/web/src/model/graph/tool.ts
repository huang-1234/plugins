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
export const createBaseStyles = (): cytoscape.Stylesheet[] => {
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
 * 创建布局配置
 */
export const createLayoutConfig = (name: string = 'cose'): cytoscape.LayoutOptions => {
  const layouts: Record<string, cytoscape.LayoutOptions> = {
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
      nodeRepulsion: 400000,
      edgeElasticity: 100,
      nestingFactor: 5,
      gravity: 80,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0
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
      rows: undefined,
      columns: undefined
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

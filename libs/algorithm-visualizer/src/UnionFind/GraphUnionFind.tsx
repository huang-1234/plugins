// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Select, Card, Row, Col } from 'antd';
import ReactJson from 'react-json-view';
import CytoscapeComponent from 'react-cytoscapejs';

interface BaseUnionFindProps {
  size: number;
}

class BaseUnionFind {
  parent: Uint32Array;
  private rootIndex: number;

  constructor(size: number) {
    this.parent = new Uint32Array(size);
    this.rootIndex = size; // Unique root index identifier

    for (let i = 0; i < size; i++) {
      this.parent[i] = i;
    }
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
    const xRoot = this.find(x);
    const yRoot = this.find(y);
    if (xRoot === yRoot) return false;

    if (xRoot < yRoot) {
      this.parent[yRoot] = xRoot;
    } else {
      this.parent[xRoot] = yRoot;
    }
    return true;
  }

  getRootIndex(x: number): number {
    return this.find(x);
  }

  getParentArray(): number[] {
    return Array.from(this.parent);
  }
}

interface GridCell {
  value: string | number;
  row: number;
  col: number;
  key: number;
}

const initialGrid = [
  ["1", "1", "1", "1", "0"],
  ["1", "1", "0", "1", "0"],
  ["1", "1", "0", "0", "0"],
  ["0", "0", "0", "0", "0"]
];

const islandColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA62B', '#6A0572',
  '#FF6F61', '#88D8B0', '#D4A5A5', '#9B5DE5', '#00BBF9'
];

const UnionFindVisualizer: React.FC = () => {
  const [grid, setGrid] = useState<(string | number)[][]>(initialGrid);
  const [uf, setUf] = useState<BaseUnionFind | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [islandCount, setIslandCount] = useState<number>(0);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1500);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [nodeData, setNodeData] = useState<any[]>([]);
  const [edgeData, setEdgeData] = useState<any[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化并查集
  useEffect(() => {
    const rows = grid.length;
    const columns = grid[0].length;
    const newUf = new BaseUnionFind(rows * columns);
    setUf(newUf);

    // 初始化图数据
    const nodes: any[] = [];
    const edges: any[] = [];

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        if (grid[i][j] === '1') {
          const id = i * columns + j;
          nodes.push({
            id: `${id}`,
            label: `${i},${j}\n${id}`,
            x: j * 100,
            y: i * 100,
            style: {
              keyshape: {
                size: 40,
                stroke: '#fff',
                fill: '#FF6B6B',
                fillOpacity: 0.8,
              }
            }
          });
        }
      }
    }

    setNodeData(nodes);
    setEdgeData(edges);
    calculateIslandCount();
  }, [grid]);

  // 计算岛屿数量
  const calculateIslandCount = () => {
    if (!uf) return;

    const roots = new Set<number>();
    const rows = grid.length;
    const columns = grid[0].length;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        if (grid[i][j] === '1') {
          const index = i * columns + j;
          roots.add(uf.find(index));
        }
      }
    }

    setIslandCount(roots.size);
  };

  // 执行并查集算法的下一步
  const runNextStep = () => {
    if (!uf) return;

    const rows = grid.length;
    const columns = grid[0].length;
    const totalSteps = rows * columns;

    if (currentStep >= totalSteps) {
      setIsAnimating(false);
      return;
    }

    const currentRow = Math.floor(currentStep / columns);
    const currentCol = currentStep % columns;

    if (grid[currentRow][currentCol] === '1') {
      const index = currentRow * columns + currentCol;

      // 检查右侧
      if (currentCol < columns - 1 && grid[currentRow][currentCol + 1] === '1') {
        const rightIndex = currentRow * columns + currentCol + 1;
        const shouldUnion = uf.union(index, rightIndex);

        if (shouldUnion) {
          // 添加边
          setEdgeData(prev => [...prev, {
            source: `${index}`,
            target: `${rightIndex}`,
            label: `Union`,
            style: {
              keyshape: {
                stroke: '#4ECDC4',
                lineWidth: 2,
                strokeOpacity: 0.8,
              }
            }
          }]);

          // 更新节点颜色
          const root = uf.find(index);
          const colorIndex = root % islandColors.length;

          setNodeData(prev => prev.map(node => {
            if (node.id === `${index}` || node.id === `${rightIndex}`) {
              return {
                ...node,
                style: {
                  keyshape: {
                    ...node.style?.keyshape,
                    fill: islandColors[colorIndex]
                  }
                }
              };
            }
            return node;
          }));
        }
      }

      // 检查下方
      if (currentRow < rows - 1 && grid[currentRow + 1][currentCol] === '1') {
        const downIndex = (currentRow + 1) * columns + currentCol;
        const shouldUnion = uf.union(index, downIndex);

        if (shouldUnion) {
          // 添加边
          setEdgeData(prev => [...prev, {
            source: `${index}`,
            target: `${downIndex}`,
            label: `Union`,
            style: {
              keyshape: {
                stroke: '#4ECDC4',
                lineWidth: 2,
                strokeOpacity: 0.8,
              }
            }
          }]);

          // 更新节点颜色
          const root = uf.find(index);
          const colorIndex = root % islandColors.length;

          setNodeData(prev => prev.map(node => {
            if (node.id === `${index}` || node.id === `${downIndex}`) {
              return {
                ...node,
                style: {
                  keyshape: {
                    ...node.style?.keyshape,
                    fill: islandColors[colorIndex]
                  }
                }
              };
            }
            return node;
          }));
        }
      }
    }

    setCurrentStep(prev => prev + 1);
    calculateIslandCount();
  };

  // 开始/暂停动画
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  // 重置算法
  const resetAlgorithm = () => {
    setGrid(initialGrid);
    setCurrentStep(0);
    setIslandCount(0);
    setIsAnimating(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setNodeData([]);
    setEdgeData([]);
  };

  // 动画执行
  useEffect(() => {
    if (isAnimating) {
      timerRef.current = setTimeout(() => {
        runNextStep();
      }, animationSpeed);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isAnimating, currentStep]);

  // 渲染网格视图
  const renderGrid = () => {
    return (
      <div style={{ margin: '20px 0' }}>
        <Table
          bordered
          size="small"
          pagination={false}
          dataSource={grid.map((row, rowIndex) => ({
            key: rowIndex,
            cells: row.map((cell, colIndex) => ({
              value: cell,
              row: rowIndex,
              col: colIndex,
              key: rowIndex * grid[0].length + colIndex
            }))
          }))}
          columns={[
            ...grid[0].map((_, colIndex) => ({
              title: `Col ${colIndex}`,
              dataIndex: 'cells',
              key: `col-${colIndex}`,
              render: (cells: GridCell[]) => {
                const cell = cells[colIndex];
                let bgColor = '#ffffff';
                let color = '#000000';

                if (cell.value === '1' && uf) {
                  const rootIndex = uf.find(cell.key);
                  color = '#fff';
                  bgColor = islandColors[rootIndex % islandColors.length];
                }

                return (
                  <div
                    style={{
                      backgroundColor: bgColor,
                      color: color,
                      padding: '10px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      border: '1px solid #f0f0f0'
                    }}
                  >
                    {cell.value}
                    <div style={{ fontSize: 10, marginTop: 5 }}>
                      {cell.key}
                      {uf && ` → ${uf.find(cell.key)}`}
                    </div>
                  </div>
                );
              }
            }))
          ]}
        />
      </div>
    );
  };

  // 渲染并查集图
  const renderUnionFindGraph = () => {
    // 转换数据格式为 Cytoscape 格式
    const elements = [
      ...nodeData.map(node => ({
        data: {
          id: node.id,
          label: node.label || node.id
        },
        position: { x: node.x || 0, y: node.y || 0 },
        style: {
          backgroundColor: node.style?.keyshape?.fill || '#FF6B6B',
          width: node.style?.keyshape?.size || 40,
          height: node.style?.keyshape?.size || 40,
          borderWidth: node.style?.keyshape?.lineWidth || 2,
          borderColor: node.style?.keyshape?.stroke || '#fff',
          opacity: node.style?.keyshape?.fillOpacity || 0.8,
          label: node.label || node.id
        }
      })),
      ...edgeData.map(edge => ({
        data: {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          label: edge.label || ''
        },
        style: {
          width: edge.style?.keyshape?.lineWidth || 2,
          lineColor: edge.style?.keyshape?.stroke || '#4ECDC4',
          opacity: edge.style?.keyshape?.strokeOpacity || 0.8,
          lineStyle: edge.style?.keyshape?.lineDash ? 'dashed' : 'solid'
        }
      }))
    ];

    return (
      <div style={{ height: '500px', border: '1px solid #f0f0f0', margin: '20px 0' }}>
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          layout={{ name: 'grid' }}
          stylesheet={[
            {
              selector: 'node',
              style: {
                'label': 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                'color': '#fff',
                'font-size': '12px'
              }
            },
            {
              selector: 'edge',
              style: {
                'label': 'data(label)',
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'text-rotation': 'autorotate',
                'font-size': '10px'
              }
            }
          ]}
        />
      </div>
    );
  };

  // 渲染当前状态面板
  const renderStatusPanel = () => {
    return (
      <Card title="算法状态" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small" title="当前步骤">
              {currentStep}
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="岛屿数量" style={{ color: 'blue', fontWeight: 'bold' }}>
              {islandCount}
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="网格大小">
              {grid.length} × {grid[0].length}
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="动画速度">
              <Select
                value={animationSpeed}
                onChange={setAnimationSpeed}
                style={{ width: '100%' }}
              >
                <Select.Option value={2500}>慢速 (2500ms)</Select.Option>
                <Select.Option value={1500}>中速 (1500ms)</Select.Option>
                <Select.Option value={500}>快速 (500ms)</Select.Option>
              </Select>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染控制面板
  const renderControls = () => {
    return (
      <Card style={{ marginBottom: 20 }}>
        <Button
          type="primary"
          onClick={toggleAnimation}
          style={{ marginRight: 10 }}
        >
          {isAnimating ? '暂停动画' : '开始动画'}
        </Button>
        <Button
          onClick={runNextStep}
          disabled={isAnimating}
          style={{ marginRight: 10 }}
        >
          下一步
        </Button>
        <Button onClick={resetAlgorithm} danger>
          重置
        </Button>
      </Card>
    );
  };

  // 渲染并查集数据结构
  const renderDataStructure = () => {
    if (!uf) return null;

    return (
      <Card title="并查集数据结构" style={{ marginBottom: 20 }}>
        <ReactJson
          src={{
            parent: uf.getParentArray(),
            size: uf.parent.length
          }}
          name="unionFind"
          displayDataTypes={false}
          collapsed={false}
        />
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>并查集可视化 - 岛屿问题</h1>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        展示并查集如何解决LeetCode岛屿数量问题（No.200）
      </p>

      {renderStatusPanel()}
      {renderControls()}

      <Card title="网格视图" style={{ marginBottom: 20 }}>
        {renderGrid()}
      </Card>

      <Card title="并查集树状结构" style={{ marginBottom: 20 }}>
        {renderUnionFindGraph()}
      </Card>

      {renderDataStructure()}

      <Card title="算法说明">
        <p>
          <strong>并查集(Union-Find)</strong>是一种用于处理不相交集合的数据结构，支持高效地：
        </p>
        <ul>
          <li>查询元素所属集合（Find）</li>
          <li>合并两个集合（Union）</li>
        </ul>
        <p>
          在岛屿问题中，我们：
        </p>
        <ol>
          <li>将每个陆地单元格视为一个单独集合（初始岛屿）</li>
          <li>遍历网格，合并相邻（右侧和下侧）的陆地</li>
          <li>合并后，岛屿数量 = 集合数量</li>
        </ol>
        <p>
          <strong>时间复杂度</strong>: O(M×N×α(M×N)) - α为阿克曼函数的反函数（接近常数）<br />
          <strong>空间复杂度</strong>: O(M×N)
        </p>
      </Card>
    </div>
  );
};

export default React.memo(UnionFindVisualizer);
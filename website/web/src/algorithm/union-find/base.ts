

class BaseUnionFind {
  private parent: Uint32Array;
  constructor(size: number) {
    this.parent = new Uint32Array(size);
    for (let i = 0;i < size;i++) {
      this.parent[i] = i;
    }
  }
  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }
  /**
   * @desc 合并两个元素
   * @param x
   * @param y
   */
  union(x: number, y: number): boolean {
    const xRoot = this.find(x);
    const yRoot = this.find(y);
    if (xRoot === yRoot) return false;
    // 根节点小的，则合并到根节点小
    if (xRoot < yRoot) {
      this.parent[yRoot] = xRoot;
    } else {
      this.parent[xRoot] = yRoot;
    }
    return true;
  }
}

/**
 *
 * @param target
 * @returns
 */
function isISland(target: string | number, numIslands: number | string = 1) {
  return target === numIslands;
}
/**
 * @desc 测试
 * @desc test numIslands
 */
function numIslands(grid: number[][] | string[][]) {
  const rows = grid.length, columns = grid[0].length;
  const unionFind = new BaseUnionFind(rows * columns);
  let islandCount = 0;
  // 第一次遍历：初始化并查集
  for (let i = 0;i < rows;i++) {
    for (let j = 0;j < columns;j++) {
      if (grid[i][j] === '1') {
      }
    }
  }
  const directions = [
    [0, 1],
    [1, 0],
  ];
  // 遍历数组，将相邻的 1 连通
  for (let i = 0;i < rows;i++) {
    for (let j = 0;j < columns;j++) {
      const target = grid[i][j];
      const targetIsIsland = target === '1';
      if (targetIsIsland) {
        islandCount++;  // 初始每个陆地都是独立岛屿

        for (const [dx, dy] of directions) {
          const newX = i + dx;
          const newY = j + dy;

          if (newX >= 0 && newX < rows && newY >= 0 && newY < columns) {
            const index = i * columns + j; // 当前节点的索引
            const isNeighborLand = String(grid[newX][newY]) === "1";

            if (isNeighborLand) {
              // 找到当前节点的相邻节点索引
              const newIndex = newX * columns + newY;
              // 添加当前节点的相邻节点索引
              const shouldUnion = unionFind.union(index, newIndex);
              if (shouldUnion) {
                islandCount--;
              }
            }
          }
        }
      }
    }
  }

  return islandCount;
}

const grid = [
  ["1", "1", "1", "1", "0"],
  ["1", "1", "0", "1", "0"],
  ["1", "1", "0", "0", "0"],
  ["0", "0", "0", "0", "0"]
]
console.log(numIslands(grid));
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useDeferredValue
} from 'react';
import { useInView } from 'react-intersection-observer';

interface VirtualScrollProps {
  data: any[]; // 数据源
  estimatedItemHeight?: number; // 预估高度（用于初始化）
  bufferSize?: number; // 缓冲区大小
  containerHeight: number; // 容器高度
  onLoadMore?: () => void; // 触底加载回调
  renderItem?: (item: any, index: number) => React.ReactNode; // 自定义渲染函数
  loading?: boolean; // 是否正在加载
  LoadingComponent?: React.ReactNode; // 自定义加载组件
}

// Loading 组件
const Loading: React.FC = () => (
  <div style={{
    padding: '20px 0',
    textAlign: 'center',
    color: '#999'
  }}>
    加载中...
  </div>
);

export function VirtualScroll(props: VirtualScrollProps) {
  const {
    data,
    estimatedItemHeight = 60,
    bufferSize = 5,
    containerHeight,
    onLoadMore,
    loading = false,
    LoadingComponent = Loading,
    ...restProps
  } = props;
  // 1. 状态管理
  const [scrollTop, setScrollTop] = useState(0);
  const [positions, setPositions] = useState<{
    top: number;
    bottom: number;
    height: number;
    measured: boolean;
  }[]>([]);

  // 2. DOM引用
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<number, HTMLDivElement>());

  // 3. 延迟渲染优化（React 18特性）
  const deferredScrollTop = useDeferredValue(scrollTop);

  // 4. 初始化位置缓存
  useEffect(() => {
    const initialPositions = data.map((_, index) => {
      const top = index * estimatedItemHeight;
      return {
        top,
        bottom: top + estimatedItemHeight,
        height: estimatedItemHeight,
        measured: false
      };
    });
    setPositions(initialPositions);
  }, [data, estimatedItemHeight]);

  // 5. 动态测量元素高度
  const measureItems = useCallback(() => {
    const newPositions = [...positions];
    let needsUpdate = false;

    // 测量未记录高度的元素
    itemsRef.current.forEach((element, index) => {
      if (!newPositions[index]?.measured) {
        const height = element.offsetHeight;
        if (height !== newPositions[index].height) {
          newPositions[index] = {
            ...newPositions[index],
            height,
            bottom: newPositions[index].top + height,
            measured: true
          };
          needsUpdate = true;
        }
      }
    });

    // 更新后续元素位置
    if (needsUpdate) {
      for (let i = 1;i < newPositions.length;i++) {
        const prev = newPositions[i - 1];
        newPositions[i].top = prev.bottom;
        newPositions[i].bottom = newPositions[i].top + newPositions[i].height;
      }
      setPositions(newPositions);
    }
  }, [positions]);

  // 6. 计算可见范围
  const calculateVisibleRange = () => {
    if (positions.length === 0 || !containerRef.current) {
      return { start: 0, end: 0 };
    }

    // 计算可视区域索引
    const scrollBottom = deferredScrollTop + containerHeight;
    const start = positions.findIndex(pos => pos.bottom > deferredScrollTop);
    const end = positions.findIndex(pos => pos.top >= scrollBottom);

    // 添加缓冲区
    const bufferedStart = Math.max(0, start - bufferSize);
    const bufferedEnd = Math.min(
      positions.length,
      (end === -1 ? positions.length : end) + bufferSize
    );

    return { start: bufferedStart, end: bufferedEnd };
  };

  // 7. 滚动事件处理（性能优化）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let requestId: number | null = null;
    const handleScroll = () => {
      if (requestId) cancelAnimationFrame(requestId);

      requestId = requestAnimationFrame(() => {
        setScrollTop(container.scrollTop);

        // 触底检测
        if (onLoadMore) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
          if (isAtBottom) onLoadMore();
        }
      });
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (requestId) cancelAnimationFrame(requestId);
    };
  }, [onLoadMore]);

  // 8. 渲染可见项
  const renderItems = () => {
    const { start, end } = calculateVisibleRange();
    const visibleItems = [];

    for (let i = start;i < end;i++) {
      const item = data[i];
      const content = props.renderItem ? props.renderItem(item, i) : item.content;
      visibleItems.push(
        <div
          key={i}
          ref={el => {
            if (el) itemsRef.current.set(i, el);
            else itemsRef.current.delete(i);
          }}
          style={{
            position: 'absolute',
            top: `${positions[i]?.top || 0}px`,
            width: '100%'
          }}
        >
          {content}
        </div>
      );
    }

    return visibleItems;
  };

  // 9. 总高度计算
  const totalHeight = positions.length > 0
    ? positions[positions.length - 1].bottom
    : data.length * estimatedItemHeight;

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative'
      }}
      onScroll={() => measureItems()} // 滚动后重新测量
    >
      {/* 可见区域渲染 */}
      <div style={{ position: 'relative' }}>
        {renderItems()}
      </div>

      {/* 虚拟滚动条占位 */}
      <div
        style={{
          height: totalHeight,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          opacity: 0
        }}
      />

      {/* Loading 区域 */}
      <LoadingTrigger onLoadMore={onLoadMore} loading={loading} />
    </div>
  );
};

// LoadingTrigger 组件
const LoadingTrigger: React.FC<{ onLoadMore?: () => void; loading?: boolean }> = ({ onLoadMore, loading }) => {
  const { ref, inView } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && onLoadMore && !loading) {
        onLoadMore();
      }
    },
  });

  return (
    <div ref={ref} style={{
      position: 'relative',
      bottom: 0,
      width: '100%'
    }}>
      {loading && <Loading />}
    </div>
  );
};
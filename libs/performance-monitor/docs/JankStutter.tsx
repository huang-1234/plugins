import React, {
  useState,
  useCallback,
} from 'react';
import { VirtualScroll } from './virtual-scroll';
import { useJankStutter } from '../src';

const defaultPage = {
  pageSize: 20,
  pageSizeInit: 60,
}

// 使用示例
const JankStutter = () => {
  const [items, setItems] = useState(() =>
    Array.from({ length: defaultPage.pageSizeInit }, (_, i) => ({ id: i, content: `Item ${i}` }))
  );

  const loadMore = useCallback(() => {
    setItems(prev => {
      const newItems = Array.from({ length: defaultPage.pageSize }, (_, i) => ({
        id: prev.length + i,
        content: `Item ${prev.length + i}`
      }));
      console.log('newItems', newItems);
      return [...prev, ...newItems];
    });
  }, []);

  useJankStutter({});

  return (
    <VirtualScroll
      data={items}
      containerHeight={600}
      estimatedItemHeight={90}
      bufferSize={8}
      onLoadMore={loadMore}
      renderItem={(item) => (
        <div key={item.id} style={{
          height: 80,
          backgroundColor: '#fef',
          marginBottom: 10,
          flex: '0 0 20px',
          justifyContent: 'center',
          borderRadius: 4,
        }}>
          <div
          style={{
            textAlign: 'center',
          }}
          >{item.content}</div>
        </div>
      )}
    />
  );
};

export default JankStutter;
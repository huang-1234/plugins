import React, { useEffect, useRef } from 'react';
import styles from './NodeOperations.module.less';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  nodeId?: string;
  onClose: () => void;
  onAddOutgoingEdge: (nodeId: string) => void;
  onAddIncomingEdge: (nodeId: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  x,
  y,
  nodeId,
  onClose,
  onAddOutgoingEdge,
  onAddIncomingEdge
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible || !nodeId) return null;

  return (
    <div
      ref={menuRef}
      className={styles.nodeContextMenu}
      style={{ left: x, top: y }}
    >
      <div
        className={styles.menuItem}
        onClick={() => {
          onAddOutgoingEdge(nodeId);
          onClose();
        }}
      >
        添加出度节点
      </div>
      <div
        className={styles.menuItem}
        onClick={() => {
          onAddIncomingEdge(nodeId);
          onClose();
        }}
      >
        添加入度节点
      </div>
    </div>
  );
};

export default React.memo(ContextMenu);
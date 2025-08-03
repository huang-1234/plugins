import React, { useCallback } from 'react';
import { Menu } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { Node } from '@xyflow/react';
import { BusinessNodeData } from '../types';

interface NodeContextMenuProps {
  node: Node<BusinessNodeData>;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (node: Node<BusinessNodeData>) => void;
  onAddEdge: (sourceId: string) => void;
  onEdit: (nodeId: string) => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  node,
  onClose,
  onDelete,
  onDuplicate,
  onAddEdge,
  onEdit
}) => {
  const handleDelete = useCallback(() => {
    onDelete(node.id);
    onClose();
  }, [node.id, onDelete, onClose]);

  const handleDuplicate = useCallback(() => {
    onDuplicate(node);
    onClose();
  }, [node, onDuplicate, onClose]);

  const handleAddEdge = useCallback(() => {
    onAddEdge(node.id);
    onClose();
  }, [node.id, onAddEdge, onClose]);

  const handleEdit = useCallback(() => {
    onEdit(node.id);
    onClose();
  }, [node.id, onEdit, onClose]);

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑节点',
      onClick: handleEdit
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: '复制节点',
      onClick: handleDuplicate
    },
    {
      key: 'addEdge',
      icon: <ArrowRightOutlined />,
      label: '添加连接',
      onClick: handleAddEdge
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除节点',
      danger: true,
      onClick: handleDelete
    }
  ];

  return (
    <Menu items={menuItems} />
  );
};

export default React.memo(NodeContextMenu);
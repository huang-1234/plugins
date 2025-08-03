import { useEffect, useCallback } from 'react';
import { useReactFlow, Node, Edge } from '@xyflow/react';
import { BusinessNodeData } from '../types';

interface UseKeyboardShortcutsOptions {
  deleteElements?: (params: { nodes: Node<BusinessNodeData>[]; edges: Edge[] }) => void;
  duplicateNode?: (node: Node<BusinessNodeData>) => void;
  onCopy?: (nodes: Node<BusinessNodeData>[]) => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}) => {
  const { getNodes, getEdges } = useReactFlow();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 只处理非输入元素的键盘事件
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // 获取选中的节点和边
    const nodes = getNodes();
    const edges = getEdges();
    const selectedNodes = nodes.filter(node => node.selected) as Node<BusinessNodeData>[];
    const selectedEdges = edges.filter(edge => edge.selected);

    // 删除选中元素 (Delete 或 Backspace 键)
    if ((event.key === 'Delete' || event.key === 'Backspace') && options.deleteElements) {
      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        event.preventDefault();
        options.deleteElements({
          nodes: selectedNodes,
          edges: selectedEdges
        });
      }
    }

    // 复制选中节点 (Ctrl+C)
    if (event.ctrlKey && event.key === 'c' && options.onCopy) {
      if (selectedNodes.length > 0) {
        event.preventDefault();
        options.onCopy(selectedNodes);
      }
    }

    // 粘贴节点 (Ctrl+V)
    if (event.ctrlKey && event.key === 'v' && options.onPaste) {
      event.preventDefault();
      options.onPaste();
    }

    // 撤销 (Ctrl+Z)
    if (event.ctrlKey && event.key === 'z' && options.onUndo) {
      event.preventDefault();
      options.onUndo();
    }

    // 重做 (Ctrl+Y 或 Ctrl+Shift+Z)
    if ((event.ctrlKey && event.key === 'y') ||
        (event.ctrlKey && event.shiftKey && event.key === 'z')) {
      if (options.onRedo) {
        event.preventDefault();
        options.onRedo();
      }
    }

    // 复制节点 (Ctrl+D)
    if (event.ctrlKey && event.key === 'd' && options.duplicateNode) {
      const selectedNode = selectedNodes[0];
      if (selectedNode) {
        event.preventDefault();
        options.duplicateNode(selectedNode);
      }
    }
  }, [
    getNodes,
    getEdges,
    options.deleteElements,
    options.duplicateNode,
    options.onCopy,
    options.onPaste,
    options.onUndo,
    options.onRedo
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
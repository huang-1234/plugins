import { useCallback } from 'react';
import { Connection, useReactFlow } from '@xyflow/react';

const useConnectionValidator = () => {
  const { getNode } = useReactFlow();

  const isValidConnection = useCallback((connection: Connection): boolean => {
    const sourceNode = getNode(connection.source);
    const targetNode = getNode(connection.target);

    if (!sourceNode || !targetNode) return false;

    // 禁止审批节点直接连到开始节点
    if (targetNode.type === 'start') return false;

    // 禁止连接到自己
    if (connection.source === connection.target) return false;

    // 禁止创建循环连接
    // 这里可以实现更复杂的循环检测逻辑

    return true;
  }, [getNode]);

  return { isValidConnection };
};

export default useConnectionValidator;
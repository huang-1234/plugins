import { BusinessNodeType, BusinessNodeData } from '@/components/workflow';

// 业务特定的节点默认数据
export const defaultNodeData: Record<BusinessNodeType, BusinessNodeData> = {
  start: {
    label: '开始节点',
    status: 'approved'
  },
  approval: {
    label: '审批节点',
    assignee: '',
    status: 'pending'
  },
  dataProcess: {
    label: '数据处理',
    status: 'pending'
  },
  end: {
    label: '结束节点',
    status: 'pending'
  }
};

// 节点类型配置
export const nodeTypeConfig = [
  {
    type: 'start' as BusinessNodeType,
    label: '开始节点',
    description: '工作流的起点',
    color: '#e6f7ff',
    icon: 'play-circle'
  },
  {
    type: 'approval' as BusinessNodeType,
    label: '审批节点',
    description: '需要人工审批的节点',
    color: '#fff2e8',
    icon: 'audit'
  },
  {
    type: 'dataProcess' as BusinessNodeType,
    label: '数据处理',
    description: '自动处理数据的节点',
    color: '#f9f0ff',
    icon: 'database'
  },
  {
    type: 'end' as BusinessNodeType,
    label: '结束节点',
    description: '工作流的终点',
    color: '#f6ffed',
    icon: 'check-circle'
  }
];
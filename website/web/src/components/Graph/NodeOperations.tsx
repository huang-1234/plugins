import React, { useMemo, useState } from 'react';
import { Button, Modal, Form, Input, Select, Space } from 'antd';
import { LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { GraphData, GraphNode } from '@/model/graph/tool';
import styles from './NodeOperations.module.less';

const { Option } = Select;

interface NodeOperationsProps {
  graphData: GraphData;
  onAddNode: (node: GraphNode) => void;
  onAddEdge: (source: string, target: string, weight?: number) => void;
}

const NodeOperations: React.FC<NodeOperationsProps> = ({ graphData, onAddNode, onAddEdge }) => {
  const [isAddNodeModalVisible, setIsAddNodeModalVisible] = useState(false);
  const [isAddEdgeModalVisible, setIsAddEdgeModalVisible] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeForm] = Form.useForm();
  const [edgeForm] = Form.useForm();

  // 添加空节点
  const showAddNodeModal = () => {
    setIsAddNodeModalVisible(true);
    nodeForm.resetFields();
  };

  const handleAddNodeOk = () => {
    nodeForm.validateFields().then(values => {
      const newNode: GraphNode = {
        id: values.id,
        label: values.label || values.id,
        status: values.status || undefined
      };
      onAddNode(newNode);
      setIsAddNodeModalVisible(false);
    });
  };

  // 添加边
  const showAddEdgeModal = (nodeId?: string) => {
    if (nodeId) {
      setSelectedNodeId(nodeId);
      edgeForm.setFieldsValue({ source: nodeId });
    } else {
      setSelectedNodeId(null);
      edgeForm.resetFields();
    }
    setIsAddEdgeModalVisible(true);
  };

  const handleAddEdgeOk = () => {
    edgeForm.validateFields().then(values => {
      onAddEdge(values.source, values.target, parseFloat(values.weight) || 1);
      setIsAddEdgeModalVisible(false);
    });
  };

  // 生成随机ID
  const generateRandomId = () => {
    const randomId = `node_${Math.floor(Math.random() * 1000)}`;
    nodeForm.setFieldsValue({ id: randomId });
  };

  const sourceOptions = useMemo(() => {
    return graphData.nodes.map(node => ({ label: node.label || node.id, value: node.id }));
  }, [graphData]);

  return (
    <div className={styles.nodeOperations}>
      <Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showAddNodeModal}
        >
          添加节点
        </Button>
        <Button
          icon={<LinkOutlined />}
          onClick={() => showAddEdgeModal()}
        >
          添加连接
        </Button>
      </Space>

      {/* 添加节点弹窗 */}
      <Modal
        title="添加新节点"
        open={isAddNodeModalVisible}
        onOk={handleAddNodeOk}
        onCancel={() => setIsAddNodeModalVisible(false)}
      >
        <Form
          form={nodeForm}
          layout="vertical"
        >
          <Form.Item
            name="id"
            label="节点ID"
            rules={[{ required: true, message: '请输入节点ID' }]}
            extra="节点的唯一标识符"
          >
            <Input
              placeholder="输入节点ID"
              addonAfter={
                <Button type="link" size="small" onClick={generateRandomId}>
                  随机
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            name="label"
            label="节点标签"
            extra="显示在图上的文本"
          >
            <Input placeholder="输入节点标签" />
          </Form.Item>
          <Form.Item
            name="status"
            label="节点状态"
          >
            <Select placeholder="选择节点状态">
              <Option value="running">运行中</Option>
              <Option value="success">成功</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加边弹窗 */}
      <Modal
        title="添加节点连接"
        open={isAddEdgeModalVisible}
        onOk={handleAddEdgeOk}
        onCancel={() => setIsAddEdgeModalVisible(false)}
      >
        <Form
          form={edgeForm}
          layout="vertical"
        >
          <Form.Item
            name="source"
            label="源节点"
            rules={[{ required: true, message: '请选择源节点' }]}
          >
            <Select placeholder="选择源节点" options={sourceOptions} >
            </Select>
          </Form.Item>
          <Form.Item
            name="target"
            label="目标节点"
            rules={[{ required: true, message: '请选择目标节点' }]}
          >
            <Select placeholder="选择目标节点" options={sourceOptions} >
            </Select>
          </Form.Item>
          <Form.Item
            name="weight"
            label="边权重"
          >
            <Input type="number" placeholder="输入边权重" defaultValue="1" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default React.memo(NodeOperations);
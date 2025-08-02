import React from 'react';
import { List, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const HotRecommendations = () => {
  const navigate = useNavigate();

  const recommendedDocs = [
    {
      id: 'intro',
      title: '项目介绍',
      description: '了解项目的基本情况和功能特点'
    },
    {
      id: 'getting-started',
      title: '快速开始',
      description: '从零开始使用项目的完整指南'
    },
    {
      id: 'api',
      title: 'API文档',
      description: '详细的API接口说明和使用示例'
    },
    {
      id: 'faq',
      title: '常见问题',
      description: '使用过程中的常见问题和解决方案'
    }
  ];

  return (
    <Card title="推荐阅读" style={{ margin: '16px' }}>
      <List
        itemLayout="horizontal"
        dataSource={recommendedDocs}
        renderItem={item => (
          <List.Item
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/docs/${item.id}`)}
          >
            <List.Item.Meta
              title={item.title}
              description={item.description}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default HotRecommendations;
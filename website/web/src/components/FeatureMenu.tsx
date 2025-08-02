import React from 'react';
import { Menu } from 'antd';
import { FileTextOutlined, UploadOutlined, MessageOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const FeatureMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页'
    },
    {
      key: '/docs/intro',
      icon: <FileTextOutlined />,
      label: '文档'
    },
    {
      key: '/upload',
      icon: <UploadOutlined />,
      label: '文件上传'
    },
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: 'AI助手'
    }
  ];

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ height: '100%', borderRight: 0 }}
    />
  );
};

export default FeatureMenu;
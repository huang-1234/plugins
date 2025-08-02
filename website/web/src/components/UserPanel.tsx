import React from 'react';
import { Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';

const UserPanel = () => {
  const items: MenuProps['items'] = [
    {
      key: '1',
      label: '个人中心',
      icon: <UserOutlined />
    },
    {
      key: '2',
      label: '设置',
      icon: <SettingOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: '3',
      label: '退出登录',
      icon: <LogoutOutlined />
    }
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
    </Dropdown>
  );
};

export default UserPanel;
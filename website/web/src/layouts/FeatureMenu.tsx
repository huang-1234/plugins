import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { menuItems } from './RouterMenu';

const FeatureMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems?.map(item => {
        if (item.children) {
          return {
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: item.children?.map(child => ({
              key: `${item.key}${child.key}`,
              icon: child.icon,
              label: child.label,
            })),
          }
        }
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
        }
      })}
      onClick={handleMenuClick}
      style={{ height: '100%', borderRight: 0 }}
    />
  );
};

export default FeatureMenu;
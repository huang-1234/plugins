import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Menu, Input } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import FeatureMenu from '@/layouts/FeatureMenu';
import UserPanel from '@/components/UserPanel';
import HotRecommendations from '@/components/HotRecommendations';
import SearchBar from '@/components/SearchBar';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}>
        <div className="logo" style={{ width: 120 }}>
          项目网站
        </div>
        <SearchBar />
        <UserPanel />
      </Header>
      <Layout>
        <Sider
          width={280}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{ background: '#fff' }}
        >
          <FeatureMenu />
        </Sider>
        <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
        <Sider width={280} style={{ background: '#fff' }}>
          <HotRecommendations />
        </Sider>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
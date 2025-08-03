import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Image } from 'antd';
import FeatureMenu from '@/layouts/FeatureMenu';
import UserPanel from '@/components/UserPanel';
import HotRecommendations from '@/components/HotRecommendations';
import SearchBar from '@/components/SearchBar';
import logo from '@/assets/svg/logo-32.svg';
import React from 'react';
const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [collapsedRight, setCollapsedRight] = useState(true);

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
        <div className="logo" style={{ width: 120, position: 'relative' }}>
          <Image preview={false} src={logo} alt="logo" style={{
            // position: 'absolute',
            // left: 16,
            // top: 16,
            width: 32, height: 32
          }} />
        </div>
        <SearchBar />
        <UserPanel />
      </Header>
      <Layout>
        <Sider
          width={160}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{ background: '#fff' }}
        >
          <FeatureMenu />
        </Sider>
        <Content style={{  padding: '12px', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
        <Sider
          width={280} style={{ background: '#fff' }}
          collapsed={collapsedRight}
          onCollapse={setCollapsedRight}
        >
          <HotRecommendations collapsed={collapsedRight} onCollapse={setCollapsedRight} />
        </Sider>
      </Layout>
    </Layout>
  );
};

export default React.memo(MainLayout);
import { useState } from 'react';
import styled from 'styled-components';
import PerformanceTab from './components/PerformanceTab';
import MemoryTab from './components/MemoryTab';
import './App.css';

const AppContainer = styled.div`
  width: 800px;
  min-height: 600px;
  padding: 16px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const Logo = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #4caf50;
  margin-right: 20px;
`;

const TabNav = styled.nav`
  display: flex;
  border-bottom: 1px solid #eee;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#4caf50' : 'transparent'};
  color: ${props => props.$active ? '#4caf50' : '#666'};
  font-weight: ${props => props.$active ? '600' : 'normal'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #4caf50;
  }
`;

const TabContent = styled.div`
  padding: 20px 0;
`;

const App: React.FC =  () => {
  const [activeTab, setActiveTab] = useState<'memory' | 'performance'>('memory');

  return (
    <AppContainer>
      <Header>
        <Logo>标签页监控</Logo>
        <TabNav>
          <TabButton
            $active={activeTab === 'memory'}
            onClick={() => setActiveTab('memory')}
          >
            内存监控
          </TabButton>
          <TabButton
            $active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
          >
            性能监控
          </TabButton>
        </TabNav>
      </Header>

      <TabContent>
        {activeTab === 'memory' && <MemoryTab />}
        {activeTab === 'performance' && <PerformanceTab />}
      </TabContent>
    </AppContainer>
  );
}

export default App;

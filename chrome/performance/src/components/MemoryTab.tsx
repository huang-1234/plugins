import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TabMemoryInfo } from '../types';

const TabContainer = styled.div`
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
  font-size: 18px;
`;

const SectionTitle = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
  color: #444;
  font-size: 16px;
`;

const TabsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  color: #555;
  font-weight: 600;
`;

const TableRow = styled.tr<{ $warning: boolean }>`
  background-color: ${props => props.$warning ? '#fff8f8' : 'white'};
  &:hover {
    background-color: ${props => props.$warning ? '#ffeeee' : '#f9f9f9'};
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #eee;
`;

const StatusIndicator = styled.span<{ $status: 'normal' | 'warning' | 'critical' }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${props => {
    switch (props.$status) {
      case 'normal': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'critical': return '#f44336';
      default: return '#999';
    }
  }};
`;

const ChartContainer = styled.div`
  height: 300px;
  margin: 20px 0;
`;

const NoData = styled.div`
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 16px;
`;

const DetailContainer = styled.div`
  margin-top: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
`;

const DetailTitle = styled.h4`
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const DetailItem = styled.div`
  margin-bottom: 8px;
`;

const DetailLabel = styled.span`
  color: #666;
  margin-right: 8px;
`;

const DetailValue = styled.span`
  font-weight: 500;
  color: #333;
`;

const MemoryTab: React.FC = () => {
  const [tabsData, setTabsData] = useState<TabMemoryInfo[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabMemoryInfo | null>(null);
  const [historyData, setHistoryData] = useState<TabMemoryInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 获取所有标签页的内存数据
    const fetchData = async () => {
      try {
        chrome.runtime.sendMessage(
          { type: 'requestMemoryData' },
          (response) => {
            if (response && response.tabs) {
              setTabsData(response.tabs);
              setLoading(false);
            }
          }
        );
      } catch (error) {
        console.error('获取内存数据失败:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  // 获取特定标签页的历史数据
  const fetchTabHistory = (tabId: number) => {
    chrome.runtime.sendMessage(
      { type: 'requestMemoryData', tabId },
      (response) => {
        if (response && response.tabs) {
          setHistoryData(response.tabs);
        }
      }
    );
  };

  const handleRowClick = (tab: TabMemoryInfo) => {
    setSelectedTab(tab);
    fetchTabHistory(tab.tabId);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const renderTabsTable = () => {
    if (loading) {
      return <NoData>加载中...</NoData>;
    }

    if (tabsData.length === 0) {
      return <NoData>暂无内存数据</NoData>;
    }

    // 按内存使用量排序
    const sortedTabs = [...tabsData].sort((a, b) => b.heapSize - a.heapSize);

    return (
      <TabsTable>
        <thead>
          <tr>
            <TableHeader>状态</TableHeader>
            <TableHeader>标签页</TableHeader>
            <TableHeader>JS堆内存</TableHeader>
            <TableHeader>DOM节点</TableHeader>
            <TableHeader>泄漏状态</TableHeader>
          </tr>
        </thead>
        <tbody>
          {sortedTabs.map((tab) => (
            <TableRow
              key={tab.tabId}
              $warning={tab.leakStatus !== 'normal'}
              onClick={() => handleRowClick(tab)}
              style={{ cursor: 'pointer' }}
            >
              <TableCell>
                <StatusIndicator $status={tab.leakStatus} />
              </TableCell>
              <TableCell>{tab.title}</TableCell>
              <TableCell>{formatBytes(tab.heapSize)}</TableCell>
              <TableCell>{tab.domNodeCount}</TableCell>
              <TableCell>{
                tab.leakStatus === 'normal' ? '正常' :
                tab.leakStatus === 'warning' ? '警告' : '严重'
              }</TableCell>
            </TableRow>
          ))}
        </tbody>
      </TabsTable>
    );
  };

  const renderTabDetail = () => {
    if (!selectedTab) return null;

    const chartData = historyData.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      heapSize: item.heapSize / (1024 * 1024), // 转换为MB
      domNodeCount: item.domNodeCount
    }));

    return (
      <DetailContainer>
        <DetailTitle>{selectedTab.title}</DetailTitle>
        <DetailGrid>
          <DetailItem>
            <DetailLabel>URL:</DetailLabel>
            <DetailValue>{selectedTab.url}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>JS堆内存:</DetailLabel>
            <DetailValue>{formatBytes(selectedTab.heapSize)}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>总堆大小:</DetailLabel>
            <DetailValue>{formatBytes(selectedTab.totalHeapSize)}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>DOM节点数:</DetailLabel>
            <DetailValue>{selectedTab.domNodeCount}</DetailValue>
          </DetailItem>
          {selectedTab.eventListenerCount && (
            <DetailItem>
              <DetailLabel>事件监听器:</DetailLabel>
              <DetailValue>{selectedTab.eventListenerCount}</DetailValue>
            </DetailItem>
          )}
          <DetailItem>
            <DetailLabel>泄漏状态:</DetailLabel>
            <DetailValue>{
              selectedTab.leakStatus === 'normal' ? '正常' :
              selectedTab.leakStatus === 'warning' ? '警告' : '严重'
            }</DetailValue>
          </DetailItem>
        </DetailGrid>

        {historyData.length > 0 && (
          <>
            <SectionTitle>内存使用趋势</SectionTitle>
            <ChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" name="内存 (MB)" />
                  <YAxis yAxisId="right" orientation="right" name="DOM节点" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="heapSize"
                    name="JS堆内存 (MB)"
                    stroke="#8884d8"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="domNodeCount"
                    name="DOM节点数"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </>
        )}
      </DetailContainer>
    );
  };

  return (
    <TabContainer>
      <Title>标签页内存监控</Title>
      <SectionTitle>标签页内存使用情况</SectionTitle>
      {renderTabsTable()}
      {selectedTab && renderTabDetail()}
    </TabContainer>
  );
};

export default MemoryTab;
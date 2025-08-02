import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Spin } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';

interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      content: input,
      role: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          content: data.data.content,
          role: 'assistant',
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('聊天请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="AI助手" style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <List
        itemLayout="horizontal"
        dataSource={messages}
        style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}
        renderItem={message => (
          <List.Item style={{ justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <List.Item.Meta
              avatar={
                message.role === 'user' ?
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} /> :
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
              }
              title={message.role === 'user' ? '你' : 'AI助手'}
              description={message.content}
              style={{
                maxWidth: '80%',
                backgroundColor: message.role === 'user' ? '#e6f7ff' : '#f6ffed',
                padding: '8px 16px',
                borderRadius: '8px'
              }}
            />
          </List.Item>
        )}
      />
      <div ref={messagesEndRef} />

      <div style={{ display: 'flex', marginTop: '16px' }}>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="请输入消息..."
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          style={{ marginLeft: '8px' }}
        />
      </div>

      {loading && <Spin tip="AI思考中..." style={{ marginTop: '16px' }} />}
    </Card>
  );
};

export default ChatPage;
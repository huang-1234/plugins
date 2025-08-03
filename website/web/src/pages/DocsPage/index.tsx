import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Card, Spin, List, Typography, Row, Col, Empty, message } from 'antd';
import styles from './index.module.less';

const { Title } = Typography;

interface DocItem {
  name: string;
  path: string;
  lastModified: string;
}

const DocumentPage = () => {
  const { doc_name } = useParams<{ doc_name: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [docList, setDocList] = useState<DocItem[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const navigate = useNavigate();

  // Fetch document list
  useEffect(() => {
    setLoadingList(true);
    // Fixed the API endpoint URL to match the server route
    fetch('/api/docs')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(res => {
        console.log('Document list response:', res);
        if (res.success && Array.isArray(res.data)) {
          const mdFiles = res.data.map((file: any) => ({
            name: file.name,
            path: file.path,
            lastModified: file.lastModified || new Date().toISOString()
          }));
          setDocList(mdFiles);
        } else if (Array.isArray(res)) {
          // Handle case where the API returns just an array of filenames
          const mdFiles = res
            .filter((file: string) => file.endsWith('.md') || file.endsWith('.mdx'))
            .map((file: string) => ({
              name: file.replace(/\.(md|mdx)$/, ''),
              path: file,
              lastModified: new Date().toISOString()
            }));
          setDocList(mdFiles);
        }
        setLoadingList(false);
      })
      .catch(err => {
        console.error('Failed to fetch document list:', err);
        message.error('Failed to load document list');
        setLoadingList(false);
      });
  }, []);

  // Fetch document content when doc_name changes
  useEffect(() => {
    if (doc_name) {
      setLoading(true);
      fetch(`/api/docs/${doc_name}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then(data => {
          setContent(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch document:', err);
          message.error('Failed to load document');
          setLoading(false);
        });
    } else {
      setContent('');
      setLoading(false);
    }
  }, [doc_name]);

  const handleDocClick = (docName: string) => {
    navigate(`/docs/${docName}`);
  };

  const renderDocContent = () => {
    if (!doc_name) {
      return (
        <Empty
          description="Select a document from the list to view its content"
          style={{ margin: '40px 0' }}
        />
      );
    }

    if (loading) {
      return <Spin tip="Loading..." />;
    }

    return (
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              // @ts-ignore - Ignoring type issues with SyntaxHighlighter props
              <SyntaxHighlighter
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className={styles.docsPageContainer}>
      <Title level={2}>Documentation</Title>
      <Row gutter={24}>
        <Col span={6}>
          <Card title="Document List" className={styles.docListCard}>
            {loadingList ? (
              <Spin tip="Loading document list..." />
            ) : docList.length === 0 ? (
              <Empty description="No documents found" />
            ) : (
              <List
                dataSource={docList}
                renderItem={item => (
                  <List.Item
                    onClick={() => handleDocClick(item.name)}
                    className={`${styles.docItem} ${doc_name === item.name ? styles.activeDoc : ''}`}
                  >
                    {item.name}
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col span={18}>
          <Card
            title={doc_name ? `Document: ${doc_name}` : 'Document Content'}
            className={styles.docContentCard}
          >
            {renderDocContent()}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(DocumentPage);
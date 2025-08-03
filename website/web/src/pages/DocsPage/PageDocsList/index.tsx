import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, List, Empty, message } from 'antd';
import styles from './index.module.less';

interface DocItem {
  name: string;
  path: string;
  lastModified: string;
}

const PageDocsList: React.FC = () => {
  const { doc_name } = useParams<{ doc_name: string }>();
  const [docList, setDocList] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Fetch document list
  useEffect(() => {
    setLoading(true);
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
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch document list:', err);
        message.error('Failed to load document list');
        setLoading(false);
      });
  }, []);

  const handleDocClick = (docName: string) => {
    navigate(`/docs/${docName}`);
  };

  return (
    <Card title="Document List" className={styles.docListCard}>
      {loading ? (
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
  );
};

export default React.memo(PageDocsList);
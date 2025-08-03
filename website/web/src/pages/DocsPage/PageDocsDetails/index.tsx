import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Card, Spin, Empty, message } from 'antd';
import styles from './index.module.less';

const PageDocsDetails: React.FC = () => {
  const { doc_name } = useParams<{ doc_name: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

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
    <Card
      title={doc_name ? `Document: ${doc_name}` : 'Document Content'}
      className={styles.docContentCard}
    >
      {renderDocContent()}
    </Card>
  );
};

export default React.memo(PageDocsDetails);
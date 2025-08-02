import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Card, Spin } from 'antd';

const DocumentPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`/docs/${docId}`)
      .then(response => response.text())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('获取文档失败:', err);
        setLoading(false);
      });
  }, [docId]);

  return (
    <Card title={`文档: ${docId}`}>
      {loading ? (
        <Spin tip="加载中..." />
      ) : (
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter language={match[1]} PreTag="div" {...props}>
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
      )}
    </Card>
  );
};

export default DocumentPage;
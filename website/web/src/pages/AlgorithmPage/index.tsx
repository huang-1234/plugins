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

const AlgorithmPage = () => {


  return (
    <div className={styles.docsPageContainer}>
      <Title level={2}>Documentation</Title>
      <Row gutter={24}>
      </Row>
    </div>
  );
};

export default React.memo(AlgorithmPage);
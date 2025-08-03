
import loadable, { Loadable } from 'loadable-components'
import { FileTextOutlined, UploadOutlined, MessageOutlined, HomeOutlined, BorderOuterOutlined } from '@ant-design/icons';
// 首页
const HomePage = loadable(/* webpackChunkName: "HomePage" */() => import('../pages/HomePage'));
// 聊天
const ChatPage = loadable(/* webpackChunkName: "ChatPage" */() => import('../pages/ChatPage'));
// 文件上传
const UploadPage = loadable(/* webpackChunkName: "UploadPage" */() => import('../pages/UploadPage'));
// 文档
const PageDocsList = loadable(/* webpackChunkName: "PageDocsList" */ () => import('../pages/DocsPage/PageDocsList'));
const PageDocsDetails = loadable(/* webpackChunkName: "PageDocsDetails" */ () => import('../pages/DocsPage/PageDocsDetails'));
const DocsPage = loadable(/* webpackChunkName: "DocsPage" */ () => import('../pages/DocsPage'));
// 图表
const PageCytoscape = loadable(/* webpackChunkName: "PageCytoscape" */ () => import('../pages/Graph/Cytoscape/index'));
const PageWorkflow = loadable(/* webpackChunkName: "PageWorkflow" */ () => import('../pages/Graph/WorkFlow'));
// 知识图谱
// const PageKnowledgeGraph = loadable(() => import('../pages/Graph/KnowledgeGraph'));


export interface IMenu {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: IMenu[];
  component?: Loadable<{}> | React.ComponentType<any>;
}
export const menuItems: IMenu[] = [
  {
    key: '/',
    label: '首页',
    icon: <HomeOutlined />,
    component: HomePage
  },
  {
    key: '/docs',
    label: '文档',
    icon: <FileTextOutlined />,
    component: DocsPage,
    children: [
      {
        key: '/list',
        label: '文档列表',
        icon: <FileTextOutlined />,
        component: PageDocsList
      },
      {
        key: '/:doc_name',
        label: '文档详情',
        icon: <FileTextOutlined />,
        component: PageDocsDetails
      }
    ]
  },
  {
    key: '/upload',
    label: '文件上传',
    icon: <UploadOutlined />,
    component: UploadPage
  },
  {
    key: '/chat',
    label: 'AI助手',
    icon: <MessageOutlined />,
    component: ChatPage
  },
  {
    key: '/graph',
    label: '图表',
    icon: <BorderOuterOutlined />,
    children: [
      {
        key: '/cytoscape',
        label: 'Cytoscape',
        icon: <BorderOuterOutlined />,
        component: PageCytoscape
      },
      {
        key: '/workflow',
        label: '工作流',
        icon: <BorderOuterOutlined />,
        component: PageWorkflow
      }
    ],
  },
];


import loadable, { Loadable } from 'loadable-components'
import { FileTextOutlined, UploadOutlined, MessageOutlined, HomeOutlined, BorderOuterOutlined } from '@ant-design/icons';
const HomePage = loadable(/* webpackChunkName: "HomePage" */ () => import('../pages/HomePage'));
const ChatPage = loadable(/* webpackChunkName: "ChatPage" */ () => import('../pages/ChatPage'));
const UploadPage = loadable(/* webpackChunkName: "UploadPage" */ () => import('../pages/UploadPage'));
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
    key: '/docs/intro',
    label: '文档',
    icon: <FileTextOutlined />,
    component: DocsPage
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

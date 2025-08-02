
import loadable, { Loadable } from 'loadable-components'
import { FileTextOutlined, UploadOutlined, MessageOutlined, HomeOutlined, BorderOuterOutlined } from '@ant-design/icons';
const HomePage = loadable(() => import('../pages/HomePage'));
const GraphPage = loadable(() => import('../pages/GraphPage'));
const ChatPage = loadable(() => import('../pages/ChatPage'));
const UploadPage = loadable(() => import('../pages/UploadPage'));
const DocsPage = loadable(() => import('../pages/DocsPage'));


export interface IMenu {
  key: string;
  icon: React.ReactNode;
  label: string;
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
    component: GraphPage,
  }
];

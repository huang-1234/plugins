// 全局类型声明

// 为window对象添加全局属性
interface Window {
  __INITIAL_DATA__: any;
  assetMap: Record<string, string>;
}

// 应用组件Props类型
interface AppSSRProps {
  url?: string;
  initialData?: any;
}

// 路由组件Props类型
interface RouterProps {
  url?: string;
  initialData?: any;
}

// 页面组件Props类型
interface PageComponentProps {
  data?: any;
}

// 错误边界组件Props类型
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

// 错误边界组件State类型
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
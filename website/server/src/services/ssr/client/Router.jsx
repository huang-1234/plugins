import React from 'react';

// 页面组件
const Home = ({ data }) => (
  <div>
    <h1>{data?.title || '首页'}</h1>
    <p>{data?.content || '这是服务端渲染的首页内容'}</p>
    {data?.items && (
      <ul>
        {data.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )}
  </div>
);

const About = ({ data }) => (
  <div>
    <h1>{data?.title || '关于我们'}</h1>
    <p>{data?.content || '这是关于页面内容'}</p>
    {data?.team && (
      <div>
        <h2>团队成员</h2>
        <ul>
          {data.team.map((member, index) => (
            <li key={index}>{member.name} - {member.role}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const NotFound = () => (
  <div>
    <h1>404 - 页面未找到</h1>
    <p>您请求的页面不存在</p>
  </div>
);

// 路由配置
const routes = [
  { path: '/', component: Home, exact: true },
  { path: '/about', component: About },
  { path: '*', component: NotFound }
];

// 简单的路由匹配函数
const matchRoute = (pathname) => {
  // 精确匹配优先
  const exactMatch = routes.find(route => route.exact && route.path === pathname);
  if (exactMatch) return exactMatch;

  // 非精确匹配
  const match = routes.find(route => {
    if (route.path === '*') return false;
    return pathname.startsWith(route.path);
  });

  // 返回匹配的路由或404路由
  return match || routes.find(route => route.path === '*');
};

// 路由组件
export const Router = ({ url, initialData }) => {
  const pathname = url || '/';
  const route = matchRoute(pathname);
  const Component = route.component;

  // 使用客户端数据或服务端预取的数据
  const data = initialData || (typeof window !== 'undefined' ? window.__INITIAL_DATA__ : null);

  return <Component data={data} />;
};
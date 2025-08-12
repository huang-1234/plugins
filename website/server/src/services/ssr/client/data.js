// 模拟数据获取函数
export const fetchData = async (path) => {
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 100));

  // 根据路径返回不同的数据
  switch (path) {
    case '/':
      return {
        title: '首页',
        content: '欢迎访问我们的网站',
        items: ['项目1', '项目2', '项目3']
      };
    case '/about':
      return {
        title: '关于我们',
        content: '我们是一个专注于技术的团队',
        team: [
          { name: '张三', role: '前端开发' },
          { name: '李四', role: '后端开发' },
          { name: '王五', role: 'UI设计' }
        ]
      };
    default:
      return { title: '未找到', content: '页面不存在' };
  }
};
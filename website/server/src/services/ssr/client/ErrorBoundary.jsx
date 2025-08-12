import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 更新状态，下次渲染时显示错误UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 可以将错误日志上报到服务器
    console.error('组件渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 渲染错误UI
      return (
        <div style={{ padding: '20px', color: 'red', border: '1px solid red' }}>
          <h2>组件渲染出错</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
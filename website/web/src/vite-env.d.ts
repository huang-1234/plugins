/// <reference types="vite/client" />

// 修复React 18类型问题
declare namespace React {
  // 解决ReactNode类型冲突
  interface ReactElement {
    children?: ReactNode;
  }

  // 解决ReactPortal类型问题
  interface ReactPortal {
    children?: ReactNode;
  }
}
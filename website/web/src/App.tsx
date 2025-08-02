import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import './App.css';
import {  menuItems } from './layouts/RouterMenu';

function App() {
  const _renderMenuPage = () => {
    return menuItems.map(item => {
      const Component = item.component;
      if (Component) {
        return <Route key={item.key} path={item.key} element={<Component />} />;
      }
      return null;
    });
  }
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        {_renderMenuPage()}
      </Route>
    </Routes>
  );
}

export default App;
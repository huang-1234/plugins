import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import DocumentPage from './pages/DocumentPage';
import UploadPage from './pages/UploadPage';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="docs/:docId" element={<DocumentPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
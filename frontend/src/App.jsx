import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import UploadPage from './pages/UploadPage';
import ScorecardsPage from './pages/ScorecardsPage';
import TechDetailPage from './pages/TechDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<UploadPage />} />
        <Route path="scorecards" element={<ScorecardsPage />} />
        <Route path="scorecards/:id" element={<TechDetailPage />} />
      </Route>
    </Routes>
  );
}

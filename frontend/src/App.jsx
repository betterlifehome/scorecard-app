import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import UploadPage from './pages/UploadPage';
import ScorecardsPage from './pages/ScorecardsPage';
import TechDetailPage from './pages/TechDetailPage';
import EmployeesPage from './pages/EmployeesPage';
import SendScorecardsPage from './pages/SendScorecardsPage';
import BenefitsPage from './pages/BenefitsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<UploadPage />} />
        <Route path="scorecards" element={<ScorecardsPage />} />
        <Route path="scorecards/:id" element={<TechDetailPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="send" element={<SendScorecardsPage />} />
        <Route path="benefits" element={<BenefitsPage />} />
      </Route>
    </Routes>
  );
}

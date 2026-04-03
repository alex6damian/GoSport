import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import FavoritesPage from './pages/FavoritesPage';
import UserPage from './pages/UserPage';
import UserVideosPage from './pages/UserVideosPage';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Routes with Navbar and Footer */}
      <Route element={<MainLayout><Outlet /></MainLayout>}>
        <Route path="/users/:username" element={<UserPage />} />
        <Route path="/users/:username/videos" element={<UserVideosPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/me/history" element={<HistoryPage />} />
          <Route path="/me/favorites" element={<FavoritesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

// Outlet is needed for nested routes with layouts
import { Outlet } from 'react-router-dom';

export default App;

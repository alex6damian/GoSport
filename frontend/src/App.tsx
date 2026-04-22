import { Routes, Route, Outlet } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import BrowsePage from './pages/BrowsePage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import FavoritesPage from './pages/FavoritesPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import UserPage from './pages/UserPage';
import UserVideosPage from './pages/UserVideosPage';
import EditProfilePage from './pages/EditProfilePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import VideoPlayer from './pages/VideoPlayer';

function App() {
  return (
    <Routes>
      {/* Home page - no navbar */}
      <Route path="/" element={<HomePage />} />
      
      {/* Public Routes - no navbar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Browse page - protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/browse" element={<BrowsePage />} />
      </Route>

      {/* Video Player page - protected, no navbar */}
      <Route element={<ProtectedRoute />}>
        <Route path="/videos/:videoId" element={<VideoPlayer />} />
      </Route>

      {/* User Profile pages - protected, no navbar */}
      <Route element={<ProtectedRoute />}>
        <Route path="users/:username" element={<UserPage />} />
        <Route path="users/:username/videos" element={<UserVideosPage />} />
      </Route>

      {/* Routes with Navbar and Footer */}
      <Route element={<MainLayout />}>
        <Route path="search" element={<SearchResultsPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="me" element={<ProfilePage />} />
          <Route path="edit-profile" element={<EditProfilePage />} />
          <Route path="me/history" element={<HistoryPage />} />
          <Route path="me/favorites" element={<FavoritesPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

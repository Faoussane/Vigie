import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import { api } from "./lib/api";
import AboutPage from "./pages/AboutPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import ArticlesPage from "./pages/ArticlesPage";
import AuthorPage from "./pages/AuthorPage";
import CategoriesPage from "./pages/CategoriesPage";
import FavoritesPage from "./pages/FavoritesPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SmartSearchPage from "./pages/SmartSearchPage";
import SourcesPage from "./pages/SourcesPage";
import AdminArticlesPage from "./pages/admin/AdminArticlesPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminCommentsPage from "./pages/admin/AdminCommentsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminSourcesPage from "./pages/admin/AdminSourcesPage";
import AdminTagsPage from "./pages/admin/AdminTagsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import ArticleEditorPage from "./pages/admin/ArticleEditorPage";
import VeillePage from "./pages/admin/VeillePage";
import { useAuth } from "./store/auth";

export default function App() {
  const { access, setUser, logout } = useAuth();

  // Resynchronise le profil (rôle, compte désactivé...) à chaque chargement de l'application.
  useEffect(() => {
    if (access) api.get("/auth/me/").then((r) => setUser(r.data)).catch(() => logout());
  }, [access, setUser, logout]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticleDetailPage />} />
          <Route path="/authors/:username" element={<AuthorPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/smart-search" element={<SmartSearchPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="articles" element={<AdminArticlesPage />} />
            <Route path="articles/new" element={<ArticleEditorPage />} />
            <Route path="articles/:slug/edit" element={<ArticleEditorPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="tags" element={<AdminTagsPage />} />
            <Route path="sources" element={<AdminSourcesPage />} />
            <Route path="veille" element={<VeillePage />} />
            <Route path="comments" element={<AdminCommentsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

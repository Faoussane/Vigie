import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";

/** Protège une route : connexion requise, et rôle admin si ``admin`` est vrai. */
export default function RequireAuth({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

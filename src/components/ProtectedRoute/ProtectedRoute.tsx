import { Navigate, Outlet, useLocation } from "react-router-dom";
import { session } from "../../services/session";
import type { UserRole } from "../../types/auth";

// Libera as rotas filhas apenas para usuários logados (e, se informado, com uma das roles).
function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const location = useLocation();
  const user = session.getUser();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}

export default ProtectedRoute;

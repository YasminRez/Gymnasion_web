import { Navigate, Outlet } from "react-router-dom";
import { homeForRole, session } from "../../services/session";

// Todos os perfis autenticados seguem para sua área inicial.
function PublicOnlyRoute() {
  const user = session.getUser();
  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  return <Outlet />;
}

export default PublicOnlyRoute;

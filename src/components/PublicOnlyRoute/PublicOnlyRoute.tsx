import { Navigate, Outlet } from "react-router-dom";
import { PRIVATE_HOME, session } from "../../services/session";

// Login e cadastro não fazem sentido para quem já está logado como personal.
function PublicOnlyRoute() {
  if (session.getUser()?.role === "PERSONAL_TRAINER") return <Navigate to={PRIVATE_HOME} replace />;

  return <Outlet />;
}

export default PublicOnlyRoute;

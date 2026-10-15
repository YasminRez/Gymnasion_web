import { Navigate, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import { authService } from "../../services/authService";
import { session } from "../../services/session";
import "./AccountHome.css";

export default function AccountHome() {
  const navigate = useNavigate();
  const user = session.getUser();
  if (user?.role === "PERSONAL_TRAINER") return <Navigate to="/home" replace />;
  return <main className="account-home">
    <section className="account-home__card" aria-labelledby="account-title">
      <span className="account-home__brand">gymnasion</span>
      <h1 id="account-title">{user?.role === "ALUNO" ? "Bem-vindo à sua área de aluno" : "Bem-vindo à sua conta"}</h1>
      <p role="status">Você está autenticado com sucesso.</p>
      <p>As funcionalidades desta área ainda estão em desenvolvimento.</p>
      <Button variant="secondary" onClick={() => { authService.logout(); navigate("/login", { replace: true }); }}>Sair da conta</Button>
    </section>
  </main>;
}

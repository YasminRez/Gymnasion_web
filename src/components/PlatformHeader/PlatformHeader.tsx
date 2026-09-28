import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import "./PlatformHeader.css";
function PlatformHeader({ activePage = "home" }: { activePage?: "home" | "students" | "groups" | "metrics" }) {
  const navigate = useNavigate();
  function logout() { authService.logout(); navigate("/login", { replace: true }); }
  return <header className="platform-header">
    <nav aria-label="Navegação da plataforma" className="platform-header__nav">
      <a href="/home" aria-current={activePage === "home" ? "page" : undefined}>Home</a>
      <a href="/alunos" aria-current={activePage === "students" ? "page" : undefined}>Alunos</a>
      <a href="/grupos" aria-current={activePage === "groups" ? "page" : undefined}>Grupos</a>
      <a href="/metricas" aria-current={activePage === "metrics" ? "page" : undefined}>Métricas</a>
      <a href="/grupos" aria-current={activePage === "groups" ? "page" : undefined}>Grupos</a>
      <button type="button" disabled title="Em breve">Modalidades</button>
    </nav>
    <div className="platform-header__account">
      <button type="button" className="platform-header__logout" onClick={logout}>Sair</button>
      <a className="platform-header__brand" href="/home" aria-label="Gymnasion — Home">GYMNASION</a>
    </div>
  </header>;
}
export default PlatformHeader;

import { Link } from "react-router-dom";
import "./HomeNavigation.css";
function HomeNavigation({ activeSection = "overview", unreadCount = 0 }: { activeSection?: "overview" | "notifications" | "recent"; unreadCount?: number }) {
  return <nav className="home-navigation" aria-label="Seções da Home">
    <Link to="/home" aria-current={activeSection === "overview" ? "page" : undefined}><span aria-hidden="true">▦</span> Visão geral</Link>
    <Link to="/home/notificacoes" aria-current={activeSection === "notifications" ? "page" : undefined}><span aria-hidden="true">♧</span> Notificações {unreadCount > 0 && <span className="home-navigation__badge" aria-label={`${unreadCount} não lidas`}>{unreadCount}</span>}</Link>
    <Link to="/home/ultimos-aceitos" aria-current={activeSection === "recent" ? "page" : undefined}><span aria-hidden="true">✓</span> Últimos aceitos</Link>
    <button type="button" disabled title="Em breve"><span aria-hidden="true">△</span> Sem treino <small>Em breve</small></button>
  </nav>;
}
export default HomeNavigation;

import "./HomeNavigation.css";
function HomeNavigation({ activeSection = "overview", unreadCount = 0 }: { activeSection?: "overview" | "notifications"; unreadCount?: number }) {
  return <nav className="home-navigation" aria-label="Seções da Home">
    <a href="/home" aria-current={activeSection === "overview" ? "page" : undefined}><span aria-hidden="true">▦</span> Visão geral</a>
    <a href="/home/notificacoes" aria-current={activeSection === "notifications" ? "page" : undefined}><span aria-hidden="true">♧</span> Notificações {unreadCount > 0 && <span className="home-navigation__badge" aria-label={`${unreadCount} não lidas`}>{unreadCount}</span>}</a>
    <button type="button" disabled title="Em breve"><span aria-hidden="true">✓</span> Últimos aceitos <small>Em breve</small></button>
    <button type="button" disabled title="Em breve"><span aria-hidden="true">△</span> Sem treino <small>Em breve</small></button>
  </nav>;
}
export default HomeNavigation;

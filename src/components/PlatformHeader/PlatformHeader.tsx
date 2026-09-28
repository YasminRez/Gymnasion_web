import "./PlatformHeader.css";
function PlatformHeader({ activePage = "home" }: { activePage?: "home" | "students" | "metrics" }) {
  return <header className="platform-header">
    <nav aria-label="Navegação da plataforma" className="platform-header__nav">
      <a href="/home" aria-current={activePage === "home" ? "page" : undefined}>Home</a>
      <a href="/alunos" aria-current={activePage === "students" ? "page" : undefined}>Alunos</a>
      <a href="/metricas" aria-current={activePage === "metrics" ? "page" : undefined}>Métricas</a>
      <button type="button" disabled title="Em breve">Grupos</button>
      <button type="button" disabled title="Em breve">Modalidades</button>
    </nav>
    <a className="platform-header__brand" href="/home" aria-label="Gymnasion — Home">GYMNASION</a>
  </header>;
}
export default PlatformHeader;

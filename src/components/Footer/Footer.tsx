import { Link } from "react-router-dom";
import Logo from "../Logo/Logo";
import "./Footer.css";
export default function Footer() {
  return <footer className="institutional-footer"><div className="institutional-container">
    <div className="institutional-footer__top"><div className="institutional-footer__brand"><a href="#home" aria-label="Gymnasion — início"><Logo variant="white" /></a><p>Plataforma SaaS para personal trainers acompanharem a evolução dos seus alunos.</p></div>
      <nav className="institutional-footer__links" aria-label="Rodapé">
        <div><h2>Produto</h2><a href="#funcionalidades">Funcionalidades</a><a href="#modalidades">Modalidades</a><a href="#assinatura">Assinatura</a></div>
        <div><h2>Conta</h2><Link to="/login">Entrar</Link><Link to="/cadastro">Criar conta</Link><button type="button" disabled title="Em breve">Suporte</button></div>
        <div><h2>Legal</h2>{["Termos de uso", "Privacidade (LGPD)", "Cookies"].map(label => <button type="button" key={label} disabled title="Em breve">{label}</button>)}</div>
      </nav>
    </div>
    <div className="institutional-footer__bottom"><p>© {new Date().getFullYear()} Gymnasion. Todos os direitos reservados.</p><p>Compatível com Chrome, Firefox, Edge e Safari</p></div>
  </div></footer>;
}

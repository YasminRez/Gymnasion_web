import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo/Logo";
import TermsModal from "../TermsModal/TermsModal";
import "./AuthLayout.css";

export default function AuthLayout({ children, variant }: { children: ReactNode; variant: "login" | "signup" }) {
  const [termsOpen, setTermsOpen] = useState(false);
  return <main className={`auth-layout auth-layout--${variant}`}>
    <div className="auth-layout__form-side">
      <header className="auth-layout__header">
        <Link to="/" aria-label="Gymnasion — início"><Logo /></Link>
        <Link className="auth-layout__back" to="/"><img src="/auth/back.svg" alt="" />Voltar ao site</Link>
      </header>
      <div className="auth-layout__content">{children}</div>
      <footer className="auth-layout__footer">© 2026 Gymnasion · <button onClick={() => setTermsOpen(true)}>Termos de uso</button> · <button onClick={() => setTermsOpen(true)}>Política de privacidade</button></footer>
    </div>
    <aside className="auth-layout__visual-side" aria-label="Conheça o Gymnasion">
      <div className="auth-layout__visual">
        <img className="auth-layout__photo" src={`/auth/${variant}.png`} alt="" />
        <div className="auth-layout__visual-content">
          <div className="auth-layout__sports">{["Natação", "Tênis", "Academia", "+ Corrida, Ciclismo…"].map(sport => <span key={sport}>{sport}</span>)}</div>
          <h2>{variant === "login" ? "Treinos inteligentes, evolução visível." : "Seu método, seus dados, sua evolução."}</h2>
          <p>{variant === "login" ? "Centralize alunos, rotinas e métricas de desempenho em um só lugar." : "Cadastre-se e organize treinos de qualquer modalidade com métricas personalizadas."}</p>
          <div className="auth-layout__insight"><span><img src="/auth/trend.svg" alt="" /></span><div><strong>Ana Beatriz melhorou 8% no ritmo de 100m</strong><small>Últimas 4 semanas · Natação</small></div></div>
        </div>
      </div>
    </aside>
    {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
  </main>;
}

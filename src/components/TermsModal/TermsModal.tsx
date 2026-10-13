import { useEffect, useRef } from "react";
import Button from "../Button/Button";
import "./TermsModal.css";

const sections = [
  ["1. Coleta de dados", "Coletamos nome, e-mail, CPF e contato para criação da conta e vínculo entre personal e aluno."],
  ["2. Uso das informações", "Os dados de desempenho são utilizados para gerar gráficos, relatórios e acompanhar a evolução dos treinos."],
  ["3. Seus direitos (LGPD)", "Você pode solicitar acesso, correção, anonimização ou exclusão dos seus dados pessoais."],
  ["4. Segurança", "Sua senha é armazenada de forma protegida. Não compartilhe suas credenciais de acesso."],
  ["5. Aceite", "Nesta versão, o aceite é solicitado no formulário. O registro de data e hora do aceite ainda não está disponível."],
];

export default function TermsModal({ onClose, onAccept }: { onClose: () => void; onAccept?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);
  return <dialog ref={dialog} className="terms-modal" aria-labelledby="terms-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="terms-modal__header">
      <span className="terms-modal__icon"><img src="/auth/shield.svg" alt="" /></span>
      <div><h2 id="terms-title">Termos de Uso e Política de Privacidade</h2><p>Informações sobre o uso da plataforma</p></div>
      <button className="terms-modal__close" aria-label="Fechar termos" onClick={onClose} autoFocus><img src="/auth/close.svg" alt="" /></button>
    </header>
    <div className="terms-modal__content" tabIndex={0}>{sections.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}</div>
    <footer><Button variant="secondary" onClick={onClose}>Fechar</Button>{onAccept && <Button onClick={onAccept}>Li e aceito</Button>}</footer>
  </dialog>;
}

import { useState } from "react";
import "./InviteEmail.css";
function InviteEmail({ initialEmail, expiresAt, onCancel, onSubmit }: { initialEmail: string; expiresAt: number; onCancel: () => void; onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  return <form onSubmit={(event) => { event.preventDefault(); if (Date.now() >= expiresAt) { setError("O link expirou. Volte e gere um novo convite."); return; } onSubmit(email.trim()); }}>
    <p className="student-invite__subtitle">O link de convite será enviado diretamente ao e-mail do aluno.</p>
    <div className="student-invite__divider"><label htmlFor="invite-email">E-mail do aluno</label><div className="invite-email__field"><span aria-hidden="true">✉</span><input id="invite-email" type="email" autoComplete="email" placeholder="aluno@email.com" required value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} /></div></div>
    <p className="student-invite__hint">◷ O link expira 15 minutos após ser gerado.</p>
    {error && <p className="invite-email__error" role="alert">{error}</p>}
    <div className="student-invite__actions student-invite__divider"><button type="button" onClick={onCancel}>Cancelar</button><button className="student-invite__primary" type="submit">Enviar link</button></div>
  </form>;
}
export default InviteEmail;

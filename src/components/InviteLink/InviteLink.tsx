import { useEffect, useState } from "react";
import "./InviteLink.css";
function InviteLink({ sport, invite, onEmail, onRegenerate }: { sport: string; invite: { url: string; expiresAt: number }; onEmail: () => void; onRegenerate: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((invite.expiresAt - Date.now()) / 1000)));
  const [notice, setNotice] = useState("");
  useEffect(() => { const update = () => setRemaining(Math.max(0, Math.ceil((invite.expiresAt - Date.now()) / 1000))); update(); const timer = window.setInterval(update, 1000); return () => window.clearInterval(timer); }, [invite.expiresAt]);
  async function copyLink() {
    if (Date.now() >= invite.expiresAt) { setNotice("O link expirou. Gere um novo convite."); return; }
    try { await navigator.clipboard.writeText(invite.url); setNotice("Link copiado!"); }
    catch { setNotice("Não foi possível copiar. Selecione o link e copie manualmente."); }
  }
  return <>
    <p className="student-invite__subtitle">Modalidade selecionada: {sport}</p>
    <label htmlFor="invite-url">Link de convite</label>
    <div className="invite-link__field"><input id="invite-url" value={invite.url} readOnly onFocus={(event) => event.target.select()} /><button type="button" aria-label="Copiar link de convite" disabled={!remaining} onClick={copyLink}>⧉</button></div>
    <p className="student-invite__hint">◷ {remaining ? `Expira em ${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")} minutos` : "Link expirado. Gere um novo convite."}</p>
    <div className="student-invite__actions student-invite__divider"><button type="button" onClick={onEmail} disabled={!remaining}>✉ Enviar por e-mail</button>{remaining ? <button type="button" className="student-invite__primary" onClick={copyLink}>Copiar link</button> : <button type="button" className="student-invite__primary" onClick={() => { setNotice(""); onRegenerate(); }}>Gerar novo link</button>}</div>
    <p className="invite-link__notice" role="status">{notice}</p>
  </>;
}
export default InviteLink;

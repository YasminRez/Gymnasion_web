import { useEffect, useRef, useState } from "react";
import InviteLink from "../InviteLink/InviteLink";
import InviteEmail from "../InviteEmail/InviteEmail";
import InviteResult from "../InviteResult/InviteResult";
import "./StudentInviteModal.css";
type Step = "sport" | "link" | "email" | "success" | "duplicate";
function StudentInviteModal({ onClose, onViewStudents }: { onClose: () => void; onViewStudents: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("sport");
  const [sport, setSport] = useState("");
  const [email, setEmail] = useState("");
  const [invite, setInvite] = useState({ url: "", expiresAt: 0 });
  const titles = { sport: "Cadastrar Aluno", link: "Link gerado com sucesso!", email: "Enviar link por e-mail", success: "E-mail enviado com sucesso!", duplicate: "E-mail já cadastrado" };
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previousOverflow; if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, []);
  useEffect(() => { dialog.current?.querySelector<HTMLElement>("h2")?.focus(); }, [step]);
  function generateLink() {
    // Demo only: replace with an invitation and expiration returned by the API.
    setInvite({ url: `https://gymnasion.invalid/convite/${crypto.randomUUID()}`, expiresAt: Date.now() + 900000 });
    setStep("link");
  }
  const result = step === "success" || step === "duplicate";
  return <dialog ref={dialog} className={`student-invite ${result ? `student-invite--${step}` : ""}`} onCancel={(event) => { event.preventDefault(); onClose(); }} aria-labelledby="student-invite-title" aria-describedby="student-invite-demo">
    {!result && <button type="button" className="student-invite__close" aria-label="Fechar" onClick={onClose}>×</button>}
    {result && <div className="student-invite__symbol" aria-hidden="true">{step === "success" ? "✓" : "×"}</div>}
    <h2 id="student-invite-title" tabIndex={-1}>{titles[step]}</h2>
    {step === "sport" && <form onSubmit={(event) => { event.preventDefault(); generateLink(); }}>
      <p className="student-invite__subtitle">Selecione a modalidade e envie o link ao aluno.</p>
      <label htmlFor="invite-sport">Modalidade</label>
      <select id="invite-sport" required value={sport} onChange={(event) => setSport(event.target.value)}><option value="" disabled>Selecionar modalidade</option><option>Natação</option><option>Academia</option><option>Tênis</option></select>
      <p className="student-invite__hint student-invite__divider">O link expira em 15 minutos após ser gerado.</p>
      <div className="student-invite__actions"><button type="button" onClick={onClose}>Cancelar</button><button className="student-invite__primary" type="submit">Gerar Link</button></div>
    </form>}
    {step === "link" && <InviteLink sport={sport} invite={invite} onEmail={() => setStep("email")} onRegenerate={generateLink} />}
    {step === "email" && <InviteEmail initialEmail={email} expiresAt={invite.expiresAt} onCancel={() => setStep("link")} onSubmit={(value) => { setEmail(value); setStep(value.toLowerCase() === "aluno@email.com" ? "duplicate" : "success"); }} />}
    {result && <InviteResult success={step === "success"} email={email} onClose={onClose} onRetry={() => setStep("email")} onViewStudents={onViewStudents} />}
    <p id="student-invite-demo" className="student-invite__demo">Demonstração: convite sem validade real e nenhum e-mail enviado.{step === "email" && " Use aluno@email.com para testar e-mail já cadastrado."}</p>
  </dialog>;
}
export default StudentInviteModal;

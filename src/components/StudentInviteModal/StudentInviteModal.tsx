import { useEffect, useRef, useState } from "react";
import InviteLink from "../InviteLink/InviteLink";
import InviteEmail from "../InviteEmail/InviteEmail";
import InviteResult from "../InviteResult/InviteResult";
import { modalidadeService } from "../../services/modalidadeService";
import { personalTrainerService } from "../../services/personalTrainerService";
import { handleApiError } from "../../utils/handleApiError";
import type { Modalidade } from "../../types/modalidade";
import "./StudentInviteModal.css";

type Step = "sport" | "link" | "email" | "success" | "duplicate";

function StudentInviteModal({ onClose, onViewStudents }: { onClose: () => void; onViewStudents: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("sport");
  const [sport, setSport] = useState("");
  const [email, setEmail] = useState("");
  const [invite, setInvite] = useState({ url: "", expiresAt: 0 });

  // Estados de integração
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loadingModalidades, setLoadingModalidades] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const titles = { sport: "Cadastrar Aluno", link: "Link gerado com sucesso!", email: "Enviar link por e-mail", success: "E-mail enviado com sucesso!", duplicate: "E-mail já cadastrado" };

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";

    // Busca as modalidades na montagem do modal
    async function fetchModalidades() {
      try {
        setLoadingModalidades(true);
        const data = await modalidadeService.listarTodas();
        setModalidades(data);
      } catch (err) {
        handleApiError(err, "Erro ao carregar as modalidades.");
      } finally {
        setLoadingModalidades(false);
      }
    }

    fetchModalidades();

    return () => { element?.close(); document.body.style.overflow = previousOverflow; if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, []);

  useEffect(() => { dialog.current?.querySelector<HTMLElement>("h2")?.focus(); }, [step]);

  // Chamada à API para gerar o convite real
  async function generateLink() {
    if (!sport) return;

    try {
      setIsGenerating(true);
      const response = await personalTrainerService.gerarConvite(Number(sport));
      setInvite({
        url: response.url,
        expiresAt: Date.now() + 900000, // 15 minutos em ms
      });
      setStep("link");
    } catch (err) {
      handleApiError(err, "Não foi possível gerar o link de convite.");
    } finally {
      setIsGenerating(false);
    }
  }

  const result = step === "success" || step === "duplicate";
  const selectedSportName = modalidades.find((m) => String(m.id) === sport)?.nome || sport;

  return <dialog ref={dialog} className={`student-invite ${result ? `student-invite--${step}` : ""}`} onCancel={(event) => { event.preventDefault(); onClose(); }} aria-labelledby="student-invite-title" aria-describedby="student-invite-demo">
    {!result && <button type="button" className="student-invite__close" aria-label="Fechar" onClick={onClose}>×</button>}
    {result && <div className="student-invite__symbol" aria-hidden="true">{step === "success" ? "✓" : "×"}</div>}
    <h2 id="student-invite-title" tabIndex={-1}>{titles[step]}</h2>
    {step === "sport" && <form onSubmit={(event) => { event.preventDefault(); generateLink(); }}>
      <p className="student-invite__subtitle">Selecione a modalidade e envie o link ao aluno.</p>
      <label htmlFor="invite-sport">Modalidade</label>
      <select 
        id="invite-sport" 
        required 
        value={sport} 
        onChange={(event) => setSport(event.target.value)}
        disabled={loadingModalidades || isGenerating}
      >
        <option value="" disabled>
          {loadingModalidades ? "Carregando modalidades..." : "Selecionar modalidade"}
        </option>
        {modalidades.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nome}
          </option>
        ))}
      </select>
      <p className="student-invite__hint student-invite__divider">O link expira em 15 minutos após ser gerado.</p>
      <div className="student-invite__actions">
        <button type="button" onClick={onClose} disabled={isGenerating}>Cancelar</button>
        <button className="student-invite__primary" type="submit" disabled={isGenerating || loadingModalidades || !sport}>
          {isGenerating ? "Gerando..." : "Gerar Link"}
        </button>
      </div>
    </form>}
    {step === "link" && <InviteLink sport={selectedSportName} invite={invite} onEmail={() => setStep("email")} onRegenerate={generateLink} />}
    {step === "email" && <InviteEmail initialEmail={email} expiresAt={invite.expiresAt} onCancel={() => setStep("link")} onSubmit={(value) => { setEmail(value); setStep(value.toLowerCase() === "aluno@email.com" ? "duplicate" : "success"); }} />}
    {result && <InviteResult success={step === "success"} email={email} onClose={onClose} onRetry={() => setStep("email")} onViewStudents={onViewStudents} />}
    <p id="student-invite-demo" className="student-invite__demo">Link de convite gerado diretamente do servidor Gymnasion.{step === "email" && " Use aluno@email.com para testar e-mail já cadastrado."}</p>
  </dialog>;
}

export default StudentInviteModal;
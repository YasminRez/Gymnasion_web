import { useEffect, useRef, useState } from "react";
import WorkspaceDialog from "../WorkspaceDialog/WorkspaceDialog";
import Button from "../Button/Button";
import { modalidadeService } from "../../services/modalidadeService";
import { personalTrainerService } from "../../services/personalTrainerService";
import { authError } from "../../utils/authError";
import type { Modalidade } from "../../types/modalidade";
import "./StudentInviteModal.css";

export default function StudentInviteModal({ onClose }: { onClose: () => void }) {
  const [modalities, setModalities] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState({ url: "", expiresAt: 0 });
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(false);
  async function load() {
    setLoading(true); setError("");
    try { const data = await modalidadeService.listarTodas(); if (mounted.current) setModalities(data); }
    catch (err) { if (mounted.current) setError(authError(err, "Não foi possível carregar as modalidades.").message); }
    finally { if (mounted.current) setLoading(false); }
  }
  useEffect(() => { mounted.current = true; void load(); const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => { mounted.current = false; window.clearInterval(timer); }; }, []);
  async function generate() {
    if (!sport || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    const started = Date.now();
    try { const result = await personalTrainerService.gerarConvite(Number(sport)); if (mounted.current) { setInvite({url:result.url,expiresAt:started+900000}); setCopied(false); setNow(Date.now()); } }
    catch (err) { if (mounted.current) setError(authError(err, "Não foi possível gerar o convite.").message); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  const remaining = Math.max(0, Math.ceil((invite.expiresAt-now)/1000));
  async function copy() {
    setError("");
    try { await navigator.clipboard.writeText(invite.url); setCopied(true); }
    catch { setError("Não foi possível copiar. Selecione o link e copie manualmente."); }
  }
  return <WorkspaceDialog title={invite.url ? "Link gerado com sucesso!" : "Cadastrar aluno"} description={invite.url ? "Compartilhe o convite com seu aluno." : "Selecione a modalidade para gerar um convite de cadastro."}
    icon={invite.url ? "/workspace/402-1230-imgIconLink.svg" : "/workspace/402-935-imgIconUserplus.svg"} tone={invite.url ? "success" : "primary"} wide={Boolean(invite.url)} busy={busy} onClose={onClose}
    actions={invite.url ? <Button onClick={onClose}>Concluir</Button> : <><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button loading={busy} disabled={!sport || loading} onClick={() => void generate()}>Gerar link</Button></>}>
    {!invite.url ? <div className="invite-v2"><label htmlFor="invite-modality">Modalidade</label><select id="invite-modality" value={sport} disabled={loading || busy} onChange={event => setSport(event.target.value)}><option value="">{loading ? "Carregando..." : "Selecione a modalidade"}</option>{modalities.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>{!loading && !modalities.length && <p>Nenhuma modalidade disponível. <button onClick={() => void load()}>Tentar novamente</button></p>}<p className="invite-v2__note"><img src="/workspace/402-935-imgIconClock.svg" alt="" />O link expira em 15 minutos após ser gerado.</p></div> : <div className="invite-v2"><label htmlFor="invite-url">Link de convite</label><div className="invite-v2__link"><input id="invite-url" readOnly value={invite.url} onFocus={event => event.target.select()} /><Button variant="secondary" disabled={!remaining} onClick={() => void copy()}>{copied ? "Copiado!" : "Copiar"}</Button></div><p className="invite-v2__note" role="status">{remaining ? "Expira em " + Math.floor(remaining/60).toString().padStart(2,"0") + ":" + (remaining%60).toString().padStart(2,"0") : "Convite expirado"} · {modalities.find(item => String(item.id) === sport)?.nome}</p>{!remaining && <Button loading={busy} onClick={() => void generate()}>Gerar novo convite</Button>}<div className="invite-v2__email"><strong>Enviar por e-mail</strong><p>O envio por e-mail estará disponível em uma próxima atualização. Copie o link para compartilhar com o aluno.</p></div></div>}
    {error && <p className="workspace-dialog__error" role="alert">{error}</p>}
  </WorkspaceDialog>;
}

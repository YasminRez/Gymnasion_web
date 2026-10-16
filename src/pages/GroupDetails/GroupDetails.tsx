import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePersonal } from "../../features/personal/PersonalContext";
import { removeGroupMember } from "../../features/groups/groupModel";
import { turmaService } from "../../services/turmaService";
import { modalidadeService } from "../../services/modalidadeService";
import type { TurmaResponse, AlunoResumo } from "../../types/turma";
import type { Modalidade } from "../../types/modalidade";
import GroupDataForm from "../../components/GroupDataForm/GroupDataForm";
import Button from "../../components/Button/Button";
import Avatar from "../../components/Avatar/Avatar";
import WorkspaceDialog from "../../components/WorkspaceDialog/WorkspaceDialog";
import Toast, { type ToastProps } from "../../components/Toast/Toast";
import "./GroupDetails.css";
export default function GroupDetails() {
  const { groupId = "" } = useParams();
  const { students, refresh } = usePersonal();
  const navigate = useNavigate();
  const [group,setGroup] = useState<TurmaResponse | null>(null);
  const [modalities,setModalities] = useState<Modalidade[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [attempt,setAttempt] = useState(0);
  const [selected,setSelected] = useState("");
  const [removal,setRemoval] = useState<AlunoResumo | null>(null);
  const [busy,setBusy] = useState(false);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState<ToastProps | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    let active = true; setLoading(true); setError(""); setGroup(null);
    Promise.all([turmaService.buscarPorId(groupId),modalidadeService.listarTodas()]).then(([data,options]) => { if(active) { setGroup(data); setModalities(options); } }).catch(() => { if(active) setError("Não foi possível carregar a turma. Ela pode ter sido removida ou estar indisponível."); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  },[groupId,attempt]);
  useEffect(() => { if(!notice) return; const timer = window.setTimeout(() => setNotice(null),6000); return () => clearTimeout(timer); },[notice]);
  const duplicate = Boolean(group?.alunos.some(student => student.id === selected));
  async function add() {
    if(!group || !selected || lock.current || saving) return;
    if(duplicate) { setNotice({ tone:"error", title:"Aluno já pertence a essa turma" }); return; }
    const student = students.data.find(item => item.id === selected && item.status === "ATIVO");
    if(!student) return;
    lock.current = true; setBusy(true);
    try {
      await turmaService.adicionarAluno(group.id,student.id);
      setGroup(previous => previous ? { ...previous, alunos: [...previous.alunos,{id:student.id,nome:student.usuario.nome,email:student.usuario.email}], quantidadeAlunos:previous.alunos.length+1 } : previous);
      setSelected(""); setNotice({title:"Aluno adicionado à turma!"}); void refresh();
    } catch(error) { setNotice({tone:"error",title:"Não foi possível adicionar o aluno",message:(error as {response?:{data?:{detail?:string}}}).response?.data?.detail || "Tente novamente."}); }
    finally { lock.current = false; setBusy(false); }
  }
  async function remove() {
    if(!group || !removal || lock.current || saving) return;
    lock.current = true; setBusy(true);
    try {
      await turmaService.removerAluno(group.id,removal.id);
      const updated = removeGroupMember(group,removal.id);
      setRemoval(null);
      void refresh();
      if(!updated.alunos.length) { navigate("/grupos",{replace:true}); return; }
      setGroup(updated); setNotice({title:"Aluno removido da turma."});
    } catch { setNotice({tone:"error",title:"Não foi possível remover o aluno",message:"Tente novamente."}); }
    finally { lock.current = false; setBusy(false); }
  }
  if(loading) return <p role="status">Carregando turma…</p>;
  if(error || !group) return <div className="workspace-error" role="alert">{error}<Button variant="secondary" onClick={() => setAttempt(value=>value+1)}>Tentar novamente</Button><Link to="/grupos">Voltar às turmas</Link></div>;
  return <section aria-label={"Gerenciar " + group.nome} className="group-details">
    <Link className="workspace-link" to="/grupos">← Todas as turmas</Link>
    <div className="group-details__grid">
      <section className="workspace-card group-details__data"><h2>Dados da turma</h2><p className="workspace-card__subtitle">Edite nome, modalidade e horário.</p><fieldset disabled={busy} className="group-details__form"><GroupDataForm group={group} modalities={modalities} onBusy={setSaving} onCancel={() => navigate("/grupos")} onSaved={saved => { setGroup(saved); setNotice({title:"Turma atualizada com sucesso!"}); void refresh(); }} /></fieldset></section>
      <section className="workspace-card group-details__students"><header><h2>Alunos da turma</h2><span>{group.quantidadeAlunos} alunos</span></header>
        <div className="group-details__add"><label className="group-details__select"><span className="group-details__sr">Adicionar aluno</span><select aria-label="Adicionar aluno" value={selected} disabled={busy || saving || students.loading || Boolean(students.error)} onChange={event=>setSelected(event.target.value)}><option value="">Adicionar aluno</option>{students.data.filter(student=>student.status==="ATIVO").map(student=><option key={student.id} value={student.id}>{student.usuario.nome}</option>)}</select></label><Button loading={busy && !removal} disabled={!selected || saving || busy} onClick={add}>+ Adicionar</Button></div>
        {duplicate && <p className="group-details__duplicate" role="status">Aluno já pertence a essa turma</p>}
        {students.error && <div className="workspace-error" role="alert">{students.error}<Button variant="ghost" onClick={()=>void refresh()}>Tentar novamente</Button></div>}
        {!students.loading && !students.error && !students.data.some(student=>student.status==="ATIVO") && <p className="workspace-empty">Nenhum aluno ativo disponível para adicionar.</p>}
        <ul className="group-details__members">{group.alunos.map(student=><li key={student.id}><Avatar name={student.nome || "Aluno"} /><div><Link to={"/alunos/"+encodeURIComponent(student.id)}>{student.nome || "Aluno"}</Link><p>{student.email || group.nomeModalidade}</p></div><Button variant="secondary" disabled={busy || saving} aria-label={"Remover " + (student.nome || "aluno")} onClick={()=>setRemoval(student)} icon={<img src="/groups/imgIconX.svg" alt="" />}>Remover</Button></li>)}</ul>
      </section>
    </div>
    {removal && <WorkspaceDialog title="Remover aluno?" tone="danger" busy={busy} onClose={()=>setRemoval(null)} description={"Remover " + (removal.nome || "este aluno") + " da turma? " + (group.alunos.length === 1 ? "Como este é o último aluno, a turma também será excluída." : "O aluno continuará vinculado ao seu perfil.")} actions={<><Button variant="secondary" disabled={busy} onClick={()=>setRemoval(null)}>Cancelar</Button><Button variant="danger" loading={busy} onClick={remove}>Confirmar remoção</Button></>} />}
    {notice && <div className="personal-notice"><Toast {...notice} onClose={()=>setNotice(null)} /></div>}
  </section>;
}

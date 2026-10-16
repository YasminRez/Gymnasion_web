import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import GroupCard from "../../components/GroupCard/GroupCard";
import GroupDataForm from "../../components/GroupDataForm/GroupDataForm";
import WorkspaceDialog from "../../components/WorkspaceDialog/WorkspaceDialog";
import Button from "../../components/Button/Button";
import Toast, { type ToastProps } from "../../components/Toast/Toast";
import { usePersonal } from "../../features/personal/PersonalContext";
import { filterGroups } from "../../features/groups/groupModel";
import { turmaService } from "../../services/turmaService";
import { modalidadeService } from "../../services/modalidadeService";
import type { TurmaResponse } from "../../types/turma";
import type { Modalidade } from "../../types/modalidade";
import "./Groups.css";
export default function Groups() {
  const { students, refresh } = usePersonal();
  const [groups, setGroups] = useState<TurmaResponse[]>([]);
  const [modalities, setModalities] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalityError, setModalityError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<ToastProps | null>(null);
  const [params, setParams] = useSearchParams();
  const search = params.get("busca") || "";
  const filter = params.get("modalidade") || "";
  const generation = useRef(0);
  useEffect(() => {
    let active = true; setLoading(true); setError(""); setModalityError("");
    turmaService.listar().then(data => { if(active) setGroups(data); }).catch(() => { if(active) setError("Não foi possível carregar as turmas."); }).finally(() => { if(active) setLoading(false); });
    modalidadeService.listarTodas().then(data => { if(active) setModalities(data); }).catch(() => { if(active) setModalityError("Não foi possível carregar as modalidades."); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 6000); return () => clearTimeout(timer); }, [notice]);
  const options = Array.from(new Map(groups.map(group => [group.modalidadeId, group.nomeModalidade])));
  const visible = filterGroups(groups, search, filter);
  function updateFilter(key: string, value: string) { setParams(previous => { const next = new URLSearchParams(previous); if(value) next.set(key,value); else next.delete(key); return next; }, { replace: true }); }
  function create() {
    if(students.loading) return;
    if(students.error || modalityError) { setNotice({ tone: "error", title: "Não foi possível criar a turma", message: students.error || modalityError }); return; }
    if(!students.data.some(student => student.status === "ATIVO")) { setNotice({ tone: "error", title: "Não foi possível criar a turma", message: "É necessário pelo menos um aluno ativo vinculado para criar uma turma." }); return; }
    if(!modalities.length) { setNotice({ tone: "error", title: "Nenhuma modalidade disponível" }); return; }
    generation.current += 1; setCreating(true);
  }
  return <section className="groups-page" aria-label="Turmas">
    <div className="groups-page__toolbar">
      <div className="groups-page__filters" aria-label="Filtrar por modalidade"><button aria-pressed={!filter} onClick={() => updateFilter("modalidade","")}>Todas · {groups.length}</button>{options.map(([id,name]) => <button key={id} aria-pressed={filter === String(id)} onClick={() => updateFilter("modalidade",String(id))}>{name} · {groups.filter(group => group.modalidadeId === id).length}</button>)}</div>
      <div className="groups-page__tools"><input type="search" aria-label="Buscar turma" placeholder="Buscar turma…" value={search} onChange={event => updateFilter("busca",event.target.value)} /><Button disabled={students.loading || loading} onClick={create}>+ Nova turma</Button></div>
    </div>
    {(error || modalityError) && <div className="workspace-error" role="alert">{error || modalityError}<Button variant="ghost" onClick={() => setAttempt(value => value+1)}>Tentar novamente</Button></div>}
    {loading ? <p role="status" className="workspace-empty">Carregando turmas…</p> : !error && (visible.length ? <div className="groups-page__grid">{visible.map(group => <GroupCard key={group.id} group={group} />)}<button className="groups-page__create" onClick={create}><span><img src="/groups/imgIconPlus.svg" alt="" /></span><strong>Criar nova turma</strong><small>Agrupe alunos por modalidade ou horário</small></button></div> : <div className="groups-page__empty workspace-card">
      <span><img src="/groups/imgIconLayers1.svg" alt="" /></span><h2>{groups.length ? "Nenhuma turma encontrada" : "Você ainda não possui turmas criadas"}</h2>
      <p>{groups.length ? "Tente outro nome ou remova os filtros." : "Organize seus alunos em grupos por modalidade ou horário."}</p>
      {groups.length ? <Button variant="secondary" onClick={() => setParams({})}>Limpar filtros</Button> : <Button disabled={students.loading} onClick={create}>+ Nova turma</Button>}
    </div>)}
    {creating && <WorkspaceDialog className="groups-page__dialog" title="Nova turma" description="Organize os alunos em um novo grupo." icon="/groups/imgIconLayers1.svg" busy={busy} onClose={() => setCreating(false)}><GroupDataForm key={generation.current} modalities={modalities} students={students.data} onBusy={setBusy} onCancel={() => setCreating(false)} onSaved={group => { setGroups(previous => [...previous,group]); setCreating(false); setParams({}); setNotice({ title: "Turma criada com sucesso!" }); void refresh(); }} /></WorkspaceDialog>}
    {notice && <div className="personal-notice"><Toast {...notice} onClose={() => setNotice(null)} /></div>}
  </section>;
}

import { useState } from "react";
import Button from "../Button/Button";
import Badge from "../Badge/Badge";
import { displayDate } from "../../features/personal/dashboardModel";
import type { TrainingSession } from "../../types/personalDashboard";
import "./ProfileSessions.css";

export default function ProfileSessions({ sessions, recent=false, onHistory }: { sessions: TrainingSession[]; recent?: boolean; onHistory?: () => void }) {
  const [page,setPage]=useState(1);
  const pages=Math.max(1,Math.ceil(sessions.length/10));
  const current=Math.min(page,pages);
  const displayed=recent?sessions.slice(0,4):sessions.slice((current-1)*10,current*10);
  const allMetrics=[...new Map(sessions.flatMap(s=>s.desempenho?.metricas||[]).map(m=>[m.metricaId,m])).values()];
  const metrics=recent?allMetrics.filter(m=>m.tipoMetrica!=="TEXTO").slice(0,2):allMetrics;
  return <section className="workspace-card profile-sessions">
    <header><h2>{recent?"Sessões recentes":"Histórico de sessões"}</h2>{onHistory && <button className="workspace-link" onClick={onHistory}>Ver histórico →</button>}</header>
    {!sessions.length?<p className="profile-sessions__empty">Nenhuma sessão registrada para este aluno.</p>:<>
      <div className="profile-sessions__scroll"><table><thead><tr><th>Data</th><th>Duração</th>{metrics.map(m=><th key={m.metricaId}>{m.tituloMetrica}</th>)}<th>RPE</th><th>Fonte</th></tr></thead><tbody>{displayed.map(s=><tr key={s.id}><td>{displayDate(s.dataReal!)}</td><td>{s.duracao===null?"—":s.duracao+" min"}</td>{metrics.map(m=><td key={m.metricaId}>{s.desempenho?.metricas.find(v=>v.metricaId===m.metricaId)?.valor||"—"}</td>)}<td><span className="profile-sessions__rpe">{s.desempenho?.nivelCansaco===null||s.desempenho?.nivelCansaco===undefined?"—":s.desempenho.nivelCansaco+"/10"}</span></td><td><Badge tone="neutral">{s.desempenho?.registradoPor==="PERSONAL_TRAINER"?"Personal":s.desempenho?.registradoPor==="ALUNO"?"Aluno":"Não informada"}</Badge></td></tr>)}</tbody></table></div>
      {!recent&&pages>1&&<footer><Button variant="secondary" disabled={current===1} onClick={()=>setPage(current-1)}>Anterior</Button><span>{current} / {pages}</span><Button variant="secondary" disabled={current===pages} onClick={()=>setPage(current+1)}>Próxima</Button></footer>}
    </>}
  </section>;
}

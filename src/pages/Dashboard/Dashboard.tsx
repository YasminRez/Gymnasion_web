import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import DashboardEvolution from "../../components/DashboardEvolution/DashboardEvolution";
import DashboardNotifications from "../../components/DashboardNotifications/DashboardNotifications";
import StudentRoutineDialog from "../../components/StudentRoutineDialog/StudentRoutineDialog";
import DashboardStats from "../../components/DashboardStats/DashboardStats";
import DashboardPanel from "../../components/DashboardPanel/DashboardPanel";
import StudentIdentity from "../../components/StudentIdentity/StudentIdentity";
import StudentStatusDialog from "../../components/StudentStatusDialog/StudentStatusDialog";
import Button from "../../components/Button/Button";
import { usePersonal } from "../../features/personal/PersonalContext";
import { studentsWithoutRoutine } from "../../features/personal/studentModel";
import type { AlunoResponse } from "../../types/student";
import "./Dashboard.css";

export default function Dashboard() {
  const { students, routines, groups, activities, busyId, mutate, refresh, histories, notifications, notificationBusy } = usePersonal();
  const [reject, setReject] = useState<AlunoResponse | null>(null);

  const [assign, setAssign] = useState<AlunoResponse | null>(null);
  const location = useLocation();
  useEffect(() => { if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:"smooth"}); }, [location.hash]);
  const pending = students.data.filter(item => item.status === "PENDENTE");
  const without = studentsWithoutRoutine(students.data, routines.data);
  const recent = activities.filter(item => item.kind === "approve").flatMap(activity => { const student = students.data.find(item => item.id === activity.studentId); return student ? [{student,activity}] : []; });

  return <div className="dashboard-v2">
    {(students.error || routines.error || groups.error || histories.error || notifications.error) && <div className="workspace-error" role="alert"><span>Alguns dados não puderam ser atualizados. {students.error || routines.error || groups.error || histories.error || notifications.error}</span><Button variant="secondary" onClick={() => void refresh()}>Tentar novamente</Button></div>}
    <DashboardStats />
    <div className="dashboard-v2__middle">
      <DashboardEvolution />
      <DashboardPanel title="Alunos pendentes" subtitle="Novos cadastros aguardando aprovação" link="/alunos?status=pending">
        {students.loading ? <p className="dashboard-panel__empty">Carregando...</p> : !pending.length ? <p className="dashboard-panel__empty">{students.error ? "Não foi possível consultar as solicitações." : "Tudo em dia! Nenhum cadastro pendente."}</p> : pending.slice(0,3).map(student => <div className="dashboard-v2__row" key={student.id}><StudentIdentity student={student} detail={student.modalidades.map(item => item.nome).join(", ")} /><div className="dashboard-v2__decisions"><button disabled={Boolean(busyId) || notificationBusy} aria-label={"Aprovar "+student.usuario.nome} onClick={() => void mutate(student,"approve")}><img src="/workspace/401-378-imgIconCheck.svg" alt="" /></button><button disabled={Boolean(busyId) || notificationBusy} aria-label={"Recusar "+student.usuario.nome} onClick={() => setReject(student)}><img src="/workspace/401-378-imgIconX.svg" alt="" /></button></div></div>)}
      </DashboardPanel>
    </div>
    <div className="dashboard-v2__bottom">
      <DashboardPanel title="Últimos alunos aceitos" subtitle="Aprovações realizadas nesta sessão" id="recentes" link="/alunos?status=active">{recent.length ? recent.slice(0,3).map(({student,activity}) => <div className="dashboard-v2__row" key={activity.id}><StudentIdentity student={student} detail={new Date(activity.time).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} /></div>) : <p className="dashboard-panel__empty">As próximas aprovações feitas aqui aparecerão nesta lista.</p>}</DashboardPanel>
      <DashboardPanel title="Alunos sem rotina" subtitle="Vincule uma rotina para começar" id="sem-rotina">{students.loading || routines.loading ? <p className="dashboard-panel__empty">Carregando...</p> : students.error || routines.error ? <p className="dashboard-panel__empty">Não foi possível consultar os vínculos.</p> : without.length ? <>{without.slice(0,3).map(student => <div className="dashboard-v2__row" key={student.id}><StudentIdentity student={student} detail={student.modalidades.map(item => item.nome).join(", ")} /><button className="dashboard-v2__assign" disabled={Boolean(busyId) || notificationBusy} onClick={()=>setAssign(student)}>Vincular</button></div>)}{without.length>3 && <Link className="workspace-link" to="/rotinas">Gerenciar rotinas ({without.length} alunos sem rotina)</Link>}</> : <p className="dashboard-panel__empty">Nenhum aluno ativo sem rotina.</p>}</DashboardPanel>
      <DashboardNotifications />
    </div>
    {assign && <StudentRoutineDialog student={assign} onClose={()=>setAssign(null)} />}
    {reject && <StudentStatusDialog student={reject} action="reject" onClose={() => setReject(null)} />}
  </div>;
}

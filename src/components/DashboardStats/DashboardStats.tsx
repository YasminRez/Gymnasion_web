import { usePersonal } from "../../features/personal/PersonalContext";
import { studentCounts } from "../../features/personal/studentModel";
import { weeklySessions } from "../../features/personal/dashboardModel";
import "./DashboardStats.css";
export default function DashboardStats() {
  const { students, groups, histories } = usePersonal();
  const counts = studentCounts(students.data);
  const stats = [
    { label:"Alunos ativos", value:students.loading || students.error ? "—" : counts.active, icon:"imgIconUsers1", tone:"orange" },
    { label:"Alunos pendentes", value:students.loading || students.error ? "—" : counts.pending, icon:"imgIconUsercheck", tone:"amber" },
    { label:"Turmas cadastradas", value:groups.loading || groups.error ? "—" : groups.data.length, icon:"imgIconLayers1", tone:"blue" },
    { label:"Sessões nesta semana", value:histories.loading || histories.error ? "—" : weeklySessions(histories.data), icon:"imgIconActivity1", tone:"green" },
  ];
  return <div className="dashboard-stats">{stats.map(item => <article className="workspace-card dashboard-stats__card" key={item.label}><span className={"dashboard-stats__icon dashboard-stats__icon--"+item.tone}><img src={"/workspace/401-378-"+item.icon+".svg"} alt="" /></span><strong>{item.value}</strong><span>{item.label}</span></article>)}</div>;
}

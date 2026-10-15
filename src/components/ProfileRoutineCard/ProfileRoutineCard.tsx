import UnavailableAction from "../UnavailableAction/UnavailableAction";
import Badge from "../Badge/Badge";
import { metricIcons, metricLabels, weekDays } from "../../features/studentProfile/profileModel";
import { displayDate } from "../../features/personal/dashboardModel";
import type { RotinaResponse } from "../../types/rotina";
import type { StudentTracking } from "../../types/studentProfile";
import "./ProfileRoutineCard.css";

export default function ProfileRoutineCard({routine,tracking,studentId,showWeek=true}:{routine:RotinaResponse;tracking:StudentTracking|null;studentId:string;showWeek?:boolean}) {
  const days=weekDays(tracking,studentId);
  return <section className="workspace-card profile-routine">
    <header><div><h2>{showWeek?"Rotina atual: ":""}{routine.titulo}</h2><p>{routine.objetivos?"Objetivo: "+routine.objetivos:"Sem objetivo informado."}</p></div><div className="profile-routine__actions"><Badge tone={routine.ativo===false?"neutral":"primary"}>{routine.ativo===false?"Encerrada":routine.frequenciaSemanal+"x por semana"}</Badge><UnavailableAction variant="secondary" className="profile-routine__edit" aria-label="Editar rotina" reason="A edição da rotina ainda não está disponível no backend."><img src="/student-profile/imgIconEdit.svg" alt=""/></UnavailableAction></div></header>
    <div className="profile-routine__metrics">{routine.metricas.map(metric=><span key={metric.id}><img src={"/student-profile/"+metricIcons[metric.tipo]+".svg"} alt=""/><strong>{metric.titulo}</strong><small>· {metricLabels[metric.tipo]}</small></span>)}</div>
    {showWeek && <><p className="profile-routine__week-label">Semana atual · {days.reduce((sum,day)=>sum+day.completed,0)} de {days.reduce((sum,day)=>sum+day.planned,0)} sessões planejadas</p><div className="profile-routine__week">{days.map(day=><div key={day.date} className={(day.completed?"is-completed ":"")+(day.today?"is-today":"")} title={displayDate(day.date)+" · "+day.completed+" concluídas / "+day.planned+" planejadas"}><span>{day.label}</span>{day.completed?<img src="/student-profile/imgIconCheck.svg" alt="Concluída"/>:<span className="profile-routine__day-dot" aria-label={day.planned?"Planejada":"Sem sessão"}/>}</div>)}</div></>}
  </section>;
}

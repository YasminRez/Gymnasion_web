import { useState } from "react";
import type { RecentStudent } from "../RecentStudents/recentStudentsData";
import "./RecentStudentRow.css";

function RecentStudentRow({ student }: { student: RecentStudent }) {
  const [expanded, setExpanded] = useState(false);
  const sportClass = { Natação: "swimming", Academia: "gym", Tênis: "tennis" }[student.sport];
  return <>
    <tr className="recent-student-row">
      <td><div className="recent-student-row__identity"><span className={`recent-student-row__avatar recent-student-row__avatar--${student.avatarColor}`} aria-hidden="true">{student.initials}</span><div><strong>{student.name}</strong><small>Personal: @personal</small></div></div></td>
      <td><span className={`recent-student-row__sport recent-student-row__sport--${sportClass}`}>{student.sport}</span></td>
      <td className="recent-student-row__date">{student.acceptedAt}</td>
      <td><span className={`recent-student-row__status${student.active ? "" : " recent-student-row__status--inactive"}`}>{student.active ? "Ativo" : "Inativo"}</span></td>
      <td><button type="button" className="recent-student-row__toggle" aria-label={`Detalhes de ${student.name}`} aria-expanded={expanded} aria-controls={`recent-student-${student.id}`} onClick={() => setExpanded(!expanded)}><span aria-hidden="true">{expanded ? "⌄" : "›"}</span></button></td>
    </tr>
    {expanded && <tr className="recent-student-row__details" id={`recent-student-${student.id}`}><td colSpan={5}>{student.name} · {student.sport} · Aceite: {student.acceptedAt} · {student.active ? "Aluno ativo." : "Aluno inativo. Histórico preservado."}</td></tr>}
  </>;
}
export default RecentStudentRow;

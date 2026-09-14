import { initials, type Student } from "../../pages/Students/studentData";
import "./PendingStudent.css";
function PendingStudent({ student, onDecision }: { student: Student; onDecision: (student: Student, accept: boolean) => void }) {
  return (
    <article className="pending-student">
      <span className="pending-student__avatar" aria-hidden="true">{initials(student.name)}</span>
      <div className="pending-student__info"><h3>{student.name}</h3><p>{student.sport} · Nasc. {student.birthDate}</p></div>
      <div className="pending-student__actions">
        <button type="button" className="pending-student__accept" aria-label={`Aceitar ${student.name}`} onClick={() => onDecision(student, true)}>Aceitar</button>
        <button type="button" className="pending-student__reject" aria-label={`Recusar ${student.name}`} onClick={() => onDecision(student, false)}>Recusar</button>
      </div>
    </article>
  );
}
export default PendingStudent;

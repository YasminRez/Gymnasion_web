import type { Student } from "../../pages/Students/studentData";
import { initials } from "../../pages/Students/studentData";
import "./StudentCard.css";
import { useEffect, useRef, useState } from "react";

function StudentCard({ student, onStatusChange }: { student: Student; onStatusChange: (student: Student) => void }) {
  const [open, setOpen] = useState(false);
  const actions = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) { if (!actions.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <article className={`student-card student-card--${student.status}`}>
      <span className="student-card__dot" aria-hidden="true" />
      <div ref={actions} className="student-card__actions" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); actions.current?.querySelector("button")?.focus(); } }}>
        <button type="button" className="student-card__more" aria-label={`Opções de ${student.name}`} aria-expanded={open} aria-controls={`student-options-${student.id}`} onClick={() => setOpen(!open)}>⋮</button>
        {open && <div className="student-card__options" id={`student-options-${student.id}`}><button type="button" onClick={() => { actions.current?.querySelector("button")?.focus(); setOpen(false); onStatusChange(student); }}>{student.status === "active" ? "Desativar aluno" : "Reativar aluno"}</button></div>}
      </div>
      <div className="student-card__avatar" aria-hidden="true">{initials(student.name)}</div>
      <h2>{student.name}</h2>
      <p>{student.sport}</p>
      <span className="student-card__status">{student.status === "active" ? "Ativo" : "Inativo"}</span>
    </article>
  );
}
export default StudentCard;

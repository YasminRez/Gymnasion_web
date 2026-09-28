import type { CSSProperties } from "react";
import type { RotinaResponse } from "../../types/rotina";
import { initials } from "../../pages/Students/studentData";
import { avatarColor, modalityTheme } from "../../pages/Groups/groupData";
import { metricTypeLabel } from "../../pages/Routines/routineData";
import "./RoutineCard.css";

const STUDENTS_PREVIEW = 3;

function RoutineCard({ routine }: { routine: RotinaResponse }) {
  const theme = modalityTheme(routine.nomeModalidade, routine.modalidadeId);
  const style = { "--routine-bg": theme.background, "--routine-text": theme.text, "--routine-badge": theme.badge, "--routine-accent": theme.accent } as CSSProperties;
  const students = [...routine.alunos].sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR"));
  const hidden = students.length - STUDENTS_PREVIEW;

  return (
    <article className="routine-card" style={style} aria-labelledby={`routine-${routine.id}-title`}>
      <header className="routine-card__header">
        <h2 id={`routine-${routine.id}-title`}>{routine.titulo}</h2>
        <div className="routine-card__meta">
          <span className="routine-card__badge">{routine.nomeModalidade}</span>
          <span>{routine.frequenciaSemanal}x por semana</span>
        </div>
      </header>
      <div className="routine-card__body">
        {routine.objetivos && <p className="routine-card__goal" title={routine.objetivos}>{routine.objetivos}</p>}
        <h3>Métricas</h3>
        <ul className="routine-card__metrics">
          {routine.metricas.map((metrica) => <li key={metrica.id} title={metricTypeLabel[metrica.tipo]}>{metrica.titulo}</li>)}
        </ul>
        <h3>Alunos ({students.length})</h3>
        <ul className="routine-card__students">
          {students.slice(0, STUDENTS_PREVIEW).map((student) => {
            const name = student.nome ?? "Aluno";
            return <li key={student.id}><span className="routine-card__avatar" style={{ background: avatarColor(name) }} aria-hidden="true">{initials(name)}</span>{name}</li>;
          })}
          {hidden > 0 && <li className="routine-card__more">+{hidden} {hidden === 1 ? "aluno" : "alunos"}</li>}
        </ul>
      </div>
      <div className="routine-card__accent" aria-hidden="true" />
    </article>
  );
}
export default RoutineCard;

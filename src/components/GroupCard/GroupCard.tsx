import { useState, type CSSProperties } from "react";
import type { TurmaResponse } from "../../types/turma";
import { initials } from "../../pages/Students/studentData";
import { avatarColor, formatSchedule, modalityTheme } from "../../pages/Groups/groupData";
import "./GroupCard.css";

const PREVIEW_LIMIT = 3;

type Props = { group: TurmaResponse; activeStudents: number; removingId: string | null; onEdit: (group: TurmaResponse) => void; onAddStudent: (group: TurmaResponse) => void; onRemoveStudent: (group: TurmaResponse, studentId: string) => void };

function GroupCard({ group, activeStudents, removingId, onEdit, onAddStudent, onRemoveStudent }: Props) {
  const [expanded, setExpanded] = useState(false);
  const theme = modalityTheme(group.nomeModalidade, group.modalidadeId);
  const style = { "--group-bg": theme.background, "--group-text": theme.text, "--group-badge": theme.badge, "--group-accent": theme.accent } as CSSProperties;
  const students = [...group.alunos].sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR"));
  const visible = expanded ? students : students.slice(0, PREVIEW_LIMIT);
  const share = activeStudents > 0 ? Math.min(100, Math.round((group.quantidadeAlunos / activeStudents) * 100)) : 0;

  return (
    <article className="group-card" style={style} aria-labelledby={`group-${group.id}-title`}>
      <header className="group-card__header">
        <div className="group-card__title">
          <h2 id={`group-${group.id}-title`}>{group.nome}</h2>
          <button type="button" className="group-card__edit" aria-label={`Editar ${group.nome}`} onClick={() => onEdit(group)}>✎</button>
        </div>
        <div className="group-card__meta">
          <span className="group-card__badge">{group.nomeModalidade}</span>
          <span>{group.quantidadeAlunos} {group.quantidadeAlunos === 1 ? "aluno" : "alunos"}</span>
        </div>
      </header>
      <ul className="group-card__students" id={`group-${group.id}-students`}>
        {visible.map((student) => {
          const name = student.nome ?? "Aluno";
          return (
            <li key={student.id}>
              <span className="group-card__avatar" style={{ background: avatarColor(name) }} aria-hidden="true">{initials(name)}</span>
              <span className="group-card__name">
                {name}
                {expanded && student.email && <small>{student.email}</small>}
              </span>
              <button type="button" aria-label={`Remover ${name} da turma`} disabled={removingId === student.id} onClick={() => onRemoveStudent(group, student.id)}>×</button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="group-card__add" onClick={() => onAddStudent(group)}><span aria-hidden="true">+</span> Adicionar aluno</button>
      <footer className="group-card__footer">
        <span>{group.horario ? `Horário: ${formatSchedule(group.horario)}` : "Sem horário definido"}</span>
        <button type="button" aria-expanded={expanded} aria-controls={`group-${group.id}-students`} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Ver menos ‹" : "Ver detalhes ›"}
        </button>
      </footer>
      <div className="group-card__progress" role="img" aria-label={`${group.quantidadeAlunos} de ${activeStudents} alunos ativos nesta turma`} title={`${group.quantidadeAlunos} de ${activeStudents} alunos ativos`}>
        <span style={{ width: `${share}%` }} />
      </div>
    </article>
  );
}
export default GroupCard;

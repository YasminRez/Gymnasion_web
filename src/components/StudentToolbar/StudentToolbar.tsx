import type { StudentStatus } from "../../pages/Students/studentData";
import "./StudentToolbar.css";
type Props = { search: string; onSearch: (value: string) => void; filter: StudentStatus | null; onFilter: (value: StudentStatus | null) => void; counts: Record<StudentStatus, number>; onRegister: () => void };
function StudentToolbar({ search, onSearch, filter, onFilter, counts, onRegister }: Props) {
  return (
    <div className="student-toolbar">
      <label className="student-toolbar__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
        <input type="search" aria-label="Buscar aluno" placeholder="Buscar aluno..." value={search} onChange={(event) => onSearch(event.target.value)} />
      </label>
      <div className="student-toolbar__actions" aria-label="Filtros de alunos">
        {([['active', 'Ativos'], ['inactive', 'Inativos'], ['pending', 'Pendentes']] as const).map(([status, label]) => (
          <button key={status} type="button" className={`student-toolbar__filter student-toolbar__filter--${status}`} aria-pressed={filter === status} onClick={() => onFilter(filter === status ? null : status)}>
            <span aria-hidden="true" />{label}<strong>{counts[status]}</strong>
          </button>
        ))}
        <button type="button" onClick={onRegister}><span aria-hidden="true">⊕</span> Cadastrar Aluno</button>
      </div>
    </div>
  );
}
export default StudentToolbar;

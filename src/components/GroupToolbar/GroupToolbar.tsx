// Mesmo visual da barra de alunos.
import "../StudentToolbar/StudentToolbar.css";
type Props = { search: string; onSearch: (value: string) => void; modalities: { id: number; nome: string }[]; filter: number | null; onFilter: (value: number | null) => void; onRegister: () => void };
function GroupToolbar({ search, onSearch, modalities, filter, onFilter, onRegister }: Props) {
  return (
    <div className="student-toolbar">
      <label className="student-toolbar__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
        <input type="search" aria-label="Buscar turma" placeholder="Buscar turma..." value={search} onChange={(event) => onSearch(event.target.value)} />
      </label>
      <div className="student-toolbar__actions" aria-label="Filtros de turmas">
        {modalities.map((modality) => (
          <button key={modality.id} type="button" aria-pressed={filter === modality.id} onClick={() => onFilter(filter === modality.id ? null : modality.id)}>{modality.nome}</button>
        ))}
        <button type="button" onClick={onRegister}><span aria-hidden="true">⊕</span> Cadastrar Turma</button>
      </div>
    </div>
  );
}
export default GroupToolbar;

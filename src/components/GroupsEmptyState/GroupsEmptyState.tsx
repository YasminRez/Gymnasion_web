// Mesmo visual do estado vazio de alunos.
import "../StudentsEmptyState/StudentsEmptyState.css";
function GroupsEmptyState({ search, filtered, onRegister }: { search: string; filtered: boolean; onRegister: () => void }) {
  return <section className="students-empty" role="status">
    <svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="20" cy="22" r="8" /><circle cx="38" cy="22" r="8" /><path d="M6 46q14-16 28 0M24 46q14-16 28 0" /></svg>
    <h2>{search ? `Nenhuma turma encontrada para "${search}"` : filtered ? "Nenhuma turma nesta modalidade" : "Nenhuma turma criada"}</h2>
    <p>{search ? "Tente buscar por outro nome." : filtered ? "Selecione outra modalidade para ver suas turmas." : "Crie sua primeira turma para organizar seus alunos."}</p>
    {!search && !filtered && <button type="button" onClick={onRegister}>Cadastrar Turma</button>}
  </section>;
}
export default GroupsEmptyState;

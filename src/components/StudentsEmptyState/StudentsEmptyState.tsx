import "./StudentsEmptyState.css";
function StudentsEmptyState({ search, filtered, onRegister }: { search: string; filtered: boolean; onRegister: () => void }) {
  return <section className="students-empty" role="status">
    <svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="28" cy="28" r="25" /><path d="M18 34q10-10 20 0M18 19l3-4M35 15l3 4" /><circle cx="23" cy="22" r="1" /><circle cx="34" cy="22" r="1" /></svg>
    <h2>{search ? `Nenhum aluno encontrado para "${search}"` : filtered ? "Nenhum aluno encontrado neste filtro" : "Nenhum aluno registrado"}</h2>
    <p>{search ? "Tente buscar por outro nome." : filtered ? "Selecione outro filtro para ver seus alunos." : "Cadastre seu primeiro aluno para começar."}</p>
    {!search && !filtered && <button type="button" onClick={onRegister}>Cadastrar Aluno</button>}
  </section>;
}
export default StudentsEmptyState;

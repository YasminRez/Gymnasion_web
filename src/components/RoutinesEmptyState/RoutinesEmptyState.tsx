// Mesmo visual do estado vazio de alunos.
import "../StudentsEmptyState/StudentsEmptyState.css";
function RoutinesEmptyState({ search, filtered, onRegister }: { search: string; filtered: boolean; onRegister: () => void }) {
  return <section className="students-empty" role="status">
    <svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="10" y="8" width="36" height="42" rx="4" /><path d="M20 8v-3h16v3M18 22h20M18 31h20M18 40h12" /></svg>
    <h2>{search ? `Nenhuma rotina encontrada para "${search}"` : filtered ? "Nenhuma rotina nesta modalidade" : "Nenhuma rotina criada"}</h2>
    <p>{search ? "Tente buscar por outro título." : filtered ? "Selecione outra modalidade para ver suas rotinas." : "Crie sua primeira rotina de treino para seus alunos."}</p>
    {!search && !filtered && <button type="button" onClick={onRegister}>Criar rotina</button>}
  </section>;
}
export default RoutinesEmptyState;

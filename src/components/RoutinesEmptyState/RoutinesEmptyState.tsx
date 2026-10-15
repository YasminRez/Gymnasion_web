import Button from "../Button/Button";
import "./RoutinesEmptyState.css";

interface Props {
  search: string;
  filtered: boolean;
  onRegister: () => void;
}

export default function RoutinesEmptyState({ search, filtered, onRegister }: Props) {
  const hasFilter = Boolean(search || filtered);

  return (
    <div className="workspace-card routines-empty" role="status">
      <div className="routines-empty__icon">
        <img src="/design-system/imgIconDumbbell.svg" alt="" />
      </div>
      <h2>
        {search
          ? `Nenhuma rotina encontrada para “${search}”`
          : filtered
          ? "Nenhuma rotina para os filtros selecionados"
          : "Nenhuma rotina cadastrada"}
      </h2>
      <p>
        {search
          ? "Experimente buscar por outro termo ou nome de aluno."
          : filtered
          ? "Selecione outra modalidade ou status para ver as rotinas."
          : "Comece criando o primeiro ciclo de treinos para seus alunos."}
      </p>
      {!hasFilter && (
        <Button onClick={onRegister}>+ Criar primeira rotina</Button>
      )}
    </div>
  );
}

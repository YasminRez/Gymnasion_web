import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import WorkspaceDialog from "../WorkspaceDialog/WorkspaceDialog";
import Button from "../Button/Button";
import { eligibleRoutinesForGroup, groupRoutine } from "../../features/groups/groupModel";
import { extractProblemDetail } from "../../features/routines/routineModel";
import { rotinaService } from "../../services/rotinaService";
import { authError } from "../../utils/authError";
import type { TurmaResponse } from "../../types/turma";
import type { RotinaResponse } from "../../types/rotina";
import "./GroupRoutineModal.css";

interface Props {
  group: TurmaResponse;
  routines: RotinaResponse[];
  onClose: () => void;
  onLinked: (routine: RotinaResponse) => void;
}

export default function GroupRoutineModal({
  group,
  routines,
  onClose,
  onLinked,
}: Props) {
  const eligibleRoutines = eligibleRoutinesForGroup(routines, group);
  const currentLinked = groupRoutine(routines, group);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(
    currentLinked?.id || eligibleRoutines[0]?.id || ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflictPrompt, setConflictPrompt] = useState(false);
  const lock = useRef(false);

  async function handleConfirm(substituir?: boolean) {
    if (!selectedRoutineId || lock.current || busy) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const updated = await rotinaService.vincularTurma(selectedRoutineId, group.id, Boolean(substituir));
      onLinked(updated);
    } catch (err: unknown) {
      const fallback = authError(
        err,
        "Não foi possível vincular a turma à rotina."
      ).message;
      const message = extractProblemDetail(err, fallback);
      setError(message);
      if (
        message.toLowerCase().includes("já possui uma rotina") ||
        message.toLowerCase().includes("rotina atual precisa ser encerrada")
      ) {
        setConflictPrompt(true);
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <WorkspaceDialog
      title="Vincular rotina à turma"
      description={`Envie um treino em lote para os ${group.quantidadeAlunos} ${
        group.quantidadeAlunos === 1 ? "aluno" : "alunos"
      } da turma “${group.nome}” (${group.nomeModalidade}).`}
      icon="/groups/imgIconDumbbell1.svg"
      busy={busy}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!selectedRoutineId || busy || eligibleRoutines.length === 0}
            loading={busy}
            onClick={() => handleConfirm(false)}
          >
            Vincular rotina
          </Button>
        </>
      }
    >
      <div className="group-routine-modal">
        {eligibleRoutines.length === 0 ? (
          <div className="group-routine-modal__empty">
            <p>
              Nenhuma rotina ativa encontrada para a modalidade{" "}
              <strong>{group.nomeModalidade}</strong>.
            </p>
            <Link className="workspace-link" to="/rotinas/nova" onClick={onClose}>
              + Criar nova rotina de {group.nomeModalidade}
            </Link>
          </div>
        ) : (
          <div
            className="group-routine-modal__list"
            role="radiogroup"
            aria-label={`Rotinas ativas de ${group.nomeModalidade}`}
          >
            {eligibleRoutines.map((routine) => {
              const isSelected = selectedRoutineId === routine.id;
              const isCurrent = currentLinked?.id === routine.id;
              const metricsCount = routine.metricas?.length || 0;
              const linkedCount = routine.alunos?.length || 0;

              return (
                <label
                  key={routine.id}
                  className={`group-routine-modal__option ${
                    isSelected ? "is-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="group-routine"
                    value={routine.id}
                    checked={isSelected}
                    disabled={busy}
                    onChange={() => {
                      setSelectedRoutineId(routine.id);
                      if (error) setError("");
                      setConflictPrompt(false);
                    }}
                  />
                  <div className="group-routine-modal__info">
                    <strong>
                      {routine.titulo}{" "}
                      {isCurrent && (
                        <small className="group-routine-modal__badge">
                          Vinculada à turma
                        </small>
                      )}
                    </strong>
                    <span>
                      {routine.nomeModalidade || group.nomeModalidade} ·{" "}
                      {routine.frequenciaSemanal}x / semana · {metricsCount}{" "}
                      {metricsCount === 1 ? "métrica" : "métricas"} · {linkedCount}{" "}
                      {linkedCount === 1 ? "aluno vinculado" : "alunos vinculados"}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <p className="group-routine-modal__hint">
          Apenas rotinas ativas da modalidade <strong>{group.nomeModalidade}</strong>{" "}
          são exibidas. Todos os alunos da turma devem estar ativos e sem outra
          rotina ativa.
        </p>

        {error && (
          <div style={{ marginTop: "12px" }}>
            <p className="workspace-error" role="alert" style={{ margin: "0 0 8px 0" }}>
              {error}
            </p>
            {conflictPrompt && (
              <Button
                variant="primary"
                disabled={busy}
                loading={busy}
                onClick={() => handleConfirm(true)}
              >
                Encerrar rotina anterior e vincular
              </Button>
            )}
          </div>
        )}
      </div>
    </WorkspaceDialog>
  );
}

import { useState } from "react";
import WorkspaceDialog from "../WorkspaceDialog/WorkspaceDialog";
import Button from "../Button/Button";
import Avatar from "../Avatar/Avatar";
import Checkbox from "../Checkbox/Checkbox";
import { eligibleStudentsForRoutine } from "../../features/routines/routineModel";
import { rotinaService } from "../../services/rotinaService";
import { authError } from "../../utils/authError";
import type { AlunoResponse } from "../../types/student";
import type { RotinaResponse } from "../../types/rotina";
import "./RoutineAssignModal.css";

interface Props {
  routine: RotinaResponse;
  students: AlunoResponse[];
  routines: RotinaResponse[];
  onClose: () => void;
  onAssigned: (updated: RotinaResponse) => void;
}

export default function RoutineAssignModal({
  routine,
  students,
  routines,
  onClose,
  onAssigned,
}: Props) {
  const existingIds = new Set(routine.alunos.map((a) => a.id));
  const candidates = eligibleStudentsForRoutine(students, routines).filter(
    (student) => !existingIds.has(student.id)
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (selectedIds.size === 0) return;
    setBusy(true);
    setError("");
    try {
      // O endpoint recebe todos os alunos a serem vinculados
      const allIds = [...existingIds, ...selectedIds];
      const updated = await rotinaService.vincularAlunos(routine.id, allIds);
      onAssigned(updated);
    } catch (err: unknown) {
      setError(authError(err, "Não foi possível vincular os alunos selecionados.").message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceDialog
      title="Vincular alunos"
      description={`Adicione novos alunos à rotina “${routine.titulo}”.`}
      icon="/workspace/402-1230-imgIconLink.svg"
      busy={busy}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={selectedIds.size === 0 || busy}
            loading={busy}
            onClick={handleAssign}
          >
            Vincular {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        </>
      }
    >
      <div className="routine-assign">
        {candidates.length === 0 ? (
          <p className="routine-assign__empty">
            Não há outros alunos ativos sem rotina disponível no momento.
          </p>
        ) : (
          <ul className="routine-assign__list" aria-label="Alunos disponíveis">
            {candidates.map((student) => {
              const isChecked = selectedIds.has(student.id);
              return (
                <li key={student.id} className="routine-assign__item">
                  <Checkbox
                    checked={isChecked}
                    onChange={() => toggle(student.id)}
                    label={
                      <div className="routine-assign__item-content">
                        <Avatar name={student.usuario.nome} tone="info" />
                        <div className="routine-assign__info">
                          <strong>{student.usuario.nome}</strong>
                          <small>
                            {student.modalidades.map((m) => m.nome).join(", ") ||
                              "Geral"}
                          </small>
                        </div>
                      </div>
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
        {error && (
          <p className="workspace-dialog__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </WorkspaceDialog>
  );
}

import { useState } from "react";
import type { RotinaResponse } from "../../types/rotina";
import WorkspaceDialog from "../WorkspaceDialog/WorkspaceDialog";
import Button from "../Button/Button";

interface RoutineDeleteModalProps {
  routine: RotinaResponse;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function RoutineDeleteModal({
  routine,
  onClose,
  onConfirm,
}: RoutineDeleteModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const studentCount = routine.alunos?.length || 0;

  async function handleConfirm() {
    try {
      setSubmitting(true);
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WorkspaceDialog
      title="Deseja excluir essa rotina de treino?"
      description={`“${routine.titulo}” será removida dos ${studentCount} ${studentCount === 1 ? "aluno vinculado" : "alunos vinculados"}. O histórico de sessões já registradas será mantido.`}
      tone="danger"
      busy={submitting}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" disabled={submitting} onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" loading={submitting} onClick={handleConfirm}>
            {submitting ? "Excluindo..." : "Excluir rotina"}
          </Button>
        </>
      }
    />
  );
}

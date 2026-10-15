import { useEffect, useState } from "react";
import type { RotinaResponse } from "../../types/rotina";
import "./RoutineDeleteModal.css";

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleConfirm() {
    try {
      setSubmitting(true);
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }

  const studentCount = routine.alunos?.length || 0;

  return (
    <div
      className="routine-delete-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="routine-delete-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="routine-delete-modal">
        <button
          type="button"
          className="routine-delete-modal__close"
          aria-label="Fechar"
          onClick={onClose}
          disabled={submitting}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="routine-delete-modal__header">
          <div className="routine-delete-modal__icon-wrap">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <h2 id="routine-delete-modal-title" className="routine-delete-modal__title">
            Deseja excluir essa rotina de treino?
          </h2>
        </div>

        <div className="routine-delete-modal__body">
          <p>
            “{routine.titulo}” será removida dos {studentCount} {studentCount === 1 ? "aluno vinculado" : "alunos vinculados"}. O histórico de sessões já registradas será mantido.
          </p>
        </div>

        <div className="routine-delete-modal__footer">
          <button
            type="button"
            className="routine-delete-modal__btn-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="routine-delete-modal__btn-confirm"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Excluindo..." : "Excluir rotina"}
          </button>
        </div>
      </div>
    </div>
  );
}

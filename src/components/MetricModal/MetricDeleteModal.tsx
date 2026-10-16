import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { metricaService } from "../../services/metricaService";
import type { MetricaResponseDTO } from "../../types/metric";
import { getMetricStudentCount } from "../../features/metrics/metricModel";
import "./MetricDeleteModal.css";

interface MetricDeleteModalProps {
  metric: MetricaResponseDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export default function MetricDeleteModal({
  metric,
  isOpen,
  onClose,
  onSuccess,
}: MetricDeleteModalProps) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const studentCount = getMetricStudentCount(metric);
  const hasHistory = studentCount > 0;

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await metricaService.excluirMetrica(metric.id);
      toast.success(res.mensagem || (hasHistory ? "Métrica descontinuada com sucesso." : "Métrica excluída com sucesso."));
      onSuccess(metric.id);
      onClose();
    } catch {
      toast.error("Ocorreu um erro ao excluir/descontinuar a métrica.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="metric-delete-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="metric-delete-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="metric-delete-modal">
        <button
          type="button"
          className="metric-delete-modal__close"
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

        <div className="metric-delete-modal__header">
          <div className="metric-delete-modal__icon-wrap">
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
          <div>
            <h3 id="metric-delete-modal-title" className="metric-delete-modal__title">
              Excluir “{metric.titulo}”?
            </h3>
          </div>
        </div>

        <div className="metric-delete-modal__body">
          <p>
            {hasHistory
              ? "Esta métrica possui registros. Ela deixará de aparecer em novas sessões e será marcada como “métrica descontinuada”. O histórico permanece visível no dashboard do aluno."
              : "Esta métrica não possui registros e será excluída permanentemente. Deseja continuar?"}
          </p>
        </div>

        <div className="metric-delete-modal__footer">
          <button
            type="button"
            className="metric-delete-modal__btn-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="metric-delete-modal__btn-confirm"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting
              ? "Processando..."
              : hasHistory
              ? "Descontinuar métrica"
              : "Excluir métrica"}
          </button>
        </div>
      </div>
    </div>
  );
}

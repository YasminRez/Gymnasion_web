import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { metricaService } from "../../services/metricaService";
import type {
  MetricaResponseDTO,
  ResponsavelPreenchimento,
  TipoMetrica,
} from "../../types/metric";
import { CampoStrava, CAMPO_STRAVA_OPTIONS } from "../../types/strava";
import type { ModalidadeResponseDTO } from "../../types/modalidade";
import {
  METRIC_TYPE_OPTIONS,
  getMetricStudentCount,
  isMetricDuplicate,
  normalizeTipo,
  toBackendTipoMetrica,
} from "../../features/metrics/metricModel";
import "./MetricFormModal.css";

interface MetricFormModalProps {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  modalidades: ModalidadeResponseDTO[];
  defaultModalidadeId?: number | null;
  existingMetrics: MetricaResponseDTO[];
  metricToEdit?: MetricaResponseDTO | null;
  templateMetric?: MetricaResponseDTO | null;
  onSuccess: (metric: MetricaResponseDTO) => void;
}

export default function MetricFormModal({
  mode,
  isOpen,
  onClose,
  modalidades,
  defaultModalidadeId,
  existingMetrics,
  metricToEdit,
  templateMetric,
  onSuccess,
}: MetricFormModalProps) {
  const isEdit = mode === "edit" && Boolean(metricToEdit);
  const sourceMetric = isEdit ? metricToEdit : templateMetric;

  // Form states
  const [modalidadeId, setModalidadeId] = useState<number>(() => {
    if (isEdit && metricToEdit) return metricToEdit.modalidadeId;
    if (templateMetric) {
      if (templateMetric.id) {
        const otherMod = modalidades.find((m) => m.id !== templateMetric.modalidadeId);
        return otherMod?.id || templateMetric.modalidadeId;
      }
      return templateMetric.modalidadeId;
    }
    if (defaultModalidadeId) return defaultModalidadeId;
    return modalidades[0]?.id || 1;
  });

  const [titulo, setTitulo] = useState<string>(() => {
    return sourceMetric ? sourceMetric.titulo : "";
  });

  const [tipo, setTipo] = useState<TipoMetrica>(() => {
    if (sourceMetric) return sourceMetric.tipo;
    return "TEMPO";
  });

  const [obrigatoria, setObrigatoria] = useState<boolean>(() => {
    if (sourceMetric) return sourceMetric.obrigatoria !== false;
    return true;
  });

  const [quemPreenche, setQuemPreenche] = useState<ResponsavelPreenchimento>(() => {
    if (sourceMetric && sourceMetric.quemPreenche) {
      return sourceMetric.quemPreenche;
    }
    return "AMBOS";
  });

  const [campoStrava, setCampoStrava] = useState<CampoStrava>(() => {
    return sourceMetric?.campoStrava ? sourceMetric.campoStrava : "NENHUM";
  });

  const [titleError, setTitleError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Student records count for edit lock
  const studentCount = isEdit && metricToEdit ? getMetricStudentCount(metricToEdit) : 0;
  const isTypeLocked = isEdit && studentCount > 0;

  // Sync state when modal opens or editing metric changes
  useEffect(() => {
    if (isOpen) {
      if (isEdit && metricToEdit) {
        setModalidadeId(metricToEdit.modalidadeId);
        setTitulo(metricToEdit.titulo);
        setTipo(metricToEdit.tipo);
        setObrigatoria(metricToEdit.obrigatoria !== false);
        setQuemPreenche(metricToEdit.quemPreenche || "AMBOS");
        setCampoStrava(metricToEdit.campoStrava || "NENHUM");
      } else if (templateMetric) {
        if (templateMetric.id) {
          const otherMod = modalidades.find((m) => m.id !== templateMetric.modalidadeId);
          setModalidadeId(otherMod?.id || templateMetric.modalidadeId);
        } else {
          setModalidadeId(templateMetric.modalidadeId);
        }
        setTitulo(templateMetric.titulo);
        setTipo(templateMetric.tipo);
        setObrigatoria(templateMetric.obrigatoria !== false);
        setQuemPreenche(templateMetric.quemPreenche || "AMBOS");
        setCampoStrava(templateMetric.campoStrava || "NENHUM");
      } else {
        setModalidadeId(defaultModalidadeId || modalidades[0]?.id || 1);
        setTitulo("");
        setTipo("TEMPO");
        setObrigatoria(true);
        setQuemPreenche("AMBOS");
        setCampoStrava("NENHUM");
      }
      setTitleError("");
    }
  }, [isOpen, isEdit, metricToEdit, templateMetric, defaultModalidadeId, modalidades]);

  // Keyboard shortcut: Escape
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

  const currentModalityName =
    modalidades.find((m) => m.id === modalidadeId)?.nome ||
    metricToEdit?.nomeModalidade ||
    "Modalidade";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTitleError("");

    const cleanTitle = titulo.trim();
    if (!cleanTitle) {
      setTitleError("Informe o título da métrica.");
      return;
    }

    // Client-side uniqueness check (RN-016)
    const isDup = isMetricDuplicate(
      cleanTitle,
      modalidadeId,
      existingMetrics,
      isEdit && metricToEdit ? metricToEdit.id : undefined
    );

    if (isDup) {
      setTitleError("Já existe uma métrica com esse nome nessa modalidade.");
      return;
    }

    setSubmitting(true);
    const backendTipo = toBackendTipoMetrica(tipo);
    const campoStravaPayload = campoStrava === "NENHUM" ? null : campoStrava;
    try {
      if (isEdit && metricToEdit) {
        const updated = await metricaService.atualizarMetrica(metricToEdit.id, {
          titulo: cleanTitle,
          tipo: backendTipo,
          obrigatoria,
          quemPreenche,
          campoStrava: campoStravaPayload,
        });
        toast.success("Métrica atualizada com sucesso!");
        onSuccess({
          ...metricToEdit,
          ...updated,
          titulo: cleanTitle,
          tipo: backendTipo,
          obrigatoria,
          quemPreenche,
          campoStrava: campoStravaPayload,
          modalidadeId,
          nomeModalidade: currentModalityName,
        });
      } else {
        const created = await metricaService.criarMetrica({
          modalidadeId,
          titulo: cleanTitle,
          tipo: backendTipo,
          obrigatoria,
          quemPreenche,
          campoStrava: campoStravaPayload,
        });
        toast.success("Métrica cadastrada com sucesso!");
        onSuccess({
          ...created,
          titulo: cleanTitle,
          tipo: backendTipo,
          obrigatoria,
          quemPreenche,
          campoStrava: campoStravaPayload,
          modalidadeId,
          nomeModalidade: currentModalityName,
          quantidadeAlunosComRegistro: 0,
          ativo: true,
          descontinuada: false,
        });
      }
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { detail?: string; invalidFields?: Record<string, string> } } };
      if (errorObj?.response?.status === 409) {
        setTitleError("Já existe uma métrica com esse nome nessa modalidade.");
      } else if (errorObj?.response?.data?.invalidFields?.titulo) {
        setTitleError(errorObj.response.data.invalidFields.titulo);
      } else if (errorObj?.response?.data?.detail) {
        setTitleError(errorObj.response.data.detail);
      } else {
        toast.error("Ocorreu um erro ao salvar a métrica.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="metric-form-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="metric-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="metric-form-modal">
        <button
          type="button"
          className="metric-form-modal__close"
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

        {/* Modal Header */}
        <div className="metric-form-modal__header">
          <div className="metric-form-modal__icon-wrap">
            {isEdit ? (
              // Pencil icon
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            ) : (
              // Activity / pulse icon
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            )}
          </div>
          <div className="metric-form-modal__title-area">
            <h3 id="metric-form-title" className="metric-form-modal__title">
              {isEdit ? "Editar métrica" : "Criar métrica"}
            </h3>
            <p className="metric-form-modal__subtitle">
              {isEdit
                ? `${metricToEdit?.titulo} · ${currentModalityName} · ${studentCount} ${
                    studentCount === 1 ? "aluno com registros" : "alunos com registros"
                  }`
                : "O campo ficará disponível no registro de desempenho dos alunos da modalidade."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Modalidade (shown in Create mode) */}
          {!isEdit && (
            <div className="metric-form-modal__field">
              <label htmlFor="metric-modalidade-select" className="metric-form-modal__label">
                Modalidade
              </label>
              <select
                id="metric-modalidade-select"
                className="metric-form-modal__select"
                value={modalidadeId}
                onChange={(e) => {
                  setModalidadeId(Number(e.target.value));
                  setTitleError("");
                }}
                disabled={submitting}
              >
                {modalidades.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Título da métrica */}
          <div className="metric-form-modal__field">
            <label htmlFor="metric-titulo-input" className="metric-form-modal__label">
              Título da métrica
            </label>
            <input
              id="metric-titulo-input"
              type="text"
              className={`metric-form-modal__input ${titleError ? "is-error" : ""}`}
              placeholder="Tempo de virada"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (titleError) setTitleError("");
              }}
              disabled={submitting}
              maxLength={100}
              autoFocus
            />
            {titleError && (
              <p className="metric-form-modal__error-msg">{titleError}</p>
            )}
          </div>

          {/* Lock warning in Edit with history */}
          {isTypeLocked && (
            <div className="metric-form-modal__warning">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>
                Não é possível alterar o tipo de uma métrica com histórico de registros. Crie uma nova métrica.
              </span>
            </div>
          )}

          {/* Tipo de métrica (2x2 grid) */}
          <div className="metric-form-modal__field">
            <label className="metric-form-modal__label">Tipo de métrica</label>
            <div className="metric-form-modal__types-grid">
              {METRIC_TYPE_OPTIONS.map((opt) => {
                const normOpt = normalizeTipo(opt.value);
                const normCurrent = normalizeTipo(tipo);
                const isSelected = normOpt === normCurrent;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`metric-form-modal__type-card ${
                      isSelected ? "is-selected" : ""
                    } ${isTypeLocked ? "is-disabled" : ""}`}
                    onClick={() => {
                      if (!isTypeLocked) {
                        setTipo(opt.value);
                      }
                    }}
                    disabled={isTypeLocked}
                  >
                    <div className="metric-form-modal__type-icon">
                      {normOpt === "NUMERICO" ? (
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
                          <line x1="4" y1="9" x2="20" y2="9" />
                          <line x1="4" y1="15" x2="20" y2="15" />
                          <line x1="10" y1="3" x2="8" y2="21" />
                          <line x1="16" y1="3" x2="14" y2="21" />
                        </svg>
                      ) : normOpt === "TEMPO" ? (
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
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      ) : normOpt === "FREQUENCIA_CARDIACA" ? (
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
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      ) : (
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
                          <line x1="21" y1="10" x2="3" y2="10" />
                          <line x1="21" y1="6" x2="3" y2="6" />
                          <line x1="21" y1="14" x2="3" y2="14" />
                          <line x1="21" y1="18" x2="3" y2="18" />
                        </svg>
                      )}
                    </div>
                    <div className="metric-form-modal__type-info">
                      <h4>{opt.title}</h4>
                      <p>{opt.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Obrigatoriedade */}
          <div className="metric-form-modal__field">
            <label className="metric-form-modal__label">Obrigatoriedade</label>
            <div className="metric-form-modal__segmented">
              <button
                type="button"
                className={`metric-form-modal__segment-btn ${
                  obrigatoria ? "is-selected" : ""
                }`}
                onClick={() => setObrigatoria(true)}
              >
                Obrigatória
              </button>
              <button
                type="button"
                className={`metric-form-modal__segment-btn ${
                  !obrigatoria ? "is-selected" : ""
                }`}
                onClick={() => setObrigatoria(false)}
              >
                Opcional
              </button>
            </div>
          </div>

          {/* Quem pode preencher */}
          <div className="metric-form-modal__field">
            <label className="metric-form-modal__label">Quem pode preencher</label>
            <div className="metric-form-modal__segmented">
              <button
                type="button"
                className={`metric-form-modal__segment-btn ${
                  quemPreenche === "ALUNO" ? "is-selected" : ""
                }`}
                onClick={() => setQuemPreenche("ALUNO")}
              >
                Aluno
              </button>
              <button
                type="button"
                className={`metric-form-modal__segment-btn ${
                  quemPreenche === "PERSONAL" ? "is-selected" : ""
                }`}
                onClick={() => setQuemPreenche("PERSONAL")}
              >
                Personal trainer
              </button>
              <button
                type="button"
                className={`metric-form-modal__segment-btn ${
                  quemPreenche === "AMBOS" ? "is-selected" : ""
                }`}
                onClick={() => setQuemPreenche("AMBOS")}
              >
                Aluno e personal
              </button>
            </div>
          </div>

          {/* Vínculo com o Strava (opcional) */}
          <div className="metric-form-modal__field">
            <label htmlFor="metric-strava-select" className="metric-form-modal__label">
              Vincular a dado do Strava (opcional)
            </label>
            <select
              id="metric-strava-select"
              className="metric-form-modal__select"
              value={campoStrava || "NENHUM"}
              onChange={(e) => setCampoStrava(e.target.value as CampoStrava)}
              disabled={submitting}
            >
              {CAMPO_STRAVA_OPTIONS.filter(
                (opt) => opt.value === "NENHUM" || opt.tiposValidos.includes(normalizeTipo(tipo))
              ).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500, #64748b)", marginTop: "4px" }}>
              Ao importar um treino do Strava, este campo será preenchido automaticamente com o dado selecionado.
            </p>
          </div>

          {/* Footer actions */}
          <div className="metric-form-modal__footer">
            <button
              type="button"
              className="metric-form-modal__btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="metric-form-modal__btn-submit"
              disabled={submitting}
            >
              {submitting
                ? "Salvando..."
                : isEdit
                ? "Salvar alterações"
                : "Salvar métrica"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

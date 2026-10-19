import { useContext, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import Badge from "../Badge/Badge";
import Button from "../Button/Button";
import { StudentContext, type StudentExecutionConfirmDetails } from "../../features/studentArea/StudentContext";
import { getBorgInfo } from "../../features/studentArea/studentAreaModel";
import { localDateKey } from "../../features/personal/dashboardModel";
import { alunoService } from "../../services/alunoService";
import { authError } from "../../utils/authError";
import type { StudentExecutionMetricDTO, StudentSessionMetricResult } from "../../types/studentArea";
import "./StudentRpeModal.css";

interface StudentRpeModalProps {
  sessionId?: string | null;
  initialRpe?: number | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (rpe: number | null, details?: StudentExecutionConfirmDetails) => void;
}

function normalizeMetricType(raw?: string): "NUMERICO" | "TEMPO" | "FREQUENCIA_CARDIACA" | "TEXTO" {
  const up = (raw || "").toUpperCase();
  if (up.includes("TEMPO")) return "TEMPO";
  if (up.includes("FREQ") || up.includes("CARD")) return "FREQUENCIA_CARDIACA";
  if (up.includes("TEXT") || up.includes("OBS")) return "TEXTO";
  return "NUMERICO";
}

function metricTypeLabel(raw?: string): string {
  const norm = normalizeMetricType(raw);
  switch (norm) {
    case "TEMPO":
      return "Tempo (mm:ss)";
    case "FREQUENCIA_CARDIACA":
      return "Frequência cardíaca (bpm)";
    case "TEXTO":
      return "Texto / Observação";
    default:
      return "Numérico";
  }
}

function metricPlaceholder(raw?: string): string {
  const norm = normalizeMetricType(raw);
  switch (norm) {
    case "TEMPO":
      return "Ex.: 01:42";
    case "FREQUENCIA_CARDIACA":
      return "Ex.: 152 (entre 30 e 250)";
    case "TEXTO":
      return "Descreva o resultado ou observação...";
    default:
      return "Ex.: 60 ou 12,5";
  }
}

function validateStudentMetricValue(metric: StudentExecutionMetricDTO, rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    if (metric.obrigatoria) {
      return `A métrica '${metric.titulo}' é obrigatória e deve ser preenchida.`;
    }
    return null;
  }

  if (trimmed.length > 255) {
    return `Valor inválido para a métrica ${metric.titulo}. Verifique o formato esperado (máx. 255 caracteres).`;
  }

  const norm = normalizeMetricType(metric.tipo);
  if (norm === "NUMERICO") {
    const validNum =
      /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed) &&
      Number.isFinite(Number(trimmed.replace(",", ".")));
    if (!validNum) {
      return `Valor inválido para a métrica ${metric.titulo}. Verifique o formato esperado: deve ser numérico.`;
    }
  } else if (norm === "TEMPO") {
    if (!/^\d+:[0-5]\d$/.test(trimmed)) {
      return `Valor inválido para a métrica ${metric.titulo}. Verifique o formato esperado: mm:ss (ex.: 01:42).`;
    }
  } else if (norm === "FREQUENCIA_CARDIACA") {
    const bpm = Number(trimmed);
    if (!/^\d+$/.test(trimmed) || bpm < 30 || bpm > 250) {
      return `Valor inválido para a métrica ${metric.titulo}. Verifique o formato esperado: entre 30 e 250 bpm.`;
    }
  }

  return null;
}

function serializeStudentMetricValue(rawType: string, rawValue: string): string {
  const trimmed = rawValue.trim();
  const norm = normalizeMetricType(rawType);
  if (norm === "TEMPO") {
    const [min, sec] = trimmed.split(":");
    return `${(min || "0").padStart(2, "0")}:${sec || "00"}`;
  }
  if (norm === "NUMERICO") {
    return trimmed.replace(",", ".");
  }
  return trimmed;
}

export default function StudentRpeModal({
  sessionId: propSessionId,
  initialRpe = 7,
  busy: externalBusy = false,
  onClose,
  onConfirm,
}: StudentRpeModalProps) {
  const studentCtx = useContext(StudentContext);
  const resolvedSessionId = propSessionId ?? studentCtx?.rpeModalSessionId ?? null;

  const targetSession = useMemo(() => {
    if (!resolvedSessionId || !studentCtx?.weeks) return null;
    for (const w of studentCtx.weeks) {
      const found = w.sessoes.find((s) => s.id === resolvedSessionId);
      if (found) return found;
    }
    return null;
  }, [resolvedSessionId, studentCtx?.weeks]);

  const [step, setStep] = useState<"metrics" | "rpe">("metrics");
  const [loadingForm, setLoadingForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<StudentExecutionMetricDTO[]>(
    () => studentCtx?.activeRoutine?.metricas || []
  );

  const todayIso = useMemo(() => localDateKey(new Date()), []);
  const [dateReal, setDateReal] = useState<string>(todayIso);
  const [duration, setDuration] = useState<string>(() =>
    String(targetSession?.duracaoPlanejada || 50)
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>("");
  const [selectedRpe, setSelectedRpe] = useState<number | null>(initialRpe);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const busy = externalBusy || submitting;

  // Abre o dialog nativo
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, []);

  // Carrega o formulário de execução da sessão no back-end (US-22 C1)
  useEffect(() => {
    if (!resolvedSessionId) return;
    let active = true;
    setLoadingForm(true);
    alunoService
      .obterFormularioExecucao(resolvedSessionId)
      .then((form) => {
        if (!active) return;
        if (Array.isArray(form.metricas) && form.metricas.length > 0) {
          setMetrics(form.metricas);
        }
        if (form.sessao?.duracao) {
          setDuration(String(form.sessao.duracao));
        }
      })
      .catch(() => {
        // Fallback para métricas já carregadas na rotina ativa
      })
      .finally(() => {
        if (active) setLoadingForm(false);
      });

    return () => {
      active = false;
    };
  }, [resolvedSessionId]);

  const studentMetrics = useMemo(
    () => metrics.filter((m) => m.quemPreenche !== "PERSONAL"),
    [metrics]
  );

  const personalOnlyMetrics = useMemo(
    () => metrics.filter((m) => m.quemPreenche === "PERSONAL"),
    [metrics]
  );

  function validateStepOne(): boolean {
    const nextErrors: Record<string, string> = {};

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateReal) ||
      Number.isNaN(new Date(dateReal + "T12:00:00").getTime())
    ) {
      nextErrors.dataReal = "Informe uma data de realização válida.";
    }

    if (duration.trim()) {
      const durNum = Number(duration);
      if (!/^\d+$/.test(duration.trim()) || durNum < 1) {
        nextErrors.duracao = "A duração real deve ser no mínimo 1 minuto.";
      }
    }

    for (const metric of studentMetrics) {
      const msg = validateStudentMetricValue(metric, values[metric.id] || "");
      if (msg) {
        nextErrors[metric.id] = msg;
      }
    }

    setErrors(nextErrors);
    setFormError("");
    return Object.keys(nextErrors).length === 0;
  }

  function handleContinueToRpe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStepOne()) return;
    setStep("rpe");
  }

  async function handleFinalize(rpeToSave: number | null) {
    if (busy) return;
    if (!validateStepOne()) {
      setStep("metrics");
      return;
    }

    const duracaoNum = duration.trim() ? Number(duration.trim()) : null;
    const filledMetrics = studentMetrics.filter((m) => (values[m.id] || "").trim().length > 0);

    const payloadResultados = filledMetrics.map((m) => ({
      metricaId: m.id,
      valor: serializeStudentMetricValue(m.tipo, values[m.id]),
    }));

    const localResults: StudentSessionMetricResult[] = filledMetrics.map((m) => ({
      metricaId: m.id,
      titulo: m.titulo,
      tipo: m.tipo,
      valor: serializeStudentMetricValue(m.tipo, values[m.id]),
    }));

    if (!resolvedSessionId) {
      onConfirm(rpeToSave, {
        dataReal: dateReal,
        duracao: duracaoNum,
        resultados: localResults,
      });
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await alunoService.registrarExecucao(resolvedSessionId, {
        dataReal: dateReal,
        duracao: duracaoNum,
        nivelCansaco: rpeToSave,
        resultados: payloadResultados,
      });

      onConfirm(rpeToSave, {
        dataReal: dateReal,
        duracao: duracaoNum,
        resultados: localResults,
        alreadySavedOnBackend: true,
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.invalidFields) {
        const backendFields = err.response.data.invalidFields as Record<string, string>;
        setErrors(backendFields);
        setStep("metrics");
      }
      setFormError(
        authError(err, "Não foi possível finalizar a sessão. Verifique os campos informados.")
          .message
      );
    } finally {
      setSubmitting(false);
    }
  }

  const borgInfo = getBorgInfo(selectedRpe);

  return (
    <dialog
      ref={dialogRef}
      className="student-rpe-modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="student-rpe-modal__header">
        <span className="student-rpe-modal__icon" aria-hidden="true">
          <img
            src={
              step === "rpe"
                ? "/student-profile/imgIconFlame.svg"
                : "/student-profile/imgIconActivity2.svg"
            }
            alt=""
          />
        </span>
        <div className="student-rpe-modal__titles">
          <h2 id={titleId}>
            {step === "metrics"
              ? "Finalizar sessão e enviar métricas"
              : "Como você avalia seu nível de esforço nesta sessão?"}
          </h2>
          <p>
            {step === "metrics"
              ? targetSession
                ? `${targetSession.titulo} · Planejada para ${targetSession.dataPlanejada}`
                : "Preencha os resultados solicitados pelo seu personal trainer"
              : "Escala de Borg CR-10 (1 a 10) · campo opcional"}
          </p>
        </div>
        <button
          type="button"
          className="student-rpe-modal__close"
          aria-label="Fechar modal"
          disabled={busy}
          onClick={onClose}
        >
          <img src="/auth/close.svg" alt="" />
        </button>
      </div>

      {formError && (
        <div className="student-rpe-modal__error-banner" role="alert">
          {formError}
        </div>
      )}

      {step === "metrics" ? (
        <form className="student-rpe-modal__form" onSubmit={handleContinueToRpe} noValidate>
          {/* Data real e duração (US-22 C7) */}
          <div className="student-rpe-modal__row-2">
            <div className="student-rpe-modal__field">
              <label htmlFor="student-exec-date">Data de realização *</label>
              <input
                id="student-exec-date"
                type="date"
                value={dateReal}
                max={todayIso}
                disabled={busy}
                onChange={(e) => {
                  setDateReal(e.target.value);
                  setErrors((prev) => ({ ...prev, dataReal: "" }));
                }}
                className={errors.dataReal ? "has-error" : ""}
              />
              {errors.dataReal && (
                <span className="student-rpe-modal__field-error">{errors.dataReal}</span>
              )}
            </div>

            <div className="student-rpe-modal__field">
              <label htmlFor="student-exec-duration">Duração real (minutos)</label>
              <input
                id="student-exec-duration"
                type="number"
                min={1}
                step={1}
                placeholder="Ex.: 45"
                value={duration}
                disabled={busy}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setErrors((prev) => ({ ...prev, duracao: "" }));
                }}
                className={errors.duracao ? "has-error" : ""}
              />
              {errors.duracao && (
                <span className="student-rpe-modal__field-error">{errors.duracao}</span>
              )}
            </div>
          </div>

          {/* Métricas solicitadas pelo personal (US-13 / US-22) */}
          <div className="student-rpe-modal__metrics-section">
            <div className="student-rpe-modal__metrics-head">
              <strong>Métricas solicitadas pelo personal</strong>
              <span>Preencha os resultados alcançados no treino</span>
            </div>

            {loadingForm && metrics.length === 0 ? (
              <p className="student-rpe-modal__empty-metrics">Carregando métricas da sessão...</p>
            ) : studentMetrics.length === 0 ? (
              <p className="student-rpe-modal__empty-metrics">
                Nenhuma métrica de preenchimento do aluno para esta sessão. Clique em continuar para
                informar seu nível de esforço (RPE) e concluir.
              </p>
            ) : (
              <div className="student-rpe-modal__metrics-list">
                {studentMetrics.map((metric) => {
                  const fieldId = `student-metric-${metric.id}`;
                  const normType = normalizeMetricType(metric.tipo);
                  const errMsg = errors[metric.id];

                  return (
                    <div key={metric.id} className="student-rpe-modal__metric-item">
                      <div className="student-rpe-modal__metric-label-row">
                        <label htmlFor={fieldId}>
                          {metric.titulo}
                          {metric.obrigatoria ? " *" : ""}
                        </label>
                        <div className="student-rpe-modal__metric-badges">
                          <span className="student-rpe-modal__metric-type">
                            {metricTypeLabel(metric.tipo)}
                          </span>
                          <Badge tone={metric.obrigatoria ? "warning" : "neutral"}>
                            {metric.obrigatoria ? "Obrigatória" : "Opcional"}
                          </Badge>
                        </div>
                      </div>

                      {normType === "TEXTO" ? (
                        <textarea
                          id={fieldId}
                          rows={2}
                          maxLength={255}
                          placeholder={metricPlaceholder(metric.tipo)}
                          value={values[metric.id] || ""}
                          disabled={busy}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValues((prev) => ({ ...prev, [metric.id]: val }));
                            setErrors((prev) => ({ ...prev, [metric.id]: "" }));
                          }}
                          className={errMsg ? "has-error" : ""}
                        />
                      ) : (
                        <input
                          id={fieldId}
                          type="text"
                          maxLength={255}
                          placeholder={metricPlaceholder(metric.tipo)}
                          value={values[metric.id] || ""}
                          disabled={busy}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValues((prev) => ({ ...prev, [metric.id]: val }));
                            setErrors((prev) => ({ ...prev, [metric.id]: "" }));
                          }}
                          className={errMsg ? "has-error" : ""}
                        />
                      )}

                      {errMsg && (
                        <span className="student-rpe-modal__field-error" role="alert">
                          {errMsg}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {personalOnlyMetrics.length > 0 && (
              <div className="student-rpe-modal__personal-metrics-note">
                <strong>Avaliação do personal trainer:</strong>{" "}
                <span>
                  {personalOnlyMetrics
                    .map((m) => `${m.titulo} (${m.obrigatoria ? "obrigatória" : "opcional"})`)
                    .join(", ")}{" "}
                  {personalOnlyMetrics.length === 1
                    ? "será preenchida pelo seu personal após a conclusão."
                    : "serão preenchidas pelo seu personal após a conclusão."}
                </span>
              </div>
            )}
          </div>

          <footer className="student-rpe-modal__footer">
            <button
              type="button"
              className="student-rpe-modal__skip"
              disabled={busy}
              onClick={onClose}
            >
              Cancelar
            </button>
            <Button type="submit" disabled={busy}>
              Continuar para esforço (RPE) →
            </Button>
          </footer>
        </form>
      ) : (
        <>
          <div
            className="student-rpe-modal__scale-buttons"
            role="group"
            aria-label="Nível de esforço de 1 a 10"
          >
            {Array.from({ length: 10 }, (_, idx) => idx + 1).map((level) => {
              const isSelected = selectedRpe === level;
              const toneClass =
                level <= 4
                  ? "student-rpe-modal__btn--green"
                  : level <= 6
                  ? "student-rpe-modal__btn--amber"
                  : level <= 8
                  ? "student-rpe-modal__btn--orange"
                  : "student-rpe-modal__btn--red";

              return (
                <button
                  key={level}
                  type="button"
                  className={`student-rpe-modal__btn ${toneClass}${
                    isSelected ? " is-selected" : ""
                  }`}
                  aria-pressed={isSelected}
                  disabled={busy}
                  onClick={() => setSelectedRpe(level)}
                >
                  {level}
                </button>
              );
            })}
          </div>

          <div className="student-rpe-modal__scale-labels" aria-hidden="true">
            <span>Muito leve</span>
            <span>Moderado</span>
            <span>Máximo</span>
          </div>

          <div className="student-rpe-modal__callout" role="status">
            <span
              className={`student-rpe-modal__callout-badge student-rpe-modal__callout-badge--${borgInfo.tone}`}
            >
              {borgInfo.levelLabel}
            </span>
            <div className="student-rpe-modal__callout-text">
              <strong>{borgInfo.title}</strong>
              <p>{borgInfo.description}</p>
            </div>
          </div>

          <footer className="student-rpe-modal__footer student-rpe-modal__footer--between">
            <button
              type="button"
              className="student-rpe-modal__skip"
              disabled={busy}
              onClick={() => setStep("metrics")}
            >
              ← Voltar às métricas
            </button>

            <div className="student-rpe-modal__footer-right">
              <button
                type="button"
                className="student-rpe-modal__skip"
                disabled={busy}
                onClick={() => void handleFinalize(null)}
              >
                Pular esforço
              </button>
              <Button loading={busy} onClick={() => void handleFinalize(selectedRpe)}>
                Finalizar sessão
              </Button>
            </div>
          </footer>
        </>
      )}
    </dialog>
  );
}


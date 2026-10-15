import { useEffect, useState, type FormEvent } from "react";
import WorkspaceDialog from "../WorkspaceDialog/WorkspaceDialog";
import Button from "../Button/Button";
import FormField from "../FormField/FormField";
import Avatar from "../Avatar/Avatar";
import Checkbox from "../Checkbox/Checkbox";
import MetricCreateModal from "../MetricCreateModal/MetricCreateModal";
import { rotinaService } from "../../services/rotinaService";
import { metricaService } from "../../services/metricaService";
import { authError } from "../../utils/authError";
import {
  eligibleStudentsForRoutine,
  metricIcons,
  metricLabels,
  validateCreateRoutinePayload,
  WEEK_DAYS,
} from "../../features/routines/routineModel";
import type { MetricaResponseDTO } from "../../types/metric";
import type { AlunoResponse } from "../../types/student";
import type { RotinaResponse } from "../../types/rotina";
import "./RoutineFormModal.css";

interface Props {
  modalities: { id: number; nome: string; descricao?: string }[];
  students: AlunoResponse[];
  routines: RotinaResponse[];
  initialStudentId?: string;
  onClose: () => void;
  onSaved: (routine: RotinaResponse) => void;
}

export default function RoutineFormModal({
  modalities,
  students,
  routines,
  initialStudentId,
  onClose,
  onSaved,
}: Props) {
  const [title, setTitle] = useState("");
  const [modalityId, setModalityId] = useState<number | null>(modalities[0]?.id || null);
  const [frequency, setFrequency] = useState<number>(3);
  const [goal, setGoal] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    () => new Set(initialStudentId ? [initialStudentId] : [])
  );
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set());

  const [metrics, setMetrics] = useState<MetricaResponseDTO[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");
  const [creatingMetric, setCreatingMetric] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  // Carrega métricas da modalidade selecionada
  useEffect(() => {
    if (!modalityId) return;
    let cancelled = false;
    setMetricsLoading(true);
    setMetricsError("");
    setSelectedMetrics(new Set());

    metricaService
      .listarPorModalidade(modalityId)
      .then((data) => {
        if (!cancelled) {
          const activeMetrics = data.filter((m) => m.ativo);
          setMetrics(activeMetrics);
          // Pré-seleciona até 3 métricas se houver
          if (activeMetrics.length > 0) {
            setSelectedMetrics(new Set(activeMetrics.slice(0, 3).map((m) => m.id)));
          }
          setMetricsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMetricsError("Não foi possível carregar as métricas para esta modalidade.");
          setMetricsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [modalityId]);

  const candidateStudents = eligibleStudentsForRoutine(students, routines);

  function toggleStudent(id: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMetric(id: string) {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      titulo: title.trim(),
      modalidadeId: modalityId || 0,
      frequenciaSemanal: frequency,
      objetivos: goal.trim(),
      alunosIds: Array.from(selectedStudents),
      metricasIds: Array.from(selectedMetrics),
    };

    const clientErrors = validateCreateRoutinePayload(payload);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSaving(true);
    setServerError("");
    try {
      const created = await rotinaService.criar(payload);
      onSaved(created);
    } catch (err: unknown) {
      setServerError(
        authError(
          err,
          "Não foi possível salvar a rotina. Verifique se o aluno já possui rotina ativa."
        ).message
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedModality = modalities.find((m) => m.id === modalityId);

  return (
    <WorkspaceDialog
      title="Nova rotina de treino"
      description="Configure o planejamento, modalidade, frequência semanal, alunos e métricas."
      icon="/design-system/imgIconDumbbell.svg"
      busy={saving}
      wide
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="routine-form"
            loading={saving}
            disabled={saving || metricsLoading}
          >
            Criar rotina
          </Button>
        </>
      }
    >
      <form id="routine-form" onSubmit={handleSubmit} className="routine-form-v2">
        <FormField
          id="routine-title"
          label="Título da rotina"
          placeholder="Ex: Treino de Força e Resistência"
          value={title}
          maxLength={150}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.titulo}
          disabled={saving}
          autoFocus
        />

        <div className="routine-form-v2__field">
          <label className="routine-form-v2__label">Modalidade</label>
          <div className="routine-form-v2__chips">
            {modalities.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`routine-form-v2__chip ${modalityId === item.id ? "routine-form-v2__chip--active" : ""}`}
                onClick={() => setModalityId(item.id)}
                disabled={saving}
              >
                {item.nome}
              </button>
            ))}
          </div>
          {errors.modalidadeId && (
            <p className="routine-form-v2__error">{errors.modalidadeId}</p>
          )}
        </div>

        <div className="routine-form-v2__field">
          <label className="routine-form-v2__label">
            Frequência semanal <span>(dias por semana)</span>
          </label>
          <div className="routine-form-v2__chips routine-form-v2__chips--days">
            {WEEK_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className={`routine-form-v2__chip ${frequency === day ? "routine-form-v2__chip--active" : ""}`}
                onClick={() => setFrequency(day)}
                disabled={saving}
              >
                {day}x
              </button>
            ))}
          </div>
          {errors.frequenciaSemanal && (
            <p className="routine-form-v2__error">{errors.frequenciaSemanal}</p>
          )}
        </div>

        <div className="routine-form-v2__field">
          <label htmlFor="routine-goal" className="routine-form-v2__label">
            Objetivos do treinamento
          </label>
          <textarea
            id="routine-goal"
            className="routine-form-v2__textarea"
            rows={2}
            placeholder="Ex: Aumento da capacidade cardiorrespiratória e ritmo."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={saving}
          />
          {errors.objetivos && (
            <p className="routine-form-v2__error">{errors.objetivos}</p>
          )}
        </div>

        <div className="routine-form-v2__field">
          <div className="routine-form-v2__section-header">
            <label className="routine-form-v2__label">
              Alunos vinculados ({selectedStudents.size}{" "}
              {selectedStudents.size === 1 ? "selecionado" : "selecionados"})
            </label>
            <span className="routine-form-v2__subnote">
              Apenas alunos ativos sem outra rotina ativa
            </span>
          </div>

          {candidateStudents.length === 0 ? (
            <p className="routine-form-v2__empty">
              Nenhum aluno ativo sem rotina disponível. Cadastre novos alunos ou encerre rotinas anteriores.
            </p>
          ) : (
            <ul className="routine-form-v2__items-list" aria-label="Alunos disponíveis">
              {candidateStudents.map((aluno) => {
                const checked = selectedStudents.has(aluno.id);
                return (
                  <li key={aluno.id} className="routine-form-v2__item">
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleStudent(aluno.id)}
                      disabled={saving}
                      label={
                        <div className="routine-form-v2__item-content">
                          <Avatar name={aluno.usuario.nome} tone="info" />
                          <div className="routine-form-v2__item-info">
                            <strong>{aluno.usuario.nome}</strong>
                            <small>
                              {aluno.modalidades.map((m) => m.nome).join(", ") || "Geral"}
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
          {errors.alunosIds && (
            <p className="routine-form-v2__error">{errors.alunosIds}</p>
          )}
        </div>

        <div className="routine-form-v2__field">
          <div className="routine-form-v2__section-header">
            <label className="routine-form-v2__label">
              Métricas acompanhadas ({selectedMetrics.size}{" "}
              {selectedMetrics.size === 1 ? "selecionada" : "selecionadas"})
            </label>
            {selectedModality && (
              <button
                type="button"
                className="routine-form-v2__add-metric-btn"
                onClick={() => setCreatingMetric(true)}
              >
                + Nova métrica
              </button>
            )}
          </div>

          {metricsLoading ? (
            <p className="routine-form-v2__empty">Carregando métricas da modalidade...</p>
          ) : metricsError ? (
            <p className="routine-form-v2__empty routine-form-v2__empty--error">
              {metricsError}
            </p>
          ) : metrics.length === 0 ? (
            <div className="routine-form-v2__empty routine-form-v2__empty--alert">
              <p>
                Nenhuma métrica cadastrada para {selectedModality?.nome || "esta modalidade"}.
              </p>
              <Button
                variant="secondary"
                onClick={() => setCreatingMetric(true)}
              >
                + Cadastrar métrica agora
              </Button>
            </div>
          ) : (
            <ul className="routine-form-v2__items-list" aria-label="Métricas disponíveis">
              {metrics.map((metric) => {
                const checked = selectedMetrics.has(metric.id);
                const icon = metricIcons[metric.tipo] || "imgIconActivity1";
                return (
                  <li key={metric.id} className="routine-form-v2__item">
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleMetric(metric.id)}
                      disabled={saving}
                      label={
                        <div className="routine-form-v2__item-content">
                          <img
                            src={`/student-profile/${icon}.svg`}
                            alt=""
                            className="routine-form-v2__metric-icon"
                          />
                          <div className="routine-form-v2__item-info">
                            <strong>{metric.titulo}</strong>
                            <small>{metricLabels[metric.tipo] || metric.tipo}</small>
                          </div>
                        </div>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
          {errors.metricasIds && (
            <p className="routine-form-v2__error">{errors.metricasIds}</p>
          )}
        </div>

        {serverError && (
          <p className="workspace-dialog__error" role="alert">
            {serverError}
          </p>
        )}
      </form>

      {creatingMetric && selectedModality && (
        <MetricCreateModal
          modality={selectedModality}
          onClose={() => setCreatingMetric(false)}
          onCreated={(created) => {
            setCreatingMetric(false);
            setMetrics((prev) => [...prev, created]);
            setSelectedMetrics((prev) => new Set(prev).add(created.id));
          }}
        />
      )}
    </WorkspaceDialog>
  );
}

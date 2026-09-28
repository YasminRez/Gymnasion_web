import { useEffect, useRef, useState, type FormEvent } from "react";
import MetricCreateModal from "../MetricCreateModal/MetricCreateModal";
import { rotinaService } from "../../services/rotinaService";
import { metricaService } from "../../services/metricaService";
import { handleApiError } from "../../utils/handleApiError";
import { initials } from "../../pages/Students/studentData";
import { avatarColor } from "../../pages/Groups/groupData";
import { metricTypeLabel, WEEK_DAYS } from "../../pages/Routines/routineData";
import type { Modalidade } from "../../types/modalidade";
import type { MetricaResponseDTO } from "../../types/metric";
import type { AlunoResponse } from "../../types/student";
// Mesmo visual do modal de turma.
import "../GroupFormModal/GroupFormModal.css";
import "./RoutineFormModal.css";

type Props = {
  modalities: Modalidade[];
  suggestedModalityIds: number[];
  students: AlunoResponse[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

const NO_METRICS_MESSAGE = "Nenhuma métrica cadastrada para essa modalidade. Cadastre ao menos uma métrica antes de continuar.";

// US-10: criação de rotina de treino com métricas da modalidade.
function RoutineFormModal({ modalities, suggestedModalityIds, students, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [modalityId, setModalityId] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [goal, setGoal] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(() => new Set());
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(() => new Set());
  const [metrics, setMetrics] = useState<MetricaResponseDTO[]>([]);
  const [metricsState, setMetricsState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [creatingMetric, setCreatingMetric] = useState(false);
  const [showAllModalities, setShowAllModalities] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = previousOverflow; if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);

  // As métricas dependem da modalidade escolhida (US-18).
  useEffect(() => {
    if (modalityId === null) return;
    let cancelled = false;
    setMetricsState("loading");
    setSelectedMetrics(new Set());
    metricaService.listarPorModalidade(modalityId)
      .then((data) => { if (!cancelled) { setMetrics(data.filter((metric) => metric.ativo)); setMetricsState("loaded"); } })
      .catch((err) => { if (!cancelled) { handleApiError(err, "Não foi possível carregar as métricas."); setMetricsState("error"); } });
    return () => { cancelled = true; };
  }, [modalityId]);

  const modality = modalities.find((item) => item.id === modalityId);
  const shortList = modalities.filter((m) => suggestedModalityIds.includes(m.id) || m.id === modalityId);
  const visibleModalities = showAllModalities || shortList.length === 0 ? modalities : shortList;
  const canExpand = shortList.length > 0 && shortList.length < modalities.length;

  // Alunos da modalidade escolhida aparecem primeiro.
  const practices = (aluno: AlunoResponse) => aluno.modalidades.some((m) => m.id === modalityId);
  const studentOptions = [...students].sort((a, b) => Number(practices(b)) - Number(practices(a)) || a.usuario.nome.localeCompare(b.usuario.nome, "pt-BR"));

  const errors = {
    title: !title.trim() ? "Informe o título da rotina." : title.trim().length > 150 ? "O título deve ter no máximo 150 caracteres." : "",
    modality: modalityId === null ? "Selecione uma modalidade." : "",
    frequency: frequency === null ? "Selecione a frequência semanal." : "",
    goal: !goal.trim() ? "Informe o objetivo da rotina." : "",
    students: selectedStudents.size === 0 ? "Selecione pelo menos 1 aluno." : "",
    metrics: modalityId !== null && metricsState === "loaded" && metrics.length > 0 && selectedMetrics.size === 0 ? "Selecione pelo menos 1 métrica." : "",
  };
  const noMetrics = metricsState === "loaded" && metrics.length === 0;
  const invalid = Object.values(errors).some(Boolean) || noMetrics || metricsState !== "loaded";
  const show = (key: keyof typeof errors) => submitted && Boolean(errors[key]);

  function toggle(setter: typeof setSelectedStudents, id: string) {
    setter((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (invalid || modalityId === null || frequency === null) return;

    setSaving(true);
    try {
      await rotinaService.criar({
        titulo: title.trim(),
        modalidadeId: modalityId,
        frequenciaSemanal: frequency,
        objetivos: goal.trim(),
        alunosIds: Array.from(selectedStudents),
        metricasIds: Array.from(selectedMetrics),
      });
      onSaved("Treino criado com sucesso!");
    } catch (err) {
      handleApiError(err, "Não foi possível criar a rotina.");
    } finally {
      setSaving(false);
    }
  }

  function handleMetricCreated(metric: MetricaResponseDTO) {
    setCreatingMetric(false);
    setMetrics((previous) => [...previous, metric]);
    setSelectedMetrics((previous) => new Set(previous).add(metric.id));
  }

  return <dialog ref={dialog} className="group-form routine-form" aria-labelledby="routine-form-title" onCancel={(event) => { event.preventDefault(); if (!saving && !creatingMetric) onClose(); }}>
    <form onSubmit={handleSubmit} noValidate>
      <header className="group-form__header">
        <h2 id="routine-form-title">Nova rotina</h2>
        <button type="button" className="group-form__close" aria-label="Fechar" disabled={saving} onClick={onClose}>×</button>
      </header>

      <div className="group-form__body">
        <label className="group-form__label" htmlFor="routine-title">Título</label>
        <input id="routine-title" className="group-form__input" maxLength={150} placeholder="Ex: Hipertrofia A – Membros superiores" value={title} onChange={(event) => setTitle(event.target.value)} aria-invalid={show("title")} aria-describedby={show("title") ? "routine-title-error" : undefined} autoFocus />
        {show("title") && <p className="group-form__error" id="routine-title-error">{errors.title}</p>}

        <fieldset>
          <legend className="group-form__label">Modalidade</legend>
          <div className="group-form__chips" data-invalid={show("modality")}>
            {visibleModalities.map((item) => (
              <button key={item.id} type="button" aria-pressed={modalityId === item.id} onClick={() => setModalityId(item.id)}>{item.nome}</button>
            ))}
            {canExpand && <button type="button" className="group-form__more" onClick={() => setShowAllModalities(!showAllModalities)}>{showAllModalities ? "Menos" : "+ Outras"}</button>}
          </div>
          {show("modality") && <p className="group-form__error">{errors.modality}</p>}
        </fieldset>

        <fieldset>
          <legend className="group-form__label">Frequência semanal <span>(dias por semana)</span></legend>
          <div className="group-form__chips routine-form__days" data-invalid={show("frequency")}>
            {WEEK_DAYS.map((day) => (
              <button key={day} type="button" aria-pressed={frequency === day} aria-label={`${day} ${day === 1 ? "dia" : "dias"} por semana`} onClick={() => setFrequency(day)}>{day}x</button>
            ))}
          </div>
          {show("frequency") && <p className="group-form__error">{errors.frequency}</p>}
        </fieldset>

        <label className="group-form__label" htmlFor="routine-goal">Objetivo</label>
        <textarea id="routine-goal" className="group-form__input routine-form__goal" rows={3} placeholder="Ex: Ganho de massa magra e resistência muscular." value={goal} onChange={(event) => setGoal(event.target.value)} aria-invalid={show("goal")} aria-describedby={show("goal") ? "routine-goal-error" : undefined} />
        {show("goal") && <p className="group-form__error" id="routine-goal-error">{errors.goal}</p>}

        <fieldset>
          <legend className="group-form__label">Alunos ({selectedStudents.size} {selectedStudents.size === 1 ? "selecionado" : "selecionados"})</legend>
          <ul className="group-form__students" data-invalid={show("students")}>
            {studentOptions.map((aluno) => (
              <li key={aluno.id}>
                <label>
                  <input type="checkbox" checked={selectedStudents.has(aluno.id)} onChange={() => toggle(setSelectedStudents, aluno.id)} />
                  <span className="group-form__avatar" style={{ background: avatarColor(aluno.usuario.nome) }} aria-hidden="true">{initials(aluno.usuario.nome)}</span>
                  <span className="group-form__student">{aluno.usuario.nome}<small>{aluno.modalidades.map((m) => m.nome).join(", ") || "Geral"}</small></span>
                </label>
              </li>
            ))}
          </ul>
          {show("students") && <p className="group-form__error">{errors.students}</p>}
        </fieldset>

        <fieldset>
          <legend className="group-form__label">Métricas ({selectedMetrics.size} {selectedMetrics.size === 1 ? "selecionada" : "selecionadas"})</legend>
          {modalityId === null && <p className="group-form__empty" data-invalid={submitted}>Selecione uma modalidade para ver as métricas disponíveis.</p>}
          {metricsState === "loading" && <p className="group-form__empty">Carregando métricas...</p>}
          {metricsState === "error" && <p className="group-form__empty">Não foi possível carregar as métricas desta modalidade.</p>}
          {noMetrics && (
            <div className="group-form__empty routine-form__no-metrics" role="alert">
              <p>{NO_METRICS_MESSAGE}</p>
              <button type="button" onClick={() => setCreatingMetric(true)}>+ Cadastrar métrica</button>
            </div>
          )}
          {metricsState === "loaded" && metrics.length > 0 && <>
            <ul className="group-form__students" data-invalid={show("metrics")}>
              {metrics.map((metric) => (
                <li key={metric.id}>
                  <label>
                    <input type="checkbox" checked={selectedMetrics.has(metric.id)} onChange={() => toggle(setSelectedMetrics, metric.id)} />
                    <span className="group-form__student">{metric.titulo}<small>{metricTypeLabel[metric.tipo]}</small></span>
                  </label>
                </li>
              ))}
            </ul>
            <button type="button" className="routine-form__add-metric" onClick={() => setCreatingMetric(true)}>+ Nova métrica para {modality?.nome}</button>
          </>}
          {show("metrics") && <p className="group-form__error">{errors.metrics}</p>}
        </fieldset>
      </div>

      <footer className="group-form__actions">
        <button type="button" disabled={saving} onClick={onClose}>Cancelar</button>
        <button type="submit" className="group-form__primary" disabled={saving || noMetrics} aria-busy={saving}>{saving ? "Salvando..." : "Criar rotina"}</button>
      </footer>
    </form>
    {creatingMetric && modality && <MetricCreateModal modality={modality} onClose={() => setCreatingMetric(false)} onCreated={handleMetricCreated} />}
  </dialog>;
}

export default RoutineFormModal;

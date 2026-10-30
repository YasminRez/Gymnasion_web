import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import toast from "react-hot-toast";
import WorkspaceDialog from "../WorkspaceDialog/WorkspaceDialog";
import FormField from "../FormField/FormField";
import Button from "../Button/Button";
import Checkbox from "../Checkbox/Checkbox";
import Badge from "../Badge/Badge";
import {
  REPORT_CONTENTS,
  REPORT_METRIC_CONTENTS,
  REPORT_NO_CONTENT_MESSAGE,
  REPORT_NO_DATA_MESSAGE,
  buildReportFilter,
  defaultReportPeriod,
  formatReportDate,
  reportDates,
  reportDatesInPeriod,
  reportFileName,
  reportFullPeriod,
  reportMetricsInPeriod,
  reportMonths,
  reportPeriodError,
  reportToggleDates,
  runReport,
  type ReportAvailability,
  type ReportContent,
  type ReportFilter,
  type ReportMetricGroup,
  type ReportPeriod,
} from "../../features/report/reportModel";
import type { ReportFile } from "../../services/relatorioService";
import { downloadFile } from "../../utils/downloadFile";
import "./ReportDialog.css";

const ALL_SPORTS = "todas";

type Modalidade = { id: number; nome: string };
export type ReportStudent = { id: string; nome: string; modalidades?: Modalidade[] };
export type ReportAvailabilityState = { status: "idle" } | { status: "loading" } | { status: "error" } | { status: "ready"; data: ReportAvailability };

type Props = {
  studentName?: string;
  modalidades?: Modalidade[];
  // Aberto pelo menu do personal: o aluno é escolhido no próprio diálogo.
  students?: ReportStudent[];
  initialPeriod?: ReportPeriod;
  generate: (filter: ReportFilter, signal: AbortSignal, studentId?: string) => Promise<ReportFile>;
  loadAvailability: (signal: AbortSignal, studentId?: string) => Promise<ReportAvailability>;
  onClose: () => void;
};

// US-16: escolha do período e do conteúdo, progresso após 10 s (C2) e sugestão de período quando não há dados (C3).
export default function ReportDialog({ studentName = "", modalidades = [], students, initialPeriod, generate, loadAvailability, onClose }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>(() => initialPeriod ?? defaultReportPeriod());
  const [studentId, setStudentId] = useState(() => students?.length === 1 ? students[0].id : "");
  const [sport, setSport] = useState(ALL_SPORTS);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [noData, setNoData] = useState<{ suggested: ReportPeriod | null } | null>(null);
  const [availability, setAvailability] = useState<ReportAvailabilityState>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);
  const [excludedMetrics, setExcludedMetrics] = useState<string[]>([]);
  const [contents, setContents] = useState<ReportContent[]>(() => REPORT_CONTENTS.map(content => content.id));
  const controller = useRef<AbortController | null>(null);
  const loader = useRef(loadAvailability);
  loader.current = loadAvailability;
  const chosen = students?.find(item => item.id === studentId);
  const name = students ? chosen?.nome ?? "" : studentName;
  const available = availability.status === "ready" ? availability.data : null;
  const sports = available?.modalidades.length
    ? available.modalidades.map(item => ({ id: item.modalidadeId, nome: item.modalidade }))
    : students ? chosen?.modalidades ?? [] : modalidades;
  const modalidadeId = sports.find(item => String(item.id) === sport)?.id;
  const selection = { modalidadeId, excludedMetrics, contents };
  const groups = available ? reportMetricsInPeriod(available, modalidadeId, period) : [];
  const filter = buildReportFilter(period, selection, available);
  // Vazio apenas no menu do personal enquanto nenhum aluno foi escolhido.
  const availabilityTarget = students ? chosen?.id : "";

  useEffect(() => () => controller.current?.abort(), []);

  useEffect(() => {
    if (availabilityTarget === undefined) {
      setAvailability({ status: "idle" });
      return;
    }
    const request = new AbortController();
    setAvailability({ status: "loading" });
    loader.current(request.signal, availabilityTarget || undefined).then(
      data => { if (!request.signal.aborted) setAvailability({ status: "ready", data }); },
      () => { if (!request.signal.aborted) setAvailability({ status: "error" }); },
    );
    return () => request.abort();
  }, [availabilityTarget, attempt]);

  function close() {
    controller.current?.abort();
    onClose();
  }

  async function submit(target: ReportPeriod) {
    const targetFilter = buildReportFilter(target, selection, available);
    const invalid = students && !chosen
      ? "Selecione o aluno do relatório."
      : reportPeriodError(target) ?? (targetFilter.conteudos?.length === 0 ? REPORT_NO_CONTENT_MESSAGE : undefined);
    if (invalid) {
      setError(invalid);
      return;
    }
    const request = new AbortController();
    controller.current = request;
    setPeriod(target);
    setError("");
    setNoData(null);
    setSlow(false);
    setBusy(true);
    const outcome = await runReport(() => generate(targetFilter, request.signal, chosen?.id), () => setSlow(true), {
      set: (callback, ms) => window.setTimeout(callback, ms),
      clear: id => window.clearTimeout(id as number),
    });
    if (request.signal.aborted) return;
    setBusy(false);
    setSlow(false);
    if (outcome.kind === "success") {
      downloadFile(outcome.file.blob, reportFileName(outcome.file.contentDisposition, name, target));
      toast.success("Relatório gerado com sucesso!");
      onClose();
    } else if (outcome.kind === "no-data") {
      setNoData({ suggested: outcome.suggested });
    } else if (outcome.kind === "error") {
      setError(outcome.message);
    }
  }

  function changePeriod(next: ReportPeriod) {
    setPeriod(next);
    setError("");
  }

  // Datas marcadas à mão valem só para o aluno e a modalidade em que foram escolhidas.
  function wholeRange({ dataInicio, dataFim }: ReportPeriod): ReportPeriod {
    return { dataInicio, dataFim };
  }

  function toggleMetric(metricId: string) {
    setExcludedMetrics(current => current.includes(metricId) ? current.filter(id => id !== metricId) : [...current, metricId]);
    setError("");
  }

  function toggleAllMetrics() {
    const ids = groups.flatMap(group => group.metricas.map(metric => metric.metricaId));
    const allChecked = ids.every(id => !excludedMetrics.includes(id));
    setExcludedMetrics(current => allChecked ? [...new Set([...current, ...ids])] : current.filter(id => !ids.includes(id)));
    setError("");
  }

  function toggleContent(content: ReportContent) {
    setContents(current => current.includes(content) ? current.filter(id => id !== content) : [...current, content]);
    setError("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(period);
  }

  // A nova geração limpa noData, então o progresso e os erros dela aparecem no formulário.
  if (noData) {
    return <ReportNoDataDialog period={period} suggested={noData.suggested} onBack={() => setNoData(null)} onUseSuggested={target => void submit(target)} onClose={close} />;
  }

  return <WorkspaceDialog title="Gerar relatório" icon="/design-system/imgIconFile.svg" onClose={close} wide
    description={students ? "Escolha o aluno e o período do relatório de performance em PDF, com dados tabulados e gráficos de evolução." : `Relatório de performance de ${name} em PDF, com dados tabulados e gráficos de evolução.`}
    actions={<>
      <Button variant="secondary" onClick={close}>Cancelar</Button>
      <Button type="submit" form="report-dialog-form" loading={busy} disabled={available?.modalidades.length === 0}>Gerar relatório</Button>
    </>}>
    <form id="report-dialog-form" className="report-dialog__form" onSubmit={onSubmit} noValidate>
      {students && <FormField id="report-student" label="Aluno" value={studentId} disabled={busy} required selectPlaceholder="Selecione o aluno"
        hint={students.length ? undefined : "Nenhum aluno ativo ou inativo para gerar relatório."}
        options={students.map(item => ({ value: item.id, label: item.nome }))}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => { setStudentId(event.target.value); setSport(ALL_SPORTS); setExcludedMetrics([]); changePeriod(wholeRange(period)); }} />}
      {sports.length > 1 && <FormField id="report-sport" label="Modalidade" value={modalidadeId === undefined ? ALL_SPORTS : String(modalidadeId)} disabled={busy}
        options={[{ value: ALL_SPORTS, label: "Todas as modalidades" }, ...sports.map(m => ({ value: String(m.id), label: m.nome }))]}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => { setSport(event.target.value); changePeriod(wholeRange(period)); }} />}
      <div className="report-dialog__dates">
        <FormField id="report-start" label="Data de início" type="date" value={period.dataInicio} max={period.dataFim || undefined} disabled={busy} required
          onChange={(event: ChangeEvent<HTMLInputElement>) => changePeriod({ dataInicio: event.target.value, dataFim: period.dataFim })} />
        <FormField id="report-end" label="Data de fim" type="date" value={period.dataFim} min={period.dataInicio || undefined} disabled={busy} required
          onChange={(event: ChangeEvent<HTMLInputElement>) => changePeriod({ dataInicio: period.dataInicio, dataFim: event.target.value })} />
      </div>
      <ReportAvailabilityPanel state={availability} modalidadeId={modalidadeId} period={period} disabled={busy} onPeriod={changePeriod} onRetry={() => setAttempt(current => current + 1)} />
      {(availability.status === "error" || Boolean(available?.modalidades.length)) && <ReportContentFields groups={groups} showMetrics={Boolean(available)} excludedMetrics={excludedMetrics} contents={contents} custom={Boolean(filter.metricaIds || filter.conteudos)} disabled={busy} onToggleMetric={toggleMetric} onToggleAllMetrics={toggleAllMetrics} onToggleContent={toggleContent} />}
    </form>
    {slow && <ReportProgress />}
    {error && <p className="workspace-dialog__error" role="alert">{error}</p>}
  </WorkspaceDialog>;
}

// Mostra as datas com registros, que o usuário marca e desmarca livremente, sem testar períodos às cegas.
export function ReportAvailabilityPanel({ state, modalidadeId, period, disabled, onPeriod, onRetry }: { state: ReportAvailabilityState; modalidadeId?: number; period: ReportPeriod; disabled: boolean; onPeriod: (period: ReportPeriod) => void; onRetry: () => void }) {
  if (state.status === "idle") return null;
  if (state.status === "loading") return <p className="report-dialog__availability-note" role="status">Buscando as datas com registros...</p>;
  if (state.status === "error") {
    return <div className="report-dialog__availability-note" role="alert">
      <p>Não foi possível carregar as datas com registros.</p>
      <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>
    </div>;
  }

  const dates = reportDates(state.data, modalidadeId);
  const full = reportFullPeriod(dates);
  if (!full) return <p className="report-dialog__availability-note">Ainda não há registros de desempenho para gerar o relatório.</p>;

  const selected = new Set(reportDatesInPeriod(dates, period));
  const toggle = (target: string[]) => onPeriod(reportToggleDates(dates, period, target));
  return <section className="report-dialog__availability" aria-label="Datas com registros">
    <div className="report-dialog__availability-head">
      <div>
        <strong>Datas com registros</strong>
        <p>{selected.size} de {dates.length} {dates.length === 1 ? "data selecionada" : "datas selecionadas"}. Marque quantos meses e dias quiser; clique de novo para desmarcar.</p>
      </div>
      <div className="report-dialog__availability-actions">
        <Button variant="secondary" disabled={disabled} onClick={() => onPeriod(full)}>Marcar todas</Button>
        <Button variant="secondary" disabled={disabled || selected.size === 0} onClick={() => onPeriod({ dataInicio: period.dataInicio, dataFim: period.dataFim, datas: [] })}>Limpar</Button>
      </div>
    </div>
    {selected.size === 0 && <p className="report-dialog__warning" role="status">{period.datas ? "Nenhuma data selecionada." : "Nenhum registro no período selecionado."}</p>}
    <ul className="report-dialog__months">
      {reportMonths(dates).map(month => {
        const total = month.dates.filter(date => selected.has(date)).length;
        return <li key={month.key}>
          <button type="button" className="report-dialog__month" aria-pressed={total === month.dates.length ? true : total ? "mixed" : false} disabled={disabled} onClick={() => toggle(month.dates)}>{month.label}</button>
          <div className="report-dialog__days">
            {month.dates.map(date => <button key={date} type="button" className="report-dialog__day" aria-label={formatReportDate(date)} aria-pressed={selected.has(date)} disabled={disabled} onClick={() => toggle([date])}>{date.slice(8)}</button>)}
          </div>
        </li>;
      })}
    </ul>
  </section>;
}

export function ReportContentFields({ groups, showMetrics, excludedMetrics, contents, custom, disabled, onToggleMetric, onToggleAllMetrics, onToggleContent }: { groups: ReportMetricGroup[]; showMetrics: boolean; excludedMetrics: string[]; contents: ReportContent[]; custom: boolean; disabled: boolean; onToggleMetric: (metricId: string) => void; onToggleAllMetrics: () => void; onToggleContent: (content: ReportContent) => void }) {
  const metrics = groups.flatMap(group => group.metricas);
  const noMetricChosen = metrics.length > 0 && metrics.every(metric => excludedMetrics.includes(metric.metricaId));

  return <details className="report-dialog__custom">
    <summary>Personalizar conteúdo <span>{custom ? "Relatório personalizado" : "Relatório completo"}</span></summary>
    <fieldset disabled={disabled}>
      <legend>Dados do relatório</legend>
      <div className="report-dialog__options">
        {REPORT_CONTENTS.map(content => {
          const blocked = noMetricChosen && REPORT_METRIC_CONTENTS.includes(content.id);
          return <Checkbox key={content.id} label={content.label} checked={contents.includes(content.id) && !blocked} disabled={blocked} onChange={() => onToggleContent(content.id)} />;
        })}
      </div>
    </fieldset>
    {showMetrics && <fieldset disabled={disabled}>
      <div className="report-dialog__legend">
        <legend>Métricas do período</legend>
        {metrics.length > 1 && <button type="button" onClick={onToggleAllMetrics}>{metrics.some(metric => excludedMetrics.includes(metric.metricaId)) ? "Marcar todas" : "Desmarcar todas"}</button>}
      </div>
      {metrics.length === 0 && <p className="report-dialog__availability-note">Nenhuma métrica registrada no período selecionado.</p>}
      {groups.map(group => <div key={group.modalidadeId} className="report-dialog__metrics">
        {groups.length > 1 && <h3>{group.modalidade}</h3>}
        {group.metricas.map(metric => <div key={metric.metricaId} className="report-dialog__metric">
          <Checkbox label={metric.titulo} checked={!excludedMetrics.includes(metric.metricaId)} onChange={() => onToggleMetric(metric.metricaId)} />
          <span>{metric.descontinuada && <Badge tone="neutral">{metric.statusMetrica}</Badge>}{metric.datas.length} {metric.datas.length === 1 ? "data" : "datas"}</span>
        </div>)}
      </div>)}
      {groups.length > 1 && <p className="report-dialog__hint">Modalidades sem métrica marcada ficam fora do relatório.</p>}
    </fieldset>}
  </details>;
}

// US-16 C3: mensagem do DRS e o intervalo alternativo com registros, quando houver.
export function ReportNoDataDialog({ period, suggested, onBack, onUseSuggested, onClose }: { period: ReportPeriod; suggested: ReportPeriod | null; onBack: () => void; onUseSuggested: (period: ReportPeriod) => void; onClose: () => void }) {
  return <WorkspaceDialog title={REPORT_NO_DATA_MESSAGE} icon="/design-system/imgIconAlert.svg" tone="danger" onClose={onClose}
    description={suggested ? "Encontramos registros de desempenho em outro intervalo. Deseja gerar o relatório com ele?" : "Ainda não há registros de desempenho para gerar o relatório."}
    actions={<>
      <Button variant="secondary" onClick={onBack}>{suggested ? "Escolher outro período" : "Voltar"}</Button>
      {suggested && <Button onClick={() => onUseSuggested(suggested)}>Usar período sugerido</Button>}
    </>}>
    <div className="report-dialog__periods">
      <p><span>Período selecionado</span><strong>{formatReportDate(period.dataInicio)} a {formatReportDate(period.dataFim)}{period.datas && ` (${period.datas.length} ${period.datas.length === 1 ? "data" : "datas"})`}</strong></p>
      {suggested && <p className="report-dialog__suggested"><span>Período com registros</span><strong>{formatReportDate(suggested.dataInicio)} a {formatReportDate(suggested.dataFim)}</strong></p>}
    </div>
  </WorkspaceDialog>;
}

// US-16 C2: informa que o relatório está sendo processado.
export function ReportProgress() {
  return <div className="report-dialog__progress" role="status" aria-live="polite">
    <span className="report-dialog__bar" aria-hidden="true"><span /></span>
    <p>O relatório está sendo processado. A geração pode levar até 40 segundos, continue nesta tela.</p>
  </div>;
}

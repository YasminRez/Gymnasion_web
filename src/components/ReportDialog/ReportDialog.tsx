import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import toast from "react-hot-toast";
import WorkspaceDialog from "../WorkspaceDialog/WorkspaceDialog";
import FormField from "../FormField/FormField";
import Button from "../Button/Button";
import {
  REPORT_NO_DATA_MESSAGE,
  defaultReportPeriod,
  formatReportDate,
  reportFileName,
  reportPeriodError,
  runReport,
  type ReportFilter,
  type ReportPeriod,
} from "../../features/report/reportModel";
import type { ReportFile } from "../../services/relatorioService";
import { downloadFile } from "../../utils/downloadFile";
import "./ReportDialog.css";

const ALL_SPORTS = "todas";

type Modalidade = { id: number; nome: string };
export type ReportStudent = { id: string; nome: string; modalidades?: Modalidade[] };

type Props = {
  studentName?: string;
  modalidades?: Modalidade[];
  // Aberto pelo menu do personal: o aluno é escolhido no próprio diálogo.
  students?: ReportStudent[];
  initialPeriod?: ReportPeriod;
  generate: (filter: ReportFilter, signal: AbortSignal, studentId?: string) => Promise<ReportFile>;
  onClose: () => void;
};

// US-16: escolha do período, progresso após 10 s (C2) e sugestão de período quando não há dados (C3).
export default function ReportDialog({ studentName = "", modalidades = [], students, initialPeriod, generate, onClose }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>(() => initialPeriod ?? defaultReportPeriod());
  const [studentId, setStudentId] = useState(() => students?.length === 1 ? students[0].id : "");
  const [sport, setSport] = useState(ALL_SPORTS);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [noData, setNoData] = useState<{ suggested: ReportPeriod | null } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const chosen = students?.find(item => item.id === studentId);
  const name = students ? chosen?.nome ?? "" : studentName;
  const sports = students ? chosen?.modalidades ?? [] : modalidades;

  useEffect(() => () => controller.current?.abort(), []);

  function close() {
    controller.current?.abort();
    onClose();
  }

  async function submit(target: ReportPeriod) {
    const invalid = students && !chosen ? "Selecione o aluno do relatório." : reportPeriodError(target);
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
    const filter: ReportFilter = { ...target, modalidadeId: sport === ALL_SPORTS ? undefined : Number(sport) };
    const outcome = await runReport(() => generate(filter, request.signal, chosen?.id), () => setSlow(true), {
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

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(period);
  }

  // A nova geração limpa noData, então o progresso e os erros dela aparecem no formulário.
  if (noData) {
    return <ReportNoDataDialog period={period} suggested={noData.suggested} onBack={() => setNoData(null)} onUseSuggested={target => void submit(target)} onClose={close} />;
  }

  return <WorkspaceDialog title="Gerar relatório" icon="/design-system/imgIconFile.svg" onClose={close}
    description={students ? "Escolha o aluno e o período do relatório de performance em PDF, com dados tabulados e gráficos de evolução." : `Relatório de performance de ${name} em PDF, com dados tabulados e gráficos de evolução.`}
    actions={<>
      <Button variant="secondary" onClick={close}>Cancelar</Button>
      <Button type="submit" form="report-dialog-form" loading={busy}>Gerar relatório</Button>
    </>}>
    <form id="report-dialog-form" className="report-dialog__form" onSubmit={onSubmit} noValidate>
      {students && <FormField id="report-student" label="Aluno" value={studentId} disabled={busy} required selectPlaceholder="Selecione o aluno"
        hint={students.length ? undefined : "Nenhum aluno ativo ou inativo para gerar relatório."}
        options={students.map(item => ({ value: item.id, label: item.nome }))}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => { setStudentId(event.target.value); setSport(ALL_SPORTS); setError(""); }} />}
      <div className="report-dialog__dates">
        <FormField id="report-start" label="Data de início" type="date" value={period.dataInicio} max={period.dataFim || undefined} disabled={busy} required
          onChange={(event: ChangeEvent<HTMLInputElement>) => { setPeriod(current => ({ ...current, dataInicio: event.target.value })); setError(""); }} />
        <FormField id="report-end" label="Data de fim" type="date" value={period.dataFim} min={period.dataInicio || undefined} disabled={busy} required
          onChange={(event: ChangeEvent<HTMLInputElement>) => { setPeriod(current => ({ ...current, dataFim: event.target.value })); setError(""); }} />
      </div>
      {sports.length > 1 && <FormField id="report-sport" label="Modalidade" value={sport} disabled={busy}
        options={[{ value: ALL_SPORTS, label: "Todas as modalidades" }, ...sports.map(m => ({ value: String(m.id), label: m.nome }))]}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => setSport(event.target.value)} />}
    </form>
    {slow && <ReportProgress />}
    {error && <p className="workspace-dialog__error" role="alert">{error}</p>}
  </WorkspaceDialog>;
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
      <p><span>Período selecionado</span><strong>{formatReportDate(period.dataInicio)} a {formatReportDate(period.dataFim)}</strong></p>
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

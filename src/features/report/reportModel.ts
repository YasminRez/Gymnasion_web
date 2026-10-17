import type { ProblemDetail } from "../../types/api";

// US-16 · RNF-004: o back-end tem até 40 s; a requisição espera um pouco mais antes de desistir.
export const REPORT_TIMEOUT_MS = 60000;
// US-16 C2: indicador de progresso quando a geração passa de 10 s.
export const REPORT_SLOW_AFTER_MS = 10000;
// US-16 C3: mensagem literal do DRS (também devolvida pelo back-end).
export const REPORT_NO_DATA_MESSAGE = "Não há dados para o período selecionado";

export interface ReportPeriod {
  dataInicio: string;
  dataFim: string;
}

export interface ReportFilter extends ReportPeriod {
  modalidadeId?: number;
}

export interface ReportProblem extends ProblemDetail {
  periodoSugerido?: ReportPeriod | null;
}

export type ReportOutcome<T> =
  | { kind: "success"; file: T }
  | { kind: "no-data"; suggested: ReportPeriod | null }
  | { kind: "error"; message: string }
  | { kind: "cancelled" }
  | { kind: "silent" };

export interface ReportTimers {
  set: (callback: () => void, ms: number) => unknown;
  clear: (id: unknown) => void;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function reportDateKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function reportPeriodFromDays(days: number, today = new Date()): ReportPeriod {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
  return { dataInicio: reportDateKey(start), dataFim: reportDateKey(today) };
}

export function defaultReportPeriod(today = new Date()): ReportPeriod {
  const start = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
  return { dataInicio: reportDateKey(start), dataFim: reportDateKey(today) };
}

// Mesmas mensagens do back-end (RelatorioPerformanceService), para o usuário não depender da ida ao servidor.
export function reportPeriodError(period: Partial<ReportPeriod>): string | undefined {
  const { dataInicio, dataFim } = period;
  if (!dataInicio || !dataFim || !DATE_PATTERN.test(dataInicio) || !DATE_PATTERN.test(dataFim)) {
    return "Informe a data de início e a data de fim do período do relatório.";
  }
  if (dataInicio > dataFim) return "A data de início não pode ser posterior à data de fim.";
  return undefined;
}

export function formatReportDate(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function slug(name: string): string {
  return name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Usa o nome enviado pelo back-end; sem acesso ao header (CORS), monta o mesmo padrão localmente.
export function reportFileName(contentDisposition: string | null | undefined, studentName: string | null | undefined, period: ReportPeriod): string {
  if (contentDisposition) {
    const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(contentDisposition);
    if (encoded) {
      try {
        return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ""));
      } catch {
        // segue para o nome simples
      }
    }
    const plain = /filename\s*=\s*"?([^";]+)"?/.exec(contentDisposition);
    if (plain && !plain[1].startsWith("=?")) return plain[1].trim();
  }
  return `relatorio-performance-${slug(studentName || "aluno") || "aluno"}-${period.dataInicio}_${period.dataFim}.pdf`;
}

type BlobLike = { text: () => Promise<string> };

// Com responseType "blob", o ProblemDetail dos erros chega como Blob e precisa ser lido de volta.
export async function readReportProblem(data: unknown): Promise<ReportProblem | null> {
  if (!data) return null;
  if (typeof (data as BlobLike).text === "function") {
    try {
      const parsed: unknown = JSON.parse(await (data as BlobLike).text());
      return parsed && typeof parsed === "object" ? (parsed as ReportProblem) : null;
    } catch {
      return null;
    }
  }
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as ReportProblem;
    } catch {
      return null;
    }
  }
  return typeof data === "object" ? (data as ReportProblem) : null;
}

type RequestError = { code?: string; response?: { status?: number; data?: unknown } };

export async function reportOutcomeFromError(err: unknown): Promise<ReportOutcome<never>> {
  const error = (err ?? {}) as RequestError;
  if (error.code === "ERR_CANCELED") return { kind: "cancelled" };
  // Sessão expirada já é avisada e redirecionada pelo App.
  if (error.response?.status === 401) return { kind: "silent" };
  if (error.response?.status === 403) return { kind: "error", message: "Você não tem permissão para gerar este relatório." };
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return { kind: "error", message: "O relatório demorou mais que o esperado para ser gerado. Tente novamente ou selecione um período menor." };
    }
    return { kind: "error", message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente." };
  }

  const problem = await readReportProblem(error.response.data);
  if (problem && "periodoSugerido" in problem) {
    const suggested = problem.periodoSugerido;
    return { kind: "no-data", suggested: suggested?.dataInicio && suggested?.dataFim ? { dataInicio: suggested.dataInicio, dataFim: suggested.dataFim } : null };
  }
  if (problem?.invalidFields && Object.keys(problem.invalidFields).length) {
    return { kind: "error", message: Object.values(problem.invalidFields).join("\n") };
  }
  return { kind: "error", message: problem?.detail || problem?.title || "Não foi possível gerar o relatório. Tente novamente." };
}

// Executa a geração e avisa quando passar do limite do C2, sempre limpando o timer.
export async function runReport<T>(generate: () => Promise<T>, onSlow: () => void, timers: ReportTimers): Promise<ReportOutcome<T>> {
  const timer = timers.set(onSlow, REPORT_SLOW_AFTER_MS);
  try {
    return { kind: "success", file: await generate() };
  } catch (err) {
    return reportOutcomeFromError(err);
  } finally {
    timers.clear(timer);
  }
}

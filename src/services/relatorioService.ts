import { api } from "./api";
import { REPORT_TIMEOUT_MS, type ReportFilter } from "../features/report/reportModel";

export interface ReportFile {
  blob: Blob;
  contentDisposition?: string;
}

async function download(url: string, filter: ReportFilter, signal?: AbortSignal): Promise<ReportFile> {
  const response = await api.get<Blob>(url, {
    params: filter,
    responseType: "blob",
    timeout: REPORT_TIMEOUT_MS,
    signal,
  });
  const header = response.headers?.["content-disposition"];
  return { blob: response.data, contentDisposition: typeof header === "string" ? header : undefined };
}

// US-16: o PDF é gerado no back-end; o front só envia o período e baixa o arquivo.
export const relatorioService = {
  gerarPeloPersonal(alunoId: string, filter: ReportFilter, signal?: AbortSignal): Promise<ReportFile> {
    return download(`/api/personal-trainers/alunos/${encodeURIComponent(alunoId)}/relatorio`, filter, signal);
  },
  gerarPeloAluno(filter: ReportFilter, signal?: AbortSignal): Promise<ReportFile> {
    return download("/api/alunos/relatorio", filter, signal);
  },
};

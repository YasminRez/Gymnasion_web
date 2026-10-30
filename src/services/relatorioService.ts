import { api } from "./api";
import { REPORT_TIMEOUT_MS, type ReportAvailability, type ReportFilter } from "../features/report/reportModel";

export interface ReportFile {
  blob: Blob;
  contentDisposition?: string;
}

async function download(url: string, filter: ReportFilter, signal?: AbortSignal): Promise<ReportFile> {
  const response = await api.get<Blob>(url, {
    params: filter,
    // O Spring lê listas como metricaIds=a&metricaIds=b, sem os colchetes padrão do axios.
    paramsSerializer: { indexes: null },
    responseType: "blob",
    timeout: REPORT_TIMEOUT_MS,
    signal,
  });
  const header = response.headers?.["content-disposition"];
  return { blob: response.data, contentDisposition: typeof header === "string" ? header : undefined };
}

async function availability(url: string, signal?: AbortSignal): Promise<ReportAvailability> {
  const response = await api.get<ReportAvailability>(url, { signal });
  return response.data;
}

// US-16: o PDF é gerado no back-end; o front só envia as escolhas e baixa o arquivo.
export const relatorioService = {
  gerarPeloPersonal(alunoId: string, filter: ReportFilter, signal?: AbortSignal): Promise<ReportFile> {
    return download(`/api/personal-trainers/alunos/${encodeURIComponent(alunoId)}/relatorio`, filter, signal);
  },
  gerarPeloAluno(filter: ReportFilter, signal?: AbortSignal): Promise<ReportFile> {
    return download("/api/alunos/relatorio", filter, signal);
  },
  disponibilidadePeloPersonal(alunoId: string, signal?: AbortSignal): Promise<ReportAvailability> {
    return availability(`/api/personal-trainers/alunos/${encodeURIComponent(alunoId)}/relatorio/disponibilidade`, signal);
  },
  disponibilidadePeloAluno(signal?: AbortSignal): Promise<ReportAvailability> {
    return availability("/api/alunos/relatorio/disponibilidade", signal);
  },
};

import type { AlunoResponse } from "../../types/student";
import type { CriarRotinaPayload, ReutilizarRotinaPayload, RotinaResponse } from "../../types/rotina";
import type { TipoMetrica } from "../../types/metric";

export type RoutineFilter = "all" | "active" | "ended";

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isRoutineActive(routine: RotinaResponse): boolean {
  if (routine.status === "ENCERRADA") return false;
  if (routine.ativo === false) return false;
  return true;
}

export function routineCounts(routines: RotinaResponse[]): { all: number; active: number; ended: number } {
  let active = 0;
  let ended = 0;
  for (const item of routines) {
    if (isRoutineActive(item)) active++;
    else ended++;
  }
  return { all: routines.length, active, ended };
}

export function visibleRoutines(
  routines: RotinaResponse[],
  filter: RoutineFilter,
  search: string,
  modalityId?: number | string | null
): RotinaResponse[] {
  const query = normalize(search.trim());
  const modId = modalityId ? Number(modalityId) : null;

  return routines
    .filter((routine) => {
      // Filtro de status
      if (filter === "active" && !isRoutineActive(routine)) return false;
      if (filter === "ended" && isRoutineActive(routine)) return false;

      // Filtro de modalidade
      if (modId !== null) {
        const itemModId = routine.modalidadeId ?? routine.modalidade?.id;
        if (itemModId !== modId) return false;
      }

      // Filtro de busca (título da rotina, objetivos ou nomes dos alunos vinculados)
      if (query) {
        const titleMatch = normalize(routine.titulo).includes(query);
        const goalMatch = routine.objetivos ? normalize(routine.objetivos).includes(query) : false;
        const studentMatch = routine.alunos.some((aluno) => aluno.nome && normalize(aluno.nome).includes(query));
        const modalityMatch = normalize(routine.nomeModalidade || routine.modalidade?.nome || "").includes(query);
        if (!titleMatch && !goalMatch && !studentMatch && !modalityMatch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Ativas primeiro, depois ordem alfabética por título
      const aActive = isRoutineActive(a);
      const bActive = isRoutineActive(b);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return a.titulo.localeCompare(b.titulo, "pt-BR");
    });
}

/**
 * Alunos elegíveis para receber ou vincular a uma rotina:
 * - Devem ter status ATIVO.
 * - Não podem possuir outra rotina ATIVA simultaneamente (RN-012 / US-11).
 *   (Se currentRoutineId for fornecido, a presença do aluno na própria rotina não o desqualifica).
 */
export function eligibleStudentsForRoutine(
  students: AlunoResponse[],
  routines: RotinaResponse[],
  currentRoutineId?: string,
  modalityId?: number | string | null
): AlunoResponse[] {
  const activeStudentIdsWithOtherRoutine = new Set<string>();

  for (const routine of routines) {
    if (routine.id === currentRoutineId) continue;
    if (isRoutineActive(routine)) {
      for (const aluno of routine.alunos) {
        activeStudentIdsWithOtherRoutine.add(aluno.id);
      }
    }
  }

  const modId = modalityId ? Number(modalityId) : null;

  return students.filter((student) => {
    if (student.status !== "ATIVO") return false;
    if (activeStudentIdsWithOtherRoutine.has(student.id)) return false;
    if (modId !== null && Array.isArray(student.modalidades)) {
      const enrolled = student.modalidades.some((m) => m.id === modId);
      if (!enrolled) return false;
    }
    return true;
  });
}

export function validateCreateRoutinePayload(payload: Partial<CriarRotinaPayload>): Record<string, string> {
  const errors: Record<string, string> = {};

  const title = (payload.titulo || "").trim();
  if (!title) {
    errors.titulo = "Campo obrigatório.";
  } else if (title.length < 3) {
    errors.titulo = "O título deve ter no mínimo 3 caracteres.";
  } else if (title.length > 150) {
    errors.titulo = "O título deve ter no máximo 150 caracteres.";
  }

  if (!payload.modalidadeId) {
    errors.modalidadeId = "Selecione uma modalidade.";
  }

  const freq = payload.frequenciaSemanal;
  if (typeof freq !== "number" || freq < 1 || freq > 7) {
    errors.frequenciaSemanal = "A frequência semanal deve estar entre 1 e 7 dias.";
  }

  const objetivos = (payload.objetivos || "").trim();
  if (!objetivos) {
    errors.objetivos = "Campo obrigatório.";
  } else if (objetivos.length < 10) {
    errors.objetivos = "O objetivo deve ter no mínimo 10 caracteres.";
  }

  if (!payload.alunosIds || payload.alunosIds.length === 0) {
    errors.alunosIds = "É necessário selecionar ao menos um aluno.";
  }

  if (!payload.metricasIds || payload.metricasIds.length === 0) {
    errors.metricasIds = "Selecione ao menos 1 métrica para a rotina.";
  }

  return errors;
}

export function validateReuseRoutinePayload(payload: Partial<ReutilizarRotinaPayload>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!payload.alunoId) {
    errors.alunoId = "Selecione o aluno que receberá a rotina.";
  }

  const date = (payload.dataInicio || "").trim();
  if (!date) {
    errors.dataInicio = "Informe a data de início da nova rotina.";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.dataInicio = "Data de início inválida. Use o formato AAAA-MM-DD.";
  }

  const title = (payload.titulo || "").trim();
  if (!title) {
    errors.titulo = "Informe o título da nova rotina.";
  } else if (title.length > 150) {
    errors.titulo = "O título deve ter no máximo 150 caracteres.";
  }

  const goal = (payload.objetivos || "").trim();
  if (!goal) {
    errors.objetivos = "Informe os objetivos do treinamento.";
  }

  return errors;
}

export const metricLabels: Record<TipoMetrica, string> = {
  NUMERICO: "Numérico / Repetições",
  TEMPO: "Tempo / Cronômetro",
  TEMPO_CRONOMETRO: "Tempo / Cronômetro",
  FREQUENCIA_CARDIACA: "Frequência cardíaca",
  TEXTO: "Texto / Observação",
  TEXTO_OBSERVACAO: "Texto / Observação",
};

export const metricIcons: Record<TipoMetrica, string> = {
  NUMERICO: "imgIconHash",
  TEMPO: "imgIconClock",
  TEMPO_CRONOMETRO: "imgIconClock",
  FREQUENCIA_CARDIACA: "imgIconHeart",
  TEXTO: "imgIconText",
  TEXTO_OBSERVACAO: "imgIconText",
};

export const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export function getStudentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AVATAR_COLORS = [
  { bg: "#d1e9ff", text: "#175cd3" }, // Blue
  { bg: "#ece9fe", text: "#5925dc" }, // Purple
  { bg: "#d1fadf", text: "#027a48" }, // Green
  { bg: "#ffeed4", text: "#c2410c" }, // Orange
  { bg: "#cffafe", text: "#0e7490" }, // Cyan
];

export function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function getModalityBadgeStyle(nome: string): { bg: string; color: string; icon: string } {
  const lower = normalize(nome || "");
  if (lower.includes("natacao") || lower.includes("natação")) {
    return { bg: "#eff8ff", color: "#175cd3", icon: "/design-system/imgIconWaves.svg" };
  }
  if (lower.includes("tenis") || lower.includes("tênis")) {
    return { bg: "#f4fce3", color: "#598b00", icon: "/design-system/imgIconTennis.svg" };
  }
  if (lower.includes("academia") || lower.includes("musculacao") || lower.includes("musculação")) {
    return { bg: "#f4f3ff", color: "#5925dc", icon: "/design-system/imgIconDumbbell.svg" };
  }
  return { bg: "#f2f4f7", color: "#344054", icon: "/design-system/imgIconGrid.svg" };
}

export function routineModalityCounts(
  routines: RotinaResponse[],
  modalities: { id: number; nome: string }[],
  options?: { includeZero?: boolean; activeModalityId?: number | null }
): { id: number | null; nome: string; count: number }[] {
  const result: { id: number | null; nome: string; count: number }[] = [
    { id: null, nome: "Todas", count: routines.length },
  ];

  for (const mod of modalities) {
    const count = routines.filter((r) => {
      const rId = r.modalidadeId ?? r.modalidade?.id;
      return rId === mod.id;
    }).length;

    // Apenas exibe esportes que possuam rotinas cadastradas (count > 0)
    // ou se o esporte for o filtro atualmente selecionado na URL
    if (
      options?.includeZero ||
      count > 0 ||
      (options?.activeModalityId != null && options.activeModalityId === mod.id)
    ) {
      result.push({ id: mod.id, nome: mod.nome, count });
    }
  }

  return result;
}

export function eligibleGroupsForRoutine<T extends { modalidadeId: number; nome?: string }>(
  groups: T[],
  routine: RotinaResponse
): T[] {
  const routineModalityId = routine.modalidadeId ?? routine.modalidade?.id;
  if (routineModalityId == null) return [];
  return groups.filter((group) => group.modalidadeId === routineModalityId);
}

export function extractProblemDetail(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { detail?: string; mensagem?: string; message?: string } } })
    ?.response?.data;
  if (data?.detail && typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }
  if (data?.mensagem && typeof data.mensagem === "string" && data.mensagem.trim()) {
    return data.mensagem;
  }
  if (data?.message && typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }
  return fallback;
}


import type { PersonalNotification } from "../../types/personalDashboard";

export type NotificationCategory =
  | "pendencia"
  | "aluno"
  | "treino"
  | "feedback"
  | "strava"
  | "geral";

export type NotificationFilter = "all" | "unread" | "pendencia" | "treino" | "feedback";

export interface NotificationCategoryMeta {
  category: NotificationCategory;
  label: string;
  tone: "warning" | "primary" | "success" | "info" | "neutral";
  urgencyWeight: number;
}

type RawNotification = Partial<PersonalNotification> & {
  dataHora?: string;
  alunoId?: string | null;
  alunoNome?: string | null;
};

/**
 * Normalizes a notification payload from either Personal or Student endpoints,
 * handling `dataCriacao` vs `dataHora` and `referenciaId` vs `alunoId`.
 */
export function normalizeNotification(raw: RawNotification): PersonalNotification {
  const tipo = String(raw.tipo || "GERAL").toUpperCase();
  const dataCriacao = raw.dataCriacao || raw.dataHora || "";
  const referenciaId = raw.referenciaId ?? raw.alunoId ?? null;

  let titulo = (raw.titulo || "").trim();
  if (!titulo) {
    if (tipo.includes("PENDENCIA") || tipo.includes("METRICA")) {
      titulo = raw.alunoNome
        ? `Pendências de Métricas - ${raw.alunoNome}`
        : "Pendências de Métricas";
    } else if (tipo.includes("TREINO") || tipo.includes("SESSAO")) {
      titulo = raw.alunoNome ? `Treino concluído - ${raw.alunoNome}` : "Treino concluído";
    } else if (tipo.includes("FEEDBACK") || tipo.includes("OBSERVACAO")) {
      titulo = raw.alunoNome ? `Feedback - ${raw.alunoNome}` : "Novo feedback";
    } else if (tipo.includes("CADASTRO") || tipo.includes("ALUNO")) {
      titulo = raw.alunoNome ? `Novo aluno - ${raw.alunoNome}` : "Solicitação de aluno";
    } else {
      titulo = "Notificação";
    }
  }

  return {
    id: String(raw.id || ""),
    titulo,
    mensagem: String(raw.mensagem || ""),
    tipo,
    lida: Boolean(raw.lida),
    referenciaId,
    dataCriacao,
  };
}

/**
 * Infers semantic category, human-readable badge label, visual tone,
 * and urgency weight (lower number = higher operational priority).
 */
export function getNotificationCategoryMeta(
  item: Pick<PersonalNotification, "tipo" | "titulo" | "mensagem">
): NotificationCategoryMeta {
  const combined = `${item.tipo || ""} ${item.titulo || ""} ${item.mensagem || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (
    combined.includes("pendencia") ||
    combined.includes("metrica") ||
    combined.includes("pendente")
  ) {
    return {
      category: "pendencia",
      label: "Pendência",
      tone: "warning",
      urgencyWeight: 1,
    };
  }

  if (
    combined.includes("cadastro") ||
    combined.includes("novo aluno") ||
    combined.includes("solicitou") ||
    combined.includes("aprovacao")
  ) {
    return {
      category: "aluno",
      label: "Aluno",
      tone: "primary",
      urgencyWeight: 2,
    };
  }

  if (
    combined.includes("treino") ||
    combined.includes("sessao") ||
    combined.includes("concluiu") ||
    combined.includes("execucao")
  ) {
    return {
      category: "treino",
      label: "Treino",
      tone: "success",
      urgencyWeight: 3,
    };
  }

  if (
    combined.includes("feedback") ||
    combined.includes("observacao") ||
    combined.includes("nota") ||
    combined.includes("mensagem")
  ) {
    return {
      category: "feedback",
      label: "Feedback",
      tone: "info",
      urgencyWeight: 4,
    };
  }

  if (combined.includes("strava")) {
    return {
      category: "strava",
      label: "Strava",
      tone: "primary",
      urgencyWeight: 5,
    };
  }

  return {
    category: "geral",
    label: "Aviso",
    tone: "neutral",
    urgencyWeight: 6,
  };
}

export function parseNotificationTimestamp(isoString?: string): number {
  if (!isoString) return 0;
  const parsed = new Date(isoString).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Sorts notifications following modern SaaS & Coaching platform standards:
 * 1. Unread notifications (`!lida`) ALWAYS come before read notifications (`lida`).
 * 2. Within the same read state, newer notifications come first (`dataCriacao` descending).
 * 3. When timestamps are within the same minute (or identical/missing), higher operational
 *    urgency (`pendencia` > `aluno` > `treino` > `feedback`) takes precedence.
 */
export function sortNotificationsByPriority(
  notifications: PersonalNotification[]
): PersonalNotification[] {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  return notifications.map((item) => normalizeNotification(item)).sort((a, b) => {
    const aRead = Boolean(a.lida);
    const bRead = Boolean(b.lida);

    // 1. Unread always first
    if (aRead !== bRead) {
      return aRead ? 1 : -1;
    }

    // 2. Compare timestamps (newest first)
    const timeA = parseNotificationTimestamp(a.dataCriacao);
    const timeB = parseNotificationTimestamp(b.dataCriacao);
    const timeDiff = timeB - timeA;

    // If timestamps differ by more than 60 seconds, respect strict chronological order
    if (Math.abs(timeDiff) > 60_000) {
      return timeDiff;
    }

    // 3. Within the same minute (or equal timestamps), prioritize by operational urgency
    const urgencyA = getNotificationCategoryMeta(a).urgencyWeight;
    const urgencyB = getNotificationCategoryMeta(b).urgencyWeight;
    if (urgencyA !== urgencyB) {
      return urgencyA - urgencyB;
    }

    return timeDiff;
  });
}

export function splitNotificationsByReadState(notifications: PersonalNotification[]): {
  sorted: PersonalNotification[];
  unread: PersonalNotification[];
  read: PersonalNotification[];
  unreadCount: number;
} {
  const sorted = sortNotificationsByPriority(notifications);
  const unread = sorted.filter((item) => !item.lida);
  const read = sorted.filter((item) => Boolean(item.lida));

  return {
    sorted,
    unread,
    read,
    unreadCount: unread.length,
  };
}

export function filterNotifications(
  notifications: PersonalNotification[],
  filter: NotificationFilter
): PersonalNotification[] {
  const sorted = sortNotificationsByPriority(notifications);

  if (filter === "all") {
    return sorted;
  }
  if (filter === "unread") {
    return sorted.filter((item) => !item.lida);
  }

  return sorted.filter((item) => getNotificationCategoryMeta(item).category === filter);
}

export function formatNotificationTime(isoString?: string, now: Date = new Date()): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  const diffMs = now.getTime() - date.getTime();
  // Guard against minor server/client clock skew
  if (diffMs < 0 && Math.abs(diffMs) <= 120_000) {
    return "Agora mesmo";
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec >= 0 && diffSec < 60) {
    return "Agora mesmo";
  }
  if (diffMin >= 1 && diffMin < 60) {
    return `Há ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
  }
  if (
    diffHours >= 0 &&
    diffHours < 24 &&
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `Hoje às ${hours}:${mins}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `Ontem às ${hours}:${mins}`;
  }
  if (diffDays >= 1 && diffDays < 7) {
    return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

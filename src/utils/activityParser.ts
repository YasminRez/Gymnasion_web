export interface ActivityItem {
  id: string;
  title: string;
  description: string;
}

export interface ParsedSessionActivities {
  sessionName: string;
  activities: ActivityItem[];
  orientations: string;
}

export interface SessionCardPreview {
  headline: string;
  blocks: ActivityItem[];
  orientations: string;
}

/**
 * Converte o texto bruto de `atividades` da sessão em estrutura com nome da sessão,
 * blocos de atividades (com suporte a múltiplas linhas por bloco) e orientações gerais.
 */
export function parseAtividades(raw?: string | null): ParsedSessionActivities {
  if (!raw || !raw.trim()) {
    return { sessionName: "", activities: [], orientations: "" };
  }

  let normalized = raw.replace(/\r\n/g, "\n");
  let extractedSessionName = "";
  const sessaoTagMatch = normalized.match(/\[SESSAO:\s*([^\]]*)\]/i);
  if (sessaoTagMatch) {
    extractedSessionName = sessaoTagMatch[1]?.trim() || "";
    normalized = normalized.replace(sessaoTagMatch[0], "\n");
  }
  normalized = normalized
    .replace(/\[ATIVIDADES\]/gi, "\n")
    .replace(/\[ORIENTACOES\]/gi, "\nOrientações: ");

  const rawLines = normalized
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (rawLines.length === 0) {
    return { sessionName: extractedSessionName, activities: [], orientations: "" };
  }

  let sessionName = extractedSessionName;
  let orientations = "";
  const activities: ActivityItem[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const isIndentedContinuation = /^(?: {2,}|\t+)/.test(rawLine);
    const line = rawLine.trim();

    // Bloco de orientações (captura até o final preservando quebras de linha)
    const orientationsMatch = line.match(/^orienta[cç][oõ]es?:\s*(.*)$/i);
    if (orientationsMatch && !isIndentedContinuation) {
      const firstLine = orientationsMatch[1]?.trim() || "";
      const restLines: string[] = [];
      for (let j = i + 1; j < rawLines.length; j++) {
        restLines.push(rawLines[j].trim());
      }
      orientations = [firstLine, ...restLines].filter(Boolean).join("\n");
      break;
    }

    // Nome explícito da sessão
    const sessionNameMatch = line.match(/^(?:nome da sess[aã]o|sess[aã]o|t[ií]tulo):\s*(.*)$/i);
    if (sessionNameMatch && !isIndentedContinuation) {
      if (!sessionName) {
        sessionName = sessionNameMatch[1]?.trim() || "";
      }
      continue;
    }

    // Se a linha é indentada (2+ espaços) ou começa com marcador de tópico (•, -, *)
    // e já existe um bloco de atividade aberto, anexa como nova linha na descrição do bloco atual
    const isBulletLine = /^[•\-*▸▹]\s+/.test(line);
    if ((isIndentedContinuation || isBulletLine) && activities.length > 0) {
      const current = activities[activities.length - 1];
      current.description = current.description
        ? `${current.description}\n${line}`
        : line;
      continue;
    }

    // Primeira linha como título da sessão se não tiver delimitador e houver mais linhas
    if (
      !sessionName &&
      i === 0 &&
      rawLines.length > 1 &&
      !line.includes(":") &&
      !line.includes("·") &&
      !line.includes("—") &&
      !/^\d+[.)]\s/.test(line)
    ) {
      sessionName = line;
      continue;
    }

    const cleanedLine = line.replace(/^\d+[.)]\s*/, "").trim();
    if (!cleanedLine) continue;

    let title = "";
    let description = "";

    if (cleanedLine.includes(":")) {
      const colonIdx = cleanedLine.indexOf(":");
      title = cleanedLine.substring(0, colonIdx).trim() || `Atividade ${activities.length + 1}`;
      description = cleanedLine.substring(colonIdx + 1).trim();
    } else if (cleanedLine.includes("·")) {
      const parts = cleanedLine.split("·");
      title = parts[0]?.trim() || `Atividade ${activities.length + 1}`;
      description = parts.slice(1).join("·").trim();
    } else if (cleanedLine.includes("—")) {
      const parts = cleanedLine.split("—");
      title = parts[0]?.trim() || `Atividade ${activities.length + 1}`;
      description = parts.slice(1).join("—").trim();
    } else {
      title = cleanedLine;
      description = "";
    }

    activities.push({
      id: `act-${activities.length + 1}`,
      title,
      description,
    });
  }

  return {
    sessionName,
    activities,
    orientations,
  };
}

/**
 * Gera uma visualização estruturada para cards de sessão sem duplicar
 * o título e a descrição quando a sessão possui apenas uma linha longa.
 */
export function buildSessionCardPreview(
  atividades?: string | null,
  fallbackIndex?: number
): SessionCardPreview {
  const parsed = parseAtividades(atividades);
  const defaultTitle = fallbackIndex ? `Sessão ${fallbackIndex}` : "Sessão planejada";

  if (parsed.sessionName) {
    return {
      headline: parsed.sessionName,
      blocks: parsed.activities,
      orientations: parsed.orientations,
    };
  }

  if (parsed.activities.length === 0) {
    return {
      headline: defaultTitle,
      blocks: [],
      orientations: parsed.orientations,
    };
  }

  // Caso clássico de sessão salva sem `sessionName` explícito:
  // Se houver apenas 1 atividade sem descrição separada (texto único longo),
  // extraímos um título curto e colocamos o detalhamento completo no bloco sem repetir ambos.
  if (parsed.activities.length === 1 && !parsed.activities[0].description) {
    const rawText = parsed.activities[0].title.trim();
    if (rawText.length <= 42) {
      return {
        headline: rawText,
        blocks: [],
        orientations: parsed.orientations,
      };
    }

    // Tenta extrair o foco inicial antes de "+" ou "(" ou "·" para um título enxuto
    const plusSplit = rawText.split(/\s+\+\s+|\s*\(/)[0]?.trim();
    const shortHeadline =
      plusSplit && plusSplit.length >= 6 && plusSplit.length <= 48
        ? plusSplit
        : defaultTitle;

    return {
      headline: shortHeadline,
      blocks: [
        {
          id: "act-1",
          title: " prescrição",
          description: rawText,
        },
      ],
      orientations: parsed.orientations,
    };
  }

  // Quando há blocos estruturados (com título + descrição), mas sem `sessionName`:
  // cria um título-resumo combinando os títulos dos blocos (sem repetir as descrições no título).
  const blockTitles = parsed.activities
    .map((a) => a.title.trim())
    .filter((t) => t.length > 0 && t.length <= 36);

  const summaryHeadline =
    blockTitles.length > 0
      ? blockTitles.slice(0, 2).join(" + ") +
        (blockTitles.length > 2 ? ` (+${blockTitles.length - 2})` : "")
      : defaultTitle;

  return {
    headline: summaryHeadline,
    blocks: parsed.activities,
    orientations: parsed.orientations,
  };
}

/**
 * Serializa nome da sessão, blocos de atividades (preservando múltiplas linhas
 * com indentação de 2 espaços) e orientações para armazenamento no backend.
 */
export function serializeAtividades(params: {
  sessionName?: string;
  activities: { title: string; description?: string }[];
  orientations?: string;
}): string {
  const parts: string[] = [];

  const name = params.sessionName?.trim();
  if (name) {
    // Se o nome da sessão contiver dois-pontos ou não houver blocos de atividade,
    // prefixamos com "Sessão: " para não ser confundido com bloco de atividade
    if (name.includes(":") || name.includes("·") || params.activities.length === 0) {
      parts.push(`Sessão: ${name}`);
    } else {
      parts.push(name);
    }
  }

  for (const act of params.activities) {
    const t = act.title.trim();
    const d = act.description?.trim();
    if (!t) continue;

    if (!d) {
      parts.push(t);
      continue;
    }

    const descLines = d
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (descLines.length === 0) {
      parts.push(t);
    } else if (descLines.length === 1) {
      parts.push(`${t}: ${descLines[0]}`);
    } else {
      parts.push(`${t}: ${descLines[0]}`);
      for (let i = 1; i < descLines.length; i++) {
        parts.push(`  ${descLines[i]}`);
      }
    }
  }

  const ori = params.orientations?.trim();
  if (ori) {
    parts.push(`Orientações: ${ori}`);
  }

  return parts.join("\n");
}

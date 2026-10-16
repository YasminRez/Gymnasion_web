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

/**
 * Converte o texto bruto de `atividades` da sessão em estrutura com nome da sessão,
 * blocos de atividades e orientações gerais sem valores estáticos/hardcode.
 */
export function parseAtividades(raw?: string | null): ParsedSessionActivities {
  if (!raw || !raw.trim()) {
    return { sessionName: "", activities: [], orientations: "" };
  }

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { sessionName: "", activities: [], orientations: "" };
  }

  let sessionName = "";
  let orientations = "";
  const activityLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bloco de orientações
    const orientationsMatch = line.match(/^orienta[cç][oõ]es?:\s*(.*)$/i);
    if (orientationsMatch) {
      orientations = orientationsMatch[1]?.trim() || "";
      for (let j = i + 1; j < lines.length; j++) {
        orientations += (orientations ? " " : "") + lines[j].trim();
      }
      break;
    }

    // Nome explícito da sessão
    const sessionNameMatch = line.match(/^(?:nome da sess[aã]o|sess[aã]o|t[ií]tulo):\s*(.*)$/i);
    if (sessionNameMatch) {
      sessionName = sessionNameMatch[1]?.trim() || "";
      continue;
    }

    // Primeira linha como título da sessão se não tiver delimitador e houver mais linhas
    if (i === 0 && lines.length > 1 && !line.includes(":") && !line.includes("·")) {
      sessionName = line;
      continue;
    }

    activityLines.push(line);
  }

  const activities: ActivityItem[] = activityLines.map((line, idx) => {
    let title = "";
    let description = "";

    if (line.includes("·")) {
      const parts = line.split("·");
      title = parts[0]?.trim() || `Atividade ${idx + 1}`;
      description = parts.slice(1).join("·").trim();
    } else if (line.includes(":")) {
      const colonIdx = line.indexOf(":");
      title = line.substring(0, colonIdx).trim() || `Atividade ${idx + 1}`;
      description = line.substring(colonIdx + 1).trim();
    } else {
      title = line;
      description = "";
    }

    return {
      id: `act-${idx + 1}`,
      title,
      description,
    };
  });

  return {
    sessionName,
    activities,
    orientations,
  };
}

/**
 * Serializa nome da sessão, blocos de atividades e orientações para armazenamento no backend.
 */
export function serializeAtividades(params: {
  sessionName?: string;
  activities: { title: string; description?: string }[];
  orientations?: string;
}): string {
  const parts: string[] = [];

  const name = params.sessionName?.trim();
  if (name) {
    parts.push(name);
  }

  for (const act of params.activities) {
    const t = act.title.trim();
    const d = act.description?.trim();
    if (t) {
      parts.push(d ? `${t}: ${d}` : t);
    }
  }

  const ori = params.orientations?.trim();
  if (ori) {
    parts.push(`Orientações: ${ori}`);
  }

  return parts.join("\n");
}

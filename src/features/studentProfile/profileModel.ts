import type { TrainingSession } from "../../types/personalDashboard";
import type { RotinaResponse } from "../../types/rotina";
import type { TipoMetrica } from "../../types/metric";
import type { StudentTracking } from "../../types/studentProfile";
import { localDateKey } from "../personal/dashboardModel";

export type RoutineMetric = RotinaResponse["metricas"][number];
export type MetricSeries = { id: string; title: string; type: TipoMetrica | "RPE"; points: { date: string; value: number }[] };
export const metricLabels: Record<TipoMetrica, string> = {
  TEMPO: "Tempo",
  TEMPO_CRONOMETRO: "Tempo",
  NUMERICO: "Numérico",
  FREQUENCIA_CARDIACA: "Freq. cardíaca",
  TEXTO: "Texto",
  TEXTO_OBSERVACAO: "Texto",
};
export const metricIcons: Record<TipoMetrica, string> = {
  TEMPO: "imgIconClock",
  TEMPO_CRONOMETRO: "imgIconClock",
  NUMERICO: "imgIconHash",
  FREQUENCIA_CARDIACA: "imgIconHeart",
  TEXTO: "imgIconText",
  TEXTO_OBSERVACAO: "imgIconText",
};

export function metricError(type: TipoMetrica, value: string): string | undefined {
  const text = value.trim();
  if (!text) return;
  if (text.length > 255) return "Use até 255 caracteres.";
  if (type === "TEMPO" && !/^\d+:[0-5]\d$/.test(text)) return "Use minutos e segundos, por exemplo 01:42.";
  if (type === "NUMERICO" && (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text) || !Number.isFinite(Number(text.replace(",", "."))))) return "Informe um valor numérico.";
  if (type === "FREQUENCIA_CARDIACA" && (!/^\d+$/.test(text) || Number(text) < 30 || Number(text) > 250)) return "Informe um número inteiro entre 30 e 250 bpm.";
}
export function serializeMetric(metric: RoutineMetric, value: string) {
  const text = value.trim();
  if (metric.tipo === "TEMPO") { const [minutes, seconds] = text.split(":"); return minutes.padStart(2, "0") + ":" + seconds; }
  return metric.tipo === "NUMERICO" ? text.replace(",", ".") : text;
}
export function sessionCandidates(tracking: StudentTracking | null, studentId: string) {
  return (tracking?.sessoes || []).filter(item => item.status === "PLANEJADA" && (!item.desempenho?.alunoId || item.desempenho.alunoId === studentId));
}
export function ownHistory(sessions: TrainingSession[], studentId: string) {
  return [...new Map(sessions.filter(item => item.status === "CONCLUIDA" && item.dataReal && item.desempenho?.alunoId === studentId).map(item => [item.id, item])).values()]
    .sort((a,b) => b.dataReal!.localeCompare(a.dataReal!));
}
export function metricNumber(type: string, value: string): number | null {
  if (type === "TEXTO" || !value.trim()) return null;
  if (type === "TEMPO") { if (!/^\d+:[0-5]\d$/.test(value)) return null; const [m,s] = value.split(":").map(Number); return m*60+s; }
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}
export function formatMetric(value: number, type: string) {
  if (type === "TEMPO") { const total = Math.round(value); return `${Math.floor(total/60)}:${String(total%60).padStart(2,"0")}`; }
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
}
export function evolutionSeries(sessions: TrainingSession[], metrics: RoutineMetric[], from: string, to: string): MetricSeries[] {
  const definitions = new Map(metrics.filter(m=>m.tipo!=="TEXTO").map(m=>[m.id,{id:m.id,title:m.titulo,type:m.tipo}]));
  sessions.forEach(s=>s.desempenho?.metricas.forEach(m=>{ if(m.tipoMetrica!=="TEXTO" && !definitions.has(m.metricaId)) definitions.set(m.metricaId,{id:m.metricaId,title:m.tituloMetrica,type:m.tipoMetrica as TipoMetrica}); }));
  const all: Omit<MetricSeries,"points">[] = [...definitions.values(),{id:"rpe",title:"Nível de esforço (RPE)",type:"RPE"}];
  return all.map(metric=>({ ...metric, points:sessions.filter(s=>s.dataReal && s.dataReal>=from && s.dataReal<=to).flatMap(session=>{
    const entry = session.desempenho?.metricas.find(m=>m.metricaId===metric.id);
    const value = metric.id==="rpe" ? session.desempenho?.nivelCansaco : entry ? metricNumber(entry.tipoMetrica,entry.valor) : null;
    return typeof value === "number" && Number.isFinite(value) ? [{date:session.dataReal!,value}] : [];
  }).sort((a,b)=>a.date.localeCompare(b.date)) }));
}
export function weekDays(tracking: StudentTracking | null, studentId: string, now = new Date()) {
  const monday = new Date(now.getFullYear(),now.getMonth(),now.getDate()); monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
  return Array.from({length:7},(_,i)=>{
    const day = new Date(monday); day.setDate(day.getDate()+i); const date=localDateKey(day);
    const sessions=(tracking?.sessoes||[]).filter(s=>(s.dataReal||s.dataPlanejada)===date && s.status!=="CANCELADA" && (!s.desempenho?.alunoId || s.desempenho.alunoId===studentId));
    return {date,label:["S","T","Q","Q","S","S","D"][i],completed:sessions.filter(s=>s.status==="CONCLUIDA").length,planned:sessions.length,today:date===localDateKey(now)};
  });
}

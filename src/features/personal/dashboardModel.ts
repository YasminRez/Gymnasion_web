import type { StudentHistory, TrainingSession } from "../../types/personalDashboard";

export function localDateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
}
export function completedSessions(histories: StudentHistory[]) {
  return [...new Map(histories.flatMap(item => item.sessions).filter(item => item.status === "CONCLUIDA" && item.dataReal).map(item => [item.id,item])).values()];
}
export function lastSession(histories: StudentHistory[], alunoId: string, activeRoutineIds?: string[]): TrainingSession | undefined {
  const list = histories.find(item => item.alunoId === alunoId)?.sessions.filter(item => item.status === "CONCLUIDA" && item.dataReal) || [];
  const filtered = activeRoutineIds ? list.filter(item => activeRoutineIds.includes(item.rotinaTreinoId)) : list;
  return filtered.sort((a,b) => b.dataReal!.localeCompare(a.dataReal!))[0];
}
export function weeklySessions(histories: StudentHistory[], now = new Date()) {
  const start = new Date(now.getFullYear(),now.getMonth(),now.getDate());
  start.setDate(start.getDate() - (start.getDay()+6)%7);
  const from = localDateKey(start), to = localDateKey(now);
  return completedSessions(histories).filter(item => item.dataReal! >= from && item.dataReal! <= to).length;
}
export function rpeSeries(histories: StudentHistory[], days: number, now = new Date()) {
  const start = new Date(now.getFullYear(),now.getMonth(),now.getDate());
  start.setDate(start.getDate()-days+1);
  const from = localDateKey(start), to = localDateKey(now);
  const values = new Map<string,number[]>();
  completedSessions(histories).forEach(item => {
    const rpe = item.desempenho?.nivelCansaco;
    if (item.dataReal! < from || item.dataReal! > to || typeof rpe !== "number" || rpe < 0 || rpe > 10) return;
    values.set(item.dataReal!, [...(values.get(item.dataReal!) || []),rpe]);
  });
  return [...values].sort(([a],[b])=>a.localeCompare(b)).map(([date,items])=>({date,value:items.reduce((a,b)=>a+b,0)/items.length,count:items.length}));
}
export function displayDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(date+"T12:00:00"));
}

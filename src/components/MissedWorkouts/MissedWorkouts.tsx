import { useState } from "react";
import toast from "react-hot-toast";
import MissedWorkoutRow from "../MissedWorkoutRow/MissedWorkoutRow";
import { missedWorkoutsData } from "./missedWorkoutsData";
import "./MissedWorkouts.css";
type Period = "today" | "yesterday" | "week";
function MissedWorkouts() {
  const [period, setPeriod] = useState<Period>("today");
  const [notifiedIds, setNotifiedIds] = useState<number[]>([]);
  // Ontem: alunos cuja sequência de faltas começou antes de hoje.
  const students = missedWorkoutsData.filter((student) => period !== "yesterday" || student.days > 1);
  const overdue = students.filter((student) => student.days > 1).length;
  const remaining = students.filter((student) => !notifiedIds.includes(student.id));
  function notify(ids: number[]) {
    if (!ids.length) return;
    setNotifiedIds((previous) => [...new Set([...previous, ...ids])]);
    toast(`Demonstração: lembrete simulado para ${ids.length} ${ids.length === 1 ? "aluno" : "alunos"}. Nenhuma mensagem foi enviada.`, { icon: "ⓘ" });
  }
  return <section className="missed-workouts" aria-labelledby="missed-workouts-greeting">
    <h1 id="missed-workouts-greeting">Olá, @personal</h1>
    <section className="missed-workouts__panel" aria-labelledby="missed-workouts-title">
      <h2 id="missed-workouts-title">Alunos que não concluíram o treino</h2>
      <div className="missed-workouts__filters" role="group" aria-label="Período dos treinos não concluídos">
        {([["today", "Hoje"], ["yesterday", "Ontem"], ["week", "Últimos 7 dias"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>)}
      </div>
      <div className="missed-workouts__scroll" role="region" tabIndex={0} aria-label="Alunos com treinos não concluídos">
        <table><thead><tr><th scope="col">Aluno</th><th scope="col">Modalidade</th><th scope="col">Treino</th><th scope="col">Dias sem treino</th><th scope="col">Ação</th></tr></thead><tbody>{students.map((student) => <MissedWorkoutRow key={student.id} student={student} notified={notifiedIds.includes(student.id)} onNotify={() => notify([student.id])} />)}</tbody></table>
      </div>
      {students.length === 0 && <p className="missed-workouts__empty">Nenhum aluno com treino pendente neste período.</p>}
      <div className="missed-workouts__footer">
        <div className="missed-workouts__alert"><strong>⚠ {overdue} {overdue === 1 ? "aluno sem treino há mais de 1 dia" : "alunos sem treino há mais de 1 dia"}</strong><p>Considere enviar um lembrete.</p></div>
        <button type="button" className="missed-workouts__notify-all" disabled={!remaining.length} onClick={() => notify(remaining.map((student) => student.id))}>{remaining.length ? "Notificar todos" : "Lembretes simulados"}</button>
      </div>
    </section>
    <p className="missed-workouts__demo">Dados demonstrativos · Os lembretes são simulados para os alunos do período selecionado.</p>
  </section>;
}
export default MissedWorkouts;

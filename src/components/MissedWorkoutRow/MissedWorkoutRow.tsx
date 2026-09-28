import type { MissedWorkout } from "../MissedWorkouts/missedWorkoutsData";
import "./MissedWorkoutRow.css";
function MissedWorkoutRow({ student, notified, onNotify }: { student: MissedWorkout; notified: boolean; onNotify: () => void }) {
  const sportClass = { Natação: "swimming", Academia: "gym", Tênis: "tennis" }[student.sport];
  return <tr className="missed-workout-row">
    <td><div className="missed-workout-row__identity"><span className={`missed-workout-row__avatar missed-workout-row__avatar--${student.id}`} aria-hidden="true">{student.initials}</span><div><strong>{student.name}</strong><small>Último acesso: {student.lastAccess}</small></div></div></td>
    <td><span className={`missed-workout-row__sport missed-workout-row__sport--${sportClass}`}>{student.sport}</span></td>
    <td className="missed-workout-row__workout">{student.workout}</td>
    <td><span className={`missed-workout-row__days${student.days > 2 ? " missed-workout-row__days--critical" : ""}`}>{student.days} {student.days === 1 ? "dia" : "dias"}</span></td>
    <td><button type="button" onClick={onNotify} disabled={notified} aria-label={`${notified ? "Lembrete simulado para" : "Notificar"} ${student.name}`}>{notified ? "Simulado" : "Notificar"}</button></td>
  </tr>;
}
export default MissedWorkoutRow;

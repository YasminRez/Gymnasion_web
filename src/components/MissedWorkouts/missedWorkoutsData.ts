export type MissedWorkout = { id: number; name: string; initials: string; sport: "Natação" | "Academia" | "Tênis"; workout: string; days: number; lastAccess: string };
// Demonstração: dias consecutivos sem concluir o treino, contados até hoje.
export const missedWorkoutsData: MissedWorkout[] = [
  { id: 1, name: "Thiago Santos", initials: "TS", sport: "Natação", workout: "Treino A – Resistência", days: 3, lastAccess: "ontem" },
  { id: 2, name: "Andressa Lima", initials: "AL", sport: "Academia", workout: "Treino B – Hipertrofia", days: 2, lastAccess: "ontem" },
  { id: 3, name: "Marcos Ferreira", initials: "MF", sport: "Academia", workout: "Treino C – Força", days: 2, lastAccess: "ontem" },
  { id: 4, name: "Rafael Costa", initials: "RC", sport: "Academia", workout: "Treino A – Resistência", days: 1, lastAccess: "ontem" },
  { id: 5, name: "Diego Oliveira", initials: "DO", sport: "Tênis", workout: "Treino D – Agilidade", days: 1, lastAccess: "ontem" },
  { id: 6, name: "Camila Sousa", initials: "CS", sport: "Natação", workout: "Treino B – Técnica", days: 1, lastAccess: "ontem" },
];

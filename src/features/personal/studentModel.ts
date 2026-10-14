import type { AlunoResponse } from "../../types/student";
import type { RotinaResponse } from "../../types/rotina";

export type StudentFilter = "all" | "active" | "inactive" | "pending";
export type StudentMutation = "approve" | "reject" | "deactivate" | "reactivate";
export const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function visibleStudents(students: AlunoResponse[], filter: StudentFilter, search: string, modality: string) {
  const statuses = { all: ["ATIVO", "INATIVO"], active: ["ATIVO"], inactive: ["INATIVO"], pending: ["PENDENTE"] };
  const term = normalizeSearch(search.trim());
  return students.filter(student => statuses[filter].includes(student.status)
    && normalizeSearch(`${student.usuario.nome} ${student.usuario.email}`).includes(term)
    && (!modality || student.modalidades.some(item => String(item.id) === modality)))
    .sort((a, b) => a.usuario.nome.localeCompare(b.usuario.nome, "pt-BR"));
}

export function studentCounts(students: AlunoResponse[]) {
  const active = students.filter(item => item.status === "ATIVO").length;
  const inactive = students.filter(item => item.status === "INATIVO").length;
  return { all: active + inactive, active, inactive, pending: students.filter(item => item.status === "PENDENTE").length };
}

export function applyStudentMutation(students: AlunoResponse[], id: string, action: StudentMutation) {
  if (action === "reject") return students.filter(item => item.id !== id);
  return students.map(item => item.id === id ? { ...item, status: action === "deactivate" ? "INATIVO" : "ATIVO" } : item);
}

export function studentRoutines(routines: RotinaResponse[], id: string) {
  return routines.filter(routine => routine.ativo !== false && routine.alunos.some(student => student.id === id));
}

export function studentsWithoutRoutine(students: AlunoResponse[], routines: RotinaResponse[]) {
  return students.filter(student => student.status === "ATIVO" && studentRoutines(routines, student.id).length === 0);
}

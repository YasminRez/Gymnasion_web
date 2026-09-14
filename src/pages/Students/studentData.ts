export type StudentStatus = "active" | "inactive" | "pending";
export type Student = { id: number; name: string; sport: string; status: StudentStatus; birthDate?: string };
// Dados demonstrativos até a integração com a API de alunos do personal autenticado.
export const initialStudents: Student[] = [
  { id: 1, name: "Carlos Silva", sport: "Natação", status: "active" },
  { id: 2, name: "Mariana Lima", sport: "Tênis", status: "inactive" },
  { id: 3, name: "André Dias", sport: "Natação", status: "active" },
  { id: 4, name: "Andressa Lima", sport: "Academia", status: "inactive" },
  { id: 5, name: "Marcos Silva", sport: "Natação", status: "active" },
  { id: 6, name: "Caique Soares", sport: "Natação", status: "active" },
  { id: 7, name: "Cleiton Silva", sport: "Natação", status: "active" },
  { id: 8, name: "Fernanda Pires", sport: "Natação", status: "pending", birthDate: "12/03/2000" },
  { id: 9, name: "Fernanda Pires", sport: "Natação", status: "pending", birthDate: "12/03/2000" },
  { id: 10, name: "Fernanda Pires", sport: "Natação", status: "pending", birthDate: "12/03/2000" },
];
export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`;
}

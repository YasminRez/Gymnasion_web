export type RecentStudent = {
  id: number;
  name: string;
  initials: string;
  sport: "Natação" | "Academia" | "Tênis";
  acceptedAt: string;
  active: boolean;
  avatarColor: string;
};

// Lista demonstrativa em ordem de aceite, do mais recente ao mais antigo.
export const recentStudentsData: RecentStudent[] = [
  { id: 1, name: "Fernanda Pires", initials: "FP", sport: "Natação", acceptedAt: "Hoje, 14:32", active: true, avatarColor: "red" },
  { id: 2, name: "Rafael Costa", initials: "RC", sport: "Academia", acceptedAt: "Hoje, 09:15", active: true, avatarColor: "blue" },
  { id: 3, name: "Julia Mendes", initials: "JM", sport: "Tênis", acceptedAt: "Ontem, 18:44", active: true, avatarColor: "purple" },
  { id: 4, name: "Thiago Santos", initials: "TS", sport: "Natação", acceptedAt: "Ontem, 11:20", active: true, avatarColor: "green" },
  { id: 5, name: "Beatriz Lopes", initials: "BL", sport: "Academia", acceptedAt: "19/05, 16:08", active: true, avatarColor: "amber" },
  { id: 6, name: "Diego Oliveira", initials: "DO", sport: "Tênis", acceptedAt: "18/05, 10:55", active: true, avatarColor: "cyan" },
  { id: 7, name: "Camila Sousa", initials: "CS", sport: "Natação", acceptedAt: "17/05, 08:30", active: true, avatarColor: "pink" },
  { id: 8, name: "Marcos Ferreira", initials: "MF", sport: "Academia", acceptedAt: "16/05, 15:40", active: false, avatarColor: "olive" },
];

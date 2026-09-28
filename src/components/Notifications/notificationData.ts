export type Notification = { id: number; message: string; time: string; category: "students" | "system"; kind: "request" | "completed" | "missed" | "system"; unread: boolean };
// Dados demonstrativos até a integração com as notificações do personal autenticado.
export const notificationData: Notification[] = [
  { id: 1, message: "Fernanda Pires solicitou cadastro como aluna.", time: "Há 5 minutos", category: "students", kind: "request", unread: true },
  { id: 2, message: "Rafael Costa solicitou cadastro como aluno.", time: "Há 18 minutos", category: "students", kind: "request", unread: true },
  { id: 3, message: "Julia Mendes concluiu o treino de hoje.", time: "Há 1 hora", category: "students", kind: "completed", unread: true },
  { id: 4, message: "Carlos Silva concluiu o treino de ontem.", time: "Há 1 dia", category: "students", kind: "completed", unread: false },
  { id: 5, message: "Thiago Santos não concluiu o treino programado.", time: "Há 1 dia", category: "students", kind: "missed", unread: false },
  { id: 6, message: "Andressa Lima não concluiu o treino de ontem.", time: "Há 2 dias", category: "students", kind: "missed", unread: false },
  { id: 7, message: "Mariana Lima teve acesso revogado (conta desativada).", time: "Há 3 dias", category: "system", kind: "system", unread: false },
  { id: 8, message: "Novo treino salvo para André Dias — Academia.", time: "Há 4 dias", category: "system", kind: "system", unread: false },
];

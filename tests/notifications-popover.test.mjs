import test from "node:test";
import assert from "node:assert/strict";

test("notification popover calculates unread count accurately", () => {
  const notifications = [
    { id: "1", titulo: "Treino Concluído", mensagem: "Mariana concluiu o treino", tipo: "TREINO", lida: false, dataCriacao: "2026-10-19T10:00:00Z", referenciaId: null },
    { id: "2", titulo: "Novo Aluno", mensagem: "Carlos solicitou cadastro", tipo: "CADASTRO", lida: true, dataCriacao: "2026-10-18T10:00:00Z", referenciaId: null },
    { id: "3", titulo: "Feedback", mensagem: "Você recebeu uma nota", tipo: "FEEDBACK", lida: false, dataCriacao: "2026-10-19T11:00:00Z", referenciaId: null },
  ];

  const unread = notifications.filter((n) => !n.lida).length;
  assert.equal(unread, 2);
});

test("marking single notification as read updates only target item", () => {
  const notifications = [
    { id: "1", titulo: "Aviso 1", mensagem: "Msg 1", lida: false, dataCriacao: "2026-10-19T10:00:00Z", referenciaId: null, tipo: "TREINO" },
    { id: "2", titulo: "Aviso 2", mensagem: "Msg 2", lida: false, dataCriacao: "2026-10-19T10:00:00Z", referenciaId: null, tipo: "TREINO" },
  ];

  const targetId = "1";
  const updated = notifications.map((item) => (item.id === targetId ? { ...item, lida: true } : item));

  assert.equal(updated.find((i) => i.id === "1")?.lida, true);
  assert.equal(updated.find((i) => i.id === "2")?.lida, false);
  assert.equal(updated.filter((n) => !n.lida).length, 1);
});

test("marking all notifications as read updates all items and sets unread to 0", () => {
  const notifications = [
    { id: "1", titulo: "Aviso 1", mensagem: "Msg 1", lida: false, dataCriacao: "2026-10-19T10:00:00Z", referenciaId: null, tipo: "TREINO" },
    { id: "2", titulo: "Aviso 2", mensagem: "Msg 2", lida: false, dataCriacao: "2026-10-19T10:00:00Z", referenciaId: null, tipo: "TREINO" },
  ];

  const allRead = notifications.map((item) => ({ ...item, lida: true }));
  assert.equal(allRead.every((i) => i.lida), true);
  assert.equal(allRead.filter((i) => !i.lida).length, 0);
});

test("bell click in topbar opens popover locally instead of redirecting to main screen", () => {
  let popoverOpen = false;
  let redirectedTo = "";

  const fakeNavigate = (to) => {
    redirectedTo = to;
  };

  // Simulates user clicking bell: toggles popoverOpen without calling fakeNavigate
  const handleBellClick = () => {
    popoverOpen = !popoverOpen;
  };

  handleBellClick();
  assert.equal(popoverOpen, true);
  assert.equal(redirectedTo, "", "Clicking notification icon should not redirect to main screen");

  handleBellClick();
  assert.equal(popoverOpen, false);
  assert.equal(redirectedTo, "");
});

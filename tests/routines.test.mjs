import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(path, dependencies = {}) {
  const exports = {};
  runInNewContext(
    ts.transpileModule(readFileSync(new URL("../src/" + path, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    { exports, require: (name) => dependencies[name] }
  );
  return exports;
}

const model = load("features/routines/routineModel.ts");

const makeRoutine = (id, titulo, modalidadeId, frequencia, ativo = true, status = "ATIVA", alunos = [], metricas = []) => ({
  id,
  titulo,
  modalidadeId,
  nomeModalidade: modalidadeId === 1 ? "Natação" : "Academia",
  frequenciaSemanal: frequencia,
  objetivos: "Ganho aeróbico",
  ativo,
  status,
  alunos,
  metricas,
});

const makeStudent = (id, nome, status = "ATIVO") => ({
  id,
  usuario: { nome, email: `${id}@gymnasion.test` },
  status,
  modalidades: [{ id: 1, nome: "Natação" }],
});

test("isRoutineActive recognizes status and ativo boolean correctly", () => {
  assert.equal(model.isRoutineActive(makeRoutine("1", "R1", 1, 3, true, "ATIVA")), true);
  assert.equal(model.isRoutineActive(makeRoutine("2", "R2", 1, 3, false, "ATIVA")), false);
  assert.equal(model.isRoutineActive(makeRoutine("3", "R3", 1, 3, true, "ENCERRADA")), false);
  assert.equal(model.isRoutineActive(makeRoutine("4", "R4", 1, 3, false, "ENCERRADA")), false);
});

test("routineCounts computes all, active, and ended correctly", () => {
  const list = [
    makeRoutine("1", "R1", 1, 3, true, "ATIVA"),
    makeRoutine("2", "R2", 1, 3, true, "ATIVA"),
    makeRoutine("3", "R3", 1, 3, false, "ENCERRADA"),
    makeRoutine("4", "R4", 1, 3, false, "ATIVA"),
  ];
  assert.equal(JSON.stringify(model.routineCounts(list)), JSON.stringify({ all: 4, active: 2, ended: 2 }));
  assert.equal(JSON.stringify(model.routineCounts([])), JSON.stringify({ all: 0, active: 0, ended: 0 }));
});

test("visibleRoutines filters by status, search, and modality", () => {
  const list = [
    makeRoutine("1", "Natação Velocidade", 1, 4, true, "ATIVA", [{ id: "s1", nome: "Mariana Silva" }]),
    makeRoutine("2", "Hipertrofia Força", 2, 5, true, "ATIVA", [{ id: "s2", nome: "Carlos Andrade" }]),
    makeRoutine("3", "Natação Resistência", 1, 3, false, "ENCERRADA", [{ id: "s3", nome: "Beatriz Costa" }]),
  ];

  // Filtro por status
  assert.deepEqual(
    model.visibleRoutines(list, "active", "").map((r) => r.id),
    ["2", "1"] // Hipertrofia Força (2) vem antes de Natação Velocidade (1) alfabeticamente
  );
  assert.deepEqual(
    model.visibleRoutines(list, "ended", "").map((r) => r.id),
    ["3"]
  );

  // Filtro por busca insensível a acento no título
  assert.deepEqual(
    model.visibleRoutines(list, "all", "natacao").map((r) => r.id),
    ["1", "3"]
  );

  // Filtro por busca no nome do aluno vinculado
  assert.deepEqual(
    model.visibleRoutines(list, "all", "andrade").map((r) => r.id),
    ["2"]
  );

  // Filtro por modalidade
  assert.deepEqual(
    model.visibleRoutines(list, "all", "", 1).map((r) => r.id),
    ["1", "3"]
  );
  assert.deepEqual(
    model.visibleRoutines(list, "all", "", 2).map((r) => r.id),
    ["2"]
  );
});

test("eligibleStudentsForRoutine enforces 1 active routine per student limit", () => {
  const s1 = makeStudent("s1", "Atleta 1", "ATIVO");
  const s2 = makeStudent("s2", "Atleta 2", "ATIVO");
  const s3 = makeStudent("s3", "Atleta 3", "INATIVO"); // inativo
  const s4 = makeStudent("s4", "Atleta 4", "PENDENTE"); // pendente
  const s5 = makeStudent("s5", "Atleta 5", "ATIVO");

  const routines = [
    makeRoutine("r1", "Rotina 1", 1, 3, true, "ATIVA", [{ id: "s1", nome: "Atleta 1" }]),
    makeRoutine("r2", "Rotina 2", 1, 3, false, "ENCERRADA", [{ id: "s5", nome: "Atleta 5" }]),
  ];

  // s1 tem rotina ativa r1, então não está elegível
  // s3 e s4 não são ativos
  // s5 estava numa rotina já ENCERRADA, então está elegível!
  // s2 não tem nenhuma rotina, então está elegível!
  const eligible = model.eligibleStudentsForRoutine([s1, s2, s3, s4, s5], routines);
  assert.deepEqual(eligible.map((s) => s.id), ["s2", "s5"]);

  // Se estivermos editando r1, s1 deve permanecer elegível para a própria r1
  const eligibleForR1 = model.eligibleStudentsForRoutine([s1, s2, s3, s4, s5], routines, "r1");
  assert.deepEqual(eligibleForR1.map((s) => s.id), ["s1", "s2", "s5"]);

  // Aluno s1 possui rotina ativa na modalidade 1, mas está elegível para rotina na modalidade 2 (1 rotina ativa por modalidade)
  const s1Multi = { ...s1, modalidades: [{ id: 1, nome: "Natação" }, { id: 2, nome: "Academia" }] };
  const s2Multi = { ...s2, modalidades: [{ id: 1, nome: "Natação" }, { id: 2, nome: "Academia" }] };
  const eligibleForMod2 = model.eligibleStudentsForRoutine([s1Multi, s2Multi], routines, undefined, 2);
  assert.deepEqual(eligibleForMod2.map((s) => s.id), ["s1", "s2"]);
});

test("validateCreateRoutinePayload enforces title, modality, frequency 1..7, goals, student, and metric", () => {
  assert.ok(model.validateCreateRoutinePayload({}).titulo);
  assert.ok(model.validateCreateRoutinePayload({}).modalidadeId);
  assert.ok(model.validateCreateRoutinePayload({}).frequenciaSemanal);
  assert.ok(model.validateCreateRoutinePayload({}).objetivos);
  assert.ok(model.validateCreateRoutinePayload({}).alunosIds);
  assert.ok(model.validateCreateRoutinePayload({}).metricasIds);

  // Frequência inválida
  assert.ok(model.validateCreateRoutinePayload({ frequenciaSemanal: 0 }).frequenciaSemanal);
  assert.ok(model.validateCreateRoutinePayload({ frequenciaSemanal: 8 }).frequenciaSemanal);

  // Payload válido
  const valid = {
    titulo: "Treino A",
    modalidadeId: 1,
    frequenciaSemanal: 4,
    objetivos: "Resistência",
    alunosIds: ["s1"],
    metricasIds: ["m1"],
  };
  assert.equal(Object.keys(model.validateCreateRoutinePayload(valid)).length, 0);
});

test("validateReuseRoutinePayload validates student, date YYYY-MM-DD, title, and goals", () => {
  assert.ok(model.validateReuseRoutinePayload({}).alunoId);
  assert.ok(model.validateReuseRoutinePayload({}).dataInicio);
  assert.ok(model.validateReuseRoutinePayload({ dataInicio: "20-10-2026" }).dataInicio);
  assert.ok(model.validateReuseRoutinePayload({}).titulo);
  assert.ok(model.validateReuseRoutinePayload({}).objetivos);

  const valid = {
    alunoId: "s1",
    dataInicio: "2026-11-01",
    titulo: "Cópia Treino A",
    objetivos: "Evolução contínua",
  };
  assert.equal(Object.keys(model.validateReuseRoutinePayload(valid)).length, 0);
});

test("rotinaService integration signatures and URLs match API routes", async () => {
  let calledUrl = "";
  let calledMethod = "";
  let calledBody = null;

  const mockApi = {
    get: async (url) => { calledUrl = url; calledMethod = "GET"; return { data: [{ id: "r1" }] }; },
    post: async (url, body) => { calledUrl = url; calledMethod = "POST"; calledBody = body; return { data: { id: "r1" } }; },
    put: async (url, body) => { calledUrl = url; calledMethod = "PUT"; calledBody = body; return { data: { id: "r1" } }; },
    patch: async (url) => { calledUrl = url; calledMethod = "PATCH"; return { data: { id: "r1", status: "ENCERRADA" } }; },
    delete: async (url) => { calledUrl = url; calledMethod = "DELETE"; return { data: { mensagem: "Sucesso" } }; },
  };

  const apiTypes = load("types/api.ts");
  const serviceModule = load("services/rotinaService.ts", {
    "./api": { api: mockApi },
    "../types/api": apiTypes,
  });
  const { rotinaService } = serviceModule;

  await rotinaService.listar();
  assert.equal(calledUrl, "/api/personal-trainers/rotinas");
  assert.equal(calledMethod, "GET");

  await rotinaService.buscarPorId("abc");
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/abc");

  await rotinaService.criar({ titulo: "Nova" });
  assert.equal(calledUrl, "/api/personal-trainers/rotinas");
  assert.equal(calledMethod, "POST");

  await rotinaService.encerrar("abc");
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/abc/encerrar");
  assert.equal(calledMethod, "PATCH");

  await rotinaService.excluir("abc");
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/abc");
  assert.equal(calledMethod, "DELETE");

  await rotinaService.reutilizar("abc", { alunoId: "s1", dataInicio: "2026-11-01", titulo: "T2", objetivos: "O2" });
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/abc/reutilizar");
  assert.equal(calledMethod, "POST");

  await rotinaService.desvincularAluno("abc", "s1");
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/abc/alunos/s1");
  assert.equal(calledMethod, "DELETE");

  await rotinaService.atualizar("abc", {
    titulo: "Treino Atualizado",
    frequenciaSemanal: 5,
    objetivos: "Novos objetivos",
    alunosIds: ["s1"],
    metricasIds: ["m1"],
  });
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/abc");
  assert.equal(calledMethod, "PUT");
  assert.equal(calledBody.titulo, "Treino Atualizado");

  await rotinaService.vincularTurma("rot-1", "turma-9");
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/rot-1/turmas/turma-9");
  assert.equal(calledMethod, "POST");
  assert.equal(calledBody, undefined);

  await rotinaService.vincularTurma("rot-1", "turma-9", true);
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/rot-1/turmas/turma-9");
  assert.equal(calledMethod, "POST");
  assert.equal(calledBody, undefined);

  await rotinaService.consultarPlanejamento("abc");
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/abc/planejamento");
  assert.equal(calledMethod, "GET");

  await rotinaService.adicionarSessao("abc", {
    semana: 1,
    dataPlanejada: "2026-11-10",
    duracao: 45,
    atividades: "Recuperação ativa\nAquecimento: 10 min",
  });
  assert.equal(calledUrl, "/api/personal-trainers/rotinas/abc/sessoes");
  assert.equal(calledMethod, "POST");
  assert.equal(calledBody.semana, 1);
  assert.equal(calledBody.duracao, 45);
});

test("eligibleGroupsForRoutine and extractProblemDetail enforce modality match and RFC 7807 detail", () => {
  const routine = makeRoutine("r1", "Treino Natação", 1, 3, true, "ATIVA");
  const groups = [
    { id: "g1", nome: "Natação Manhã", modalidadeId: 1 },
    { id: "g2", nome: "Tênis Tarde", modalidadeId: 2 },
    { id: "g3", nome: "Natação Noite", modalidadeId: 1 },
  ];
  assert.deepEqual(
    model.eligibleGroupsForRoutine(groups, routine).map((g) => g.id),
    ["g1", "g3"]
  );

  const err422 = {
    response: {
      status: 422,
      data: {
        type: "https://api.gymnasion.com/errors/regra-de-negocio",
        title: "Violação de Regra de Negócio",
        status: 422,
        detail: "O aluno Lucas já possui uma rotina de treino ativa. A rotina atual precisa ser encerrada antes.",
      },
    },
  };
  assert.equal(
    model.extractProblemDetail(err422, "Erro genérico"),
    "O aluno Lucas já possui uma rotina de treino ativa. A rotina atual precisa ser encerrada antes."
  );
  assert.equal(model.extractProblemDetail({}, "Erro genérico"), "Erro genérico");
});

test("routineModalityCounts, getStudentInitials, and getModalityBadgeStyle match Figma specs", () => {
  // Initials
  assert.equal(model.getStudentInitials("Ana Beatriz Silva"), "AS");
  assert.equal(model.getStudentInitials("Gabriel"), "GA");
  assert.equal(model.getStudentInitials(""), "AL");

  // Modality styling
  const natacao = model.getModalityBadgeStyle("Natação");
  assert.equal(natacao.bg, "#eff8ff");
  assert.equal(natacao.color, "#175cd3");

  const tenis = model.getModalityBadgeStyle("Tênis");
  assert.equal(tenis.bg, "#f4fce3");
  assert.equal(tenis.color, "#598b00");

  const academia = model.getModalityBadgeStyle("Academia");
  assert.equal(academia.bg, "#f4f3ff");
  assert.equal(academia.color, "#5925dc");

  // Counts
  const routinesList = [
    makeRoutine("1", "R1", 1, 4),
    makeRoutine("2", "R2", 1, 3),
    makeRoutine("3", "R3", 2, 3),
  ];
  const mods = [
    { id: 1, nome: "Natação" },
    { id: 2, nome: "Tênis" },
  ];
  const counts = model.routineModalityCounts(routinesList, mods);
  assert.equal(
    JSON.stringify(counts),
    JSON.stringify([
      { id: null, nome: "Todas", count: 3 },
      { id: 1, nome: "Natação", count: 2 },
      { id: 2, nome: "Tênis", count: 1 },
    ])
  );
});


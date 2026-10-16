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

const model = load("features/metrics/metricModel.ts");

const makeMetric = (id, titulo, modalidadeId, tipo = "NUMERICO", registros = 0, ativo = true, descontinuada = false, quem = "ALUNO") => ({
  id,
  titulo,
  modalidadeId,
  nomeModalidade: modalidadeId === 1 ? "Natação" : modalidadeId === 2 ? "Tênis" : "Academia",
  tipo,
  quantidadeAlunosComRegistro: registros,
  ativo,
  descontinuada,
  quemPreenche: quem,
  obrigatoria: true,
});

test("getMetricStudentCount extracts count from either field", () => {
  assert.equal(model.getMetricStudentCount({ quantidadeAlunosComRegistro: 6 }), 6);
  assert.equal(model.getMetricStudentCount({ quantidadeAlunosComRegistros: 4 }), 4);
  assert.equal(model.getMetricStudentCount({}), 0);
});

test("isMetricActive respects descontinuada flag and fallback to ativo", () => {
  assert.equal(model.isMetricActive({ descontinuada: false, ativo: true }), true);
  assert.equal(model.isMetricActive({ descontinuada: true, ativo: true }), false);
  assert.equal(model.isMetricActive({ ativo: false }), false);
  assert.equal(model.isMetricActive({ ativo: true }), true);
});

test("getPreenchimentoLabel returns human-friendly Portuguese labels", () => {
  assert.equal(model.getPreenchimentoLabel("ALUNO"), "aluno");
  assert.equal(model.getPreenchimentoLabel("PERSONAL"), "personal");
  assert.equal(model.getPreenchimentoLabel("AMBOS"), "aluno e personal");
  assert.equal(model.getPreenchimentoLabel(undefined), "aluno e personal");
});

test("normalizeTipo handles aliases TEMPO_CRONOMETRO and TEXTO_OBSERVACAO", () => {
  assert.equal(model.normalizeTipo("TEMPO_CRONOMETRO"), "TEMPO");
  assert.equal(model.normalizeTipo("TEMPO"), "TEMPO");
  assert.equal(model.normalizeTipo("TEXTO_OBSERVACAO"), "TEXTO");
  assert.equal(model.normalizeTipo("TEXTO"), "TEXTO");
  assert.equal(model.normalizeTipo("FREQUENCIA_CARDIACA"), "FREQUENCIA_CARDIACA");
  assert.equal(model.normalizeTipo("NUMERICO"), "NUMERICO");
});

test("toBackendTipoMetrica produces strictly the 4 Spring Boot accepted enum values", () => {
  const allowed = ["FREQUENCIA_CARDIACA", "TEXTO", "TEMPO", "NUMERICO"];
  for (const opt of model.METRIC_TYPE_OPTIONS) {
    assert.equal(allowed.includes(model.toBackendTipoMetrica(opt.value)), true);
  }
  assert.equal(model.toBackendTipoMetrica("TEMPO_CRONOMETRO"), "TEMPO");
  assert.equal(model.toBackendTipoMetrica("TEXTO_OBSERVACAO"), "TEXTO");
  assert.equal(model.toBackendTipoMetrica("TEMPO"), "TEMPO");
  assert.equal(model.toBackendTipoMetrica("TEXTO"), "TEXTO");
  assert.equal(model.toBackendTipoMetrica("NUMERICO"), "NUMERICO");
  assert.equal(model.toBackendTipoMetrica("FREQUENCIA_CARDIACA"), "FREQUENCIA_CARDIACA");
});

test("isMetricDuplicate enforces case/accent-insensitive uniqueness per modality (RN-016)", () => {
  const existing = [
    makeMetric("1", "Ritmo 100m", 1),
    makeMetric("2", "Braçadas por piscina", 1),
    makeMetric("3", "Ritmo 100m", 2),
  ];

  assert.equal(model.isMetricDuplicate("ritmo 100m", 1, existing), true);
  assert.equal(model.isMetricDuplicate("RITMO 100M", 1, existing), true);
  assert.equal(model.isMetricDuplicate("Ritmo 100m", 1, existing, "1"), false); // Ignora a própria ao editar
  assert.equal(model.isMetricDuplicate("Ritmo 200m", 1, existing), false);
  assert.equal(model.isMetricDuplicate("Braçadas por piscina", 2, existing), false); // Modalidade diferente é permitido
});

test("metricModalityCounts calculates total and per modality correctly", () => {
  const metrics = [
    makeMetric("1", "Ritmo 100m", 1),
    makeMetric("2", "Distância", 1),
    makeMetric("3", "FC média", 1),
    makeMetric("4", "Braçadas", 1),
    makeMetric("5", "Primeiro saque", 2),
    makeMetric("6", "Duração rally", 2),
    makeMetric("7", "Carga agachamento", 3),
    makeMetric("8", "Observações", 3),
  ];
  const modalities = [
    { id: 1, nome: "Natação" },
    { id: 2, nome: "Tênis" },
    { id: 3, nome: "Academia" },
    { id: 4, nome: "Crossfit" }, // 0 métricas cadastradas
  ];

  const counts = model.metricModalityCounts(metrics, modalities);
  assert.equal(
    JSON.stringify(counts),
    JSON.stringify([
      { id: null, nome: "Todas", count: 8 },
      { id: 1, nome: "Natação", count: 4 },
      { id: 2, nome: "Tênis", count: 2 },
      { id: 3, nome: "Academia", count: 2 },
    ])
  );

  // Se options.includeZero for true, inclui a modalidade com 0
  const countsWithZero = model.metricModalityCounts(metrics, modalities, { includeZero: true });
  assert.equal(countsWithZero.some((c) => c.nome === "Crossfit" && c.count === 0), true);

  // Se activeModalityId for o id da modalidade vazia, ela também é exibida
  const countsWithActive = model.metricModalityCounts(metrics, modalities, { activeModalityId: 4 });
  assert.equal(countsWithActive.some((c) => c.id === 4 && c.count === 0), true);
});

test("filterMetrics filters by modality and search text", () => {
  const metrics = [
    makeMetric("1", "Ritmo 100m", 1),
    makeMetric("2", "Distância total", 1),
    makeMetric("3", "Duração do rally", 2),
  ];

  // Filtro por modalidade
  assert.equal(model.filterMetrics(metrics, 1).length, 2);
  assert.equal(model.filterMetrics(metrics, 2).length, 1);
  assert.equal(model.filterMetrics(metrics, null).length, 3);

  // Busca por texto
  assert.equal(model.filterMetrics(metrics, null, "ritmo")[0].id, "1");
  assert.equal(model.filterMetrics(metrics, 1, "rally").length, 0);
  assert.equal(model.filterMetrics(metrics, null, "rally")[0].id, "3");
});

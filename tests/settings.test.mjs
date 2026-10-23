import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const data = new Map();
const exports = {};
runInNewContext(
  ts.transpileModule(
    readFileSync(new URL("../src/features/settings/useAccountSettings.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
  ).outputText,
  { exports, require: () => ({}), localStorage: { getItem: (key) => data.get(key) } }
);

test("settings are isolated per account and default to enabled badges", () => {
  data.set(
    exports.settingsKey("a"),
    JSON.stringify({
      photo: "data:image/png;base64,abc",
      showNotificationBadge: false,
      notificacoesEmail: true,
      notificacoesPush: false,
    })
  );
  assert.equal(exports.readSettings("a").showNotificationBadge, false);
  assert.equal(exports.readSettings("a").notificacoesEmail, true);
  assert.equal(exports.readSettings("a").notificacoesPush, false);

  assert.equal(exports.readSettings("b").showNotificationBadge, true);
  assert.equal(exports.readSettings("b").notificacoesEmail, false);
  assert.equal(exports.readSettings("b").notificacoesPush, false);
  assert.equal(exports.readSettings("b").photo, "");
});

test("corrupted storage and unsupported image formats use safe defaults", () => {
  for (const value of [
    "{broken",
    "null",
    JSON.stringify({ photo: "javascript:alert(1)", showNotificationBadge: "false" }),
  ]) {
    data.set(exports.settingsKey("c"), value);
    assert.equal(exports.readSettings("c").photo, "");
    assert.equal(exports.readSettings("c").showNotificationBadge, true);
    assert.equal(exports.readSettings("c").notificacoesEmail, false);
    assert.equal(exports.readSettings("c").notificacoesPush, false);
  }
});

test("accountService contract defines required settings and profile endpoints", () => {
  const serviceCode = readFileSync(
    new URL("../src/services/accountService.ts", import.meta.url),
    "utf8"
  );
  assert.match(serviceCode, /\/api\/usuarios\/me/);
  assert.match(serviceCode, /\/api\/usuarios\/me\/preferencias/);
  assert.match(serviceCode, /\/api\/usuarios\/me\/senha/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
function load(path, dependencies = {}) {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(new URL("../src/" + path, import.meta.url), "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {exports,require:name=>dependencies[name]});
  return exports;
}
const model = load("features/groups/groupModel.ts");
test("search ignores accents and combines with modality filter",()=>{
  const groups=[{id:"a",nome:"Natação — Manhã",modalidadeId:1},{id:"b",nome:"Tênis — Manhã",modalidadeId:2}];
  assert.deepEqual(Array.from(model.filterGroups(groups," natacao ",""),g=>g.id),["a"]);
  assert.deepEqual(Array.from(model.filterGroups(groups,"manha","2"),g=>g.id),["b"]);
  assert.equal(model.filterGroups(groups,"","3").length,0);
});
test("form rejects missing name, modality, oversized names and invalid dates",()=>{
  for(const args of [["","1",""],["x","",""],["x".repeat(101),"1",""],["x","1","invalid"]]) assert.ok(model.groupFormError(...args));
  assert.equal(model.groupFormError("Turma","1",""),"");
  assert.equal(model.groupFormError("Turma","1","2026-10-18T07:00"),"");
});
test("removal updates count without mutating source and handles final member",()=>{
  const group={id:"a",alunos:[{id:"1"},{id:"2"}],quantidadeAlunos:2};
  const next=model.removeGroupMember(group,"1");
  assert.equal(next.quantidadeAlunos,1);assert.equal(next.alunos[0].id,"2");assert.equal(group.alunos.length,2);
  assert.equal(model.removeGroupMember(next,"2").quantidadeAlunos,0);
});
test("group service uses backend contract for all mutations and surfaces errors",async()=>{
  const calls=[];
  const api=Object.fromEntries(["get","post","put","delete"].map(method=>[method,async(...args)=>{calls.push([method,...args]);return {data:{id:"g"}};}]));
  const service=load("services/turmaService.ts",{"./api":{api}}).turmaService;
  const payload={nome:"Turma",modalidadeId:1,horario:null,alunosIds:["a"]};
  await service.listar();await service.buscarPorId("g");await service.criar(payload);await service.atualizar("g",payload);await service.adicionarAluno("g","a");await service.removerAluno("g","a");
  assert.deepEqual(calls.map(c=>c.slice(0,2)),[
    ["get","/api/personal-trainers/turmas"],["get","/api/personal-trainers/turmas/g"],["post","/api/personal-trainers/turmas"],["put","/api/personal-trainers/turmas/g"],["post","/api/personal-trainers/turmas/g/alunos/a"],["delete","/api/personal-trainers/turmas/g/alunos/a"]]);
  assert.equal(calls[2][2],payload);
  api.post=async()=>{throw new Error("duplicate");};
  await assert.rejects(service.adicionarAluno("g","a"),/duplicate/);
});

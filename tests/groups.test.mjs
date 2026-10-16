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
test("student search in new group modal filters active students by name ignoring accents",()=>{
  const students=[
    {id:"1",status:"ATIVO",usuario:{nome:"João Ângelo"}},
    {id:"2",status:"ATIVO",usuario:{nome:"Maria Clara"}},
    {id:"3",status:"INATIVO",usuario:{nome:"João Inativo"}},
  ];
  assert.deepEqual(model.filterGroupStudents(students,"").map(s=>s.id),["1","2"]);
  assert.deepEqual(model.filterGroupStudents(students," joao angelo ").map(s=>s.id),["1"]);
  assert.deepEqual(model.filterGroupStudents(students,"clara").map(s=>s.id),["2"]);
  assert.equal(model.filterGroupStudents(students,"inexistente").length,0);
});
test("eligibleRoutinesForGroup filters active routines with same modalidadeId and groupRoutine finds linked routine",()=>{
  const group={id:"g1",nome:"Natação — Manhã",modalidadeId:1,nomeModalidade:"Natação",alunos:[{id:"a1"},{id:"a2"}],quantidadeAlunos:2};
  const routines=[
    {id:"r1",titulo:"Treino Natação",modalidadeId:1,ativo:true,status:"ATIVA",alunos:[{id:"a1"},{id:"a2"}]},
    {id:"r2",titulo:"Treino Tênis",modalidadeId:2,ativo:true,status:"ATIVA",alunos:[{id:"a1"},{id:"a2"}]},
    {id:"r3",titulo:"Natação Antiga",modalidadeId:1,ativo:false,status:"ENCERRADA",alunos:[{id:"a1"},{id:"a2"}]},
  ];
  assert.deepEqual(model.eligibleRoutinesForGroup(routines,group).map(r=>r.id),["r1"]);
  assert.equal(model.groupRoutine(routines,group)?.id,"r1");
  assert.equal(model.groupRoutine([],group),undefined);
});
test("group service uses backend contract for all mutations and surfaces errors",async()=>{
  const calls=[];
  const api=Object.fromEntries(["get","post","put","delete"].map(method=>[method,async(...args)=>{calls.push([method,...args]);return {data:{id:"g"}};}]));
  const apiTypes=load("types/api.ts");
  const service=load("services/turmaService.ts",{"./api":{api},"../types/api":apiTypes}).turmaService;
  const payload={nome:"Turma",modalidadeId:1,horario:null,alunosIds:["a"]};
  await service.listar();await service.buscarPorId("g");await service.criar(payload);await service.atualizar("g",payload);await service.adicionarAluno("g","a");await service.removerAluno("g","a");
  assert.deepEqual(calls.map(c=>c.slice(0,2)),[
    ["get","/api/personal-trainers/turmas"],["get","/api/personal-trainers/turmas/g"],["post","/api/personal-trainers/turmas"],["put","/api/personal-trainers/turmas/g"],["post","/api/personal-trainers/turmas/g/alunos/a"],["delete","/api/personal-trainers/turmas/g/alunos/a"]]);
  assert.equal(calls[2][2],payload);
  api.post=async()=>{throw new Error("duplicate");};
  await assert.rejects(service.adicionarAluno("g","a"),/duplicate/);
});

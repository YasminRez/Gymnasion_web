import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
function load(path, dependencies={}) {
  const exports={};
  runInNewContext(ts.transpileModule(readFileSync(new URL('../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>dependencies[name]});
  return exports;
}
const model=load('features/report/reportModel.ts');
const blob=value=>({text:async()=>typeof value==='string'?value:JSON.stringify(value)});
const httpError=(status,data)=>({code:'ERR_BAD_REQUEST',response:{status,data:blob(data)}});
function fakeTimers(){
  const timers={pending:null,cleared:[],set:(callback,ms)=>{timers.pending={callback,ms};return 'timer';},clear:id=>timers.cleared.push(id)};
  return timers;
}

test('US16_cenario1_personal_gera_pdf_no_endpoint_do_aluno_com_periodo_e_timeout_do_RNF004',async()=>{
  let request;
  const {relatorioService}=load('services/relatorioService.ts',{'./api':{api:{get:async(...args)=>{request=args;return {data:'pdf',headers:{'content-disposition':'attachment; filename="a.pdf"'}};}}},'../features/report/reportModel':model});
  const signal={};
  const file=await relatorioService.gerarPeloPersonal('aluno/1',{dataInicio:'2026-06-01',dataFim:'2026-08-31',modalidadeId:2},signal);
  assert.equal(request[0],'/api/personal-trainers/alunos/aluno%2F1/relatorio');
  assert.deepEqual({...request[1].params},{dataInicio:'2026-06-01',dataFim:'2026-08-31',modalidadeId:2});
  assert.equal(request[1].responseType,'blob');
  assert.ok(request[1].timeout>40000,'precisa esperar mais que os 40 s do RNF-004');
  assert.equal(request[1].signal,signal);
  assert.equal(file.blob,'pdf');assert.equal(file.contentDisposition,'attachment; filename="a.pdf"');
});

test('US16_cenario1_aluno_gera_o_proprio_relatorio_sem_header_exposto',async()=>{
  let request;
  const {relatorioService}=load('services/relatorioService.ts',{'./api':{api:{get:async(...args)=>{request=args;return {data:'pdf',headers:{}};}}},'../features/report/reportModel':model});
  const file=await relatorioService.gerarPeloAluno({dataInicio:'2026-06-01',dataFim:'2026-08-31'});
  assert.equal(request[0],'/api/alunos/relatorio');
  assert.equal(file.contentDisposition,undefined);
});

test('US16_cenario1_nome_do_arquivo_vem_do_backend_ou_segue_o_mesmo_padrao',()=>{
  const period={dataInicio:'2026-06-01',dataFim:'2026-08-31'};
  assert.equal(model.reportFileName("attachment; filename=\"relatorio-performance-joao-2026-06-01_2026-08-31.pdf\"; filename*=UTF-8''relatorio-performance-jo%C3%A3o.pdf",'x',period),'relatorio-performance-joão.pdf');
  assert.equal(model.reportFileName('attachment; filename="relatorio-x.pdf"','x',period),'relatorio-x.pdf');
  assert.equal(model.reportFileName(undefined,'Yasmin Aluna Téste',period),'relatorio-performance-yasmin-aluna-teste-2026-06-01_2026-08-31.pdf');
  assert.equal(model.reportFileName(undefined,'',period),'relatorio-performance-aluno-2026-06-01_2026-08-31.pdf');
});

test('US16_cenario1_periodo_obrigatorio_e_inicio_nao_pode_ser_posterior_ao_fim',()=>{
  assert.equal(model.reportPeriodError({dataInicio:'',dataFim:'2026-08-31'}),'Informe a data de início e a data de fim do período do relatório.');
  assert.equal(model.reportPeriodError({dataInicio:'2026-09-01',dataFim:'2026-08-31'}),'A data de início não pode ser posterior à data de fim.');
  assert.equal(model.reportPeriodError({dataInicio:'2026-08-31',dataFim:'2026-08-31'}),undefined);
  assert.deepEqual({...model.defaultReportPeriod(new Date(2026,9,16))},{dataInicio:'2026-07-16',dataFim:'2026-10-16'});
  assert.deepEqual({...model.reportPeriodFromDays(28,new Date(2026,9,16))},{dataInicio:'2026-09-18',dataFim:'2026-10-16'});
  assert.equal(model.formatReportDate('2026-06-01'),'01/06/2026');
});

test('US16_cenario2_indicador_de_progresso_apos_10s',async()=>{
  assert.equal(model.REPORT_SLOW_AFTER_MS,10000);
  const timers=fakeTimers();let slow=false;let finish;
  const running=model.runReport(()=>new Promise(resolve=>{finish=resolve;}),()=>{slow=true;},timers);
  assert.equal(timers.pending.ms,10000);assert.equal(slow,false);
  timers.pending.callback();
  assert.equal(slow,true);
  finish('pdf');
  const outcome=await running;
  assert.equal(outcome.kind,'success');assert.equal(outcome.file,'pdf');
  assert.deepEqual(timers.cleared,['timer']);
});

test('US16_cenario2_timer_e_limpo_mesmo_quando_a_geracao_falha',async()=>{
  const timers=fakeTimers();
  const outcome=await model.runReport(async()=>{throw httpError(422,{detail:'A data de início não pode ser posterior à data de fim.'});},()=>{},timers);
  assert.equal(outcome.kind,'error');assert.equal(outcome.message,'A data de início não pode ser posterior à data de fim.');
  assert.deepEqual(timers.cleared,['timer']);
});

test('US16_cenario3_periodo_sem_dados_traz_intervalo_sugerido',async()=>{
  assert.equal(model.REPORT_NO_DATA_MESSAGE,'Não há dados para o período selecionado');
  const outcome=await model.reportOutcomeFromError(httpError(422,{status:422,detail:'Não há dados para o período selecionado',periodoSugerido:{dataInicio:'2026-06-01',dataFim:'2026-08-31'}}));
  assert.equal(outcome.kind,'no-data');
  assert.deepEqual({...outcome.suggested},{dataInicio:'2026-06-01',dataFim:'2026-08-31'});
});

test('US16_cenario3_aluno_sem_nenhum_registro_nao_recebe_sugestao',async()=>{
  const outcome=await model.reportOutcomeFromError(httpError(422,{detail:'Não há dados para o período selecionado',periodoSugerido:null}));
  assert.equal(outcome.kind,'no-data');assert.equal(outcome.suggested,null);
});

test('US16_erros_do_backend_cancelamento_sessao_e_timeout',async()=>{
  assert.equal((await model.reportOutcomeFromError(httpError(404,{detail:'Aluno não encontrado para este Personal Trainer.'}))).message,'Aluno não encontrado para este Personal Trainer.');
  assert.equal((await model.reportOutcomeFromError(httpError(422,{detail:'Erro. Este aluno está inativo.'}))).message,'Erro. Este aluno está inativo.');
  assert.equal((await model.reportOutcomeFromError(httpError(500,'<html>'))).message,'Não foi possível gerar o relatório. Tente novamente.');
  assert.equal((await model.reportOutcomeFromError({code:'ERR_CANCELED'})).kind,'cancelled');
  assert.equal((await model.reportOutcomeFromError(httpError(401,{detail:'Token inválido'}))).kind,'silent');
  assert.equal((await model.reportOutcomeFromError({response:{status:403,data:undefined}})).message,'Você não tem permissão para gerar este relatório.');
  assert.match((await model.reportOutcomeFromError({code:'ECONNABORTED'})).message,/demorou mais que o esperado/);
  assert.match((await model.reportOutcomeFromError({code:'ERR_NETWORK'})).message,/conectar ao servidor/);
  assert.deepEqual({...await model.readReportProblem({detail:'x'})},{detail:'x'});
});

// Componentes: transpila os .tsx de src e resolve os imports relativos; CSS vira módulo vazio.
const nodeRequire=createRequire(import.meta.url);
function loadComponent(path,stubs={},cache=new Map(),url=new URL('../src/'+path,import.meta.url)){
  if(cache.has(url.href))return cache.get(url.href).exports;
  const module={exports:{}};cache.set(url.href,module);
  const source=ts.transpileModule(readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  runInNewContext(source,{module,exports:module.exports,require:name=>{
    if(name in stubs)return stubs[name];
    if(name.endsWith('.css'))return {};
    if(!name.startsWith('.'))return nodeRequire(name);
    const file=['.tsx','.ts'].map(ext=>new URL(name+ext,url)).find(existsSync);
    return loadComponent(null,stubs,cache,file);
  }});
  return module.exports;
}
const dialog=loadComponent('components/ReportDialog/ReportDialog.tsx',{'react-hot-toast':{default:{success(){}}}});
const render=(component,props)=>renderToStaticMarkup(createElement(component,props));
const period={dataInicio:'2026-01-01',dataFim:'2026-01-31'};
const suggested={dataInicio:'2026-06-01',dataFim:'2026-08-18'};
function findByText(node,text){
  if(!node||typeof node!=='object')return null;
  if(Array.isArray(node))return node.map(child=>findByText(child,text)).find(Boolean)??null;
  if(node.props?.children===text)return node;
  return findByText(node.props?.children,text)??findByText(node.props?.actions,text);
}

test('US16_cenario1_dialogo_pede_o_periodo_e_confirma_a_geracao',()=>{
  const html=render(dialog.default,{studentName:'Yasmin Aluna Teste',modalidades:[{id:1,nome:'Natação'}],initialPeriod:{dataInicio:'2026-06-01',dataFim:'2026-08-31'},generate:async()=>({}),onClose(){}});
  assert.match(html,/<h2[^>]*>Gerar relatório<\/h2>/);
  assert.match(html,/Relatório de performance de Yasmin Aluna Teste em PDF, com dados tabulados e gráficos de evolução\./);
  assert.match(html,/<input type="date"[^>]*id="report-start" value="2026-06-01"/);
  assert.match(html,/<input type="date"[^>]*id="report-end" value="2026-08-31"/);
  assert.match(html,/<button form="report-dialog-form" type="submit"[^>]*>Gerar relatório<\/button>/);
  assert.doesNotMatch(html,/report-sport/,'com uma modalidade não há filtro');
  assert.doesNotMatch(html,/role="status"/,'o progresso só aparece depois de 10 s');
});

test('US16_cenario1_filtro_de_modalidade_quando_o_aluno_tem_mais_de_uma',()=>{
  const html=render(dialog.default,{studentName:'Aluno',modalidades:[{id:1,nome:'Natação'},{id:3,nome:'Tênis'}],initialPeriod:period,generate:async()=>({}),onClose(){}});
  assert.match(html,/<select[^>]*id="report-sport"/);
  assert.match(html,/<option value="todas"[^>]*>Todas as modalidades<\/option><option value="1">Natação<\/option><option value="3">Tênis<\/option>/);
});

test('US16_cenario2_indicador_informa_que_o_relatorio_esta_sendo_processado',()=>{
  const html=render(dialog.ReportProgress,{});
  assert.match(html,/role="status"/);assert.match(html,/aria-live="polite"/);
  assert.match(html,/O relatório está sendo processado\./);
  assert.match(html,/até 40 segundos/);
});

test('US16_cenario3_modal_mostra_a_mensagem_e_o_intervalo_alternativo',()=>{
  const html=render(dialog.ReportNoDataDialog,{period,suggested,onBack(){},onUseSuggested(){},onClose(){}});
  assert.match(html,/<h2[^>]*>Não há dados para o período selecionado<\/h2>/);
  assert.match(html,/Período selecionado<\/span><strong>01\/01\/2026 a 31\/01\/2026<\/strong>/);
  assert.match(html,/Período com registros<\/span><strong>01\/06\/2026 a 18\/08\/2026<\/strong>/);
  assert.match(html,/>Usar período sugerido<\/button>/);assert.match(html,/>Escolher outro período<\/button>/);
});

test('US16_cenario3_usar_periodo_sugerido_gera_com_o_intervalo_alternativo',()=>{
  const calls=[];
  const tree=dialog.ReportNoDataDialog({period,suggested,onBack:()=>calls.push('back'),onUseSuggested:value=>calls.push(value),onClose(){}});
  findByText(tree,'Usar período sugerido').props.onClick();
  findByText(tree,'Escolher outro período').props.onClick();
  assert.deepEqual(calls,[suggested,'back']);
});

test('US16_cenario3_aluno_sem_nenhum_registro_so_pode_voltar',()=>{
  const html=render(dialog.ReportNoDataDialog,{period,suggested:null,onBack(){},onUseSuggested(){},onClose(){}});
  assert.match(html,/Não há dados para o período selecionado/);
  assert.match(html,/Ainda não há registros de desempenho para gerar o relatório\./);
  assert.doesNotMatch(html,/Usar período sugerido|Período com registros/);
  assert.match(html,/>Voltar<\/button>/);
});

test('US16_cenario1_menu_do_personal_pede_o_aluno_antes_do_periodo',()=>{
  const students=[{id:'a1',nome:'Yasmin',modalidades:[{id:1,nome:'Natação'}]},{id:'a2',nome:'Lucas',modalidades:[{id:1,nome:'Natação'},{id:3,nome:'Tênis'}]}];
  const html=render(dialog.default,{students,initialPeriod:period,generate:async()=>({}),onClose(){}});
  assert.match(html,/Escolha o aluno e o período do relatório de performance em PDF/);
  assert.match(html,/<label for="report-student">Aluno<\/label>/);
  assert.match(html,/<option value="" disabled="" selected="">Selecione o aluno<\/option><option value="a1">Yasmin<\/option><option value="a2">Lucas<\/option>/);
  assert.doesNotMatch(html,/report-sport/,'a modalidade depende do aluno escolhido');
});

test('US16_cenario1_menu_do_personal_com_um_aluno_ja_o_seleciona',()=>{
  const html=render(dialog.default,{students:[{id:'a2',nome:'Lucas',modalidades:[{id:1,nome:'Natação'},{id:3,nome:'Tênis'}]}],initialPeriod:period,generate:async()=>({}),onClose(){}});
  assert.match(html,/<option value="a2" selected="">Lucas<\/option>/);
  assert.match(html,/<option value="3">Tênis<\/option>/,'mostra as modalidades do aluno selecionado');
});

test('US16_cenario1_menu_do_personal_sem_alunos_explica_o_motivo',()=>{
  const html=render(dialog.default,{students:[],initialPeriod:period,generate:async()=>({}),onClose(){}});
  assert.match(html,/Nenhum aluno ativo ou inativo para gerar relatório\./);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import axios from 'axios';
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
  assert.match(render(dialog.ReportNoDataDialog,{period:{...period,datas:['2026-01-05','2026-01-20']},suggested,onBack(){},onUseSuggested(){},onClose(){}}),/01\/01\/2026 a 31\/01\/2026 \(2 datas\)/);
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

const sport=(id,nome,datas,metricas=[],datasRpe=[])=>({modalidadeId:id,modalidade:nome,dataInicio:datas[0],dataFim:datas[datas.length-1],totalSessoes:datas.length,datas,datasRpe,metricas});
const metric=(id,titulo,datas,extra={})=>({metricaId:id,titulo,tipo:'NUMERICO',descontinuada:false,statusMetrica:'ATIVA',totalRegistros:datas.length,datas,...extra});
const availability={dataInicio:'2026-01-12',dataFim:'2026-05-04',totalSessoes:5,modalidades:[
  sport(1,'Natação',['2026-03-02','2026-03-10','2026-05-04'],[metric('m1','Distância',['2026-03-02','2026-03-10','2026-05-04']),metric('m2','Tempo',['2026-03-02','2026-05-04']),metric('m3','Braçadas',['2026-03-02'],{descontinuada:true,statusMetrica:'métrica descontinuada'})],['2026-03-02']),
  sport(3,'Tênis',['2026-01-12'],[metric('m4','Saques',['2026-01-12'])]),
]};
const march={dataInicio:'2026-03-01',dataFim:'2026-03-31'};
const allContents=['RESUMO','GRAFICOS','RPE','SESSOES','VALORES'];
const selection=(extra={})=>({excludedMetrics:[],contents:allContents,...extra});

test('US16_disponibilidade_busca_nos_endpoints_do_personal_e_do_aluno',async()=>{
  const urls=[];
  const {relatorioService}=load('services/relatorioService.ts',{'./api':{api:{get:async(url,options)=>{urls.push([url,options]);return {data:availability};}}},'../features/report/reportModel':model});
  const signal={};
  assert.equal(await relatorioService.disponibilidadePeloPersonal('aluno/1',signal),availability);
  assert.equal(await relatorioService.disponibilidadePeloAluno(signal),availability);
  assert.deepEqual(urls.map(([url])=>url),['/api/personal-trainers/alunos/aluno%2F1/relatorio/disponibilidade','/api/alunos/relatorio/disponibilidade']);
  assert.equal(urls[0][1].signal,signal);
});

test('US16_personalizacao_listas_vao_no_formato_lido_pelo_spring',async()=>{
  let request;
  const {relatorioService}=load('services/relatorioService.ts',{'./api':{api:{get:async(...args)=>{request=args;return {data:'pdf',headers:{}};}}},'../features/report/reportModel':model});
  await relatorioService.gerarPeloAluno({...march,datas:['2026-03-02','2026-03-10'],metricaIds:['m1','m2'],conteudos:['RESUMO','VALORES']});
  const uri=axios.getUri({url:request[0],params:request[1].params,paramsSerializer:request[1].paramsSerializer});
  assert.equal(uri,'/api/alunos/relatorio?dataInicio=2026-03-01&dataFim=2026-03-31&datas=2026-03-02&datas=2026-03-10&metricaIds=m1&metricaIds=m2&conteudos=RESUMO&conteudos=VALORES');
});

test('US16_disponibilidade_datas_por_modalidade_e_no_periodo',()=>{
  assert.deepEqual([...model.reportDates(availability)],['2026-01-12','2026-03-02','2026-03-10','2026-05-04']);
  assert.deepEqual([...model.reportDates(availability,3)],['2026-01-12']);
  assert.deepEqual([...model.reportDatesInPeriod(model.reportDates(availability),march)],['2026-03-02','2026-03-10']);
  assert.deepEqual([...model.reportDatesInPeriod(model.reportDates(availability),{dataInicio:'',dataFim:'2026-03-31'})],[]);
  assert.deepEqual({...model.reportFullPeriod(model.reportDates(availability))},{dataInicio:'2026-01-12',dataFim:'2026-05-04'});
  assert.equal(model.reportFullPeriod([]),null);
});

test('US16_disponibilidade_agrupa_por_mes_do_mais_recente',()=>{
  const months=model.reportMonths(model.reportDates(availability));
  assert.deepEqual([...months.map(month=>month.label)],['mai/2026','mar/2026','jan/2026']);
  assert.deepEqual([...months[1].dates],['2026-03-02','2026-03-10']);
});

test('US16_datas_marcar_varios_meses_e_dias_sem_perder_os_anteriores',()=>{
  const dates=model.reportDates(availability);
  const empty={dataInicio:'2026-07-01',dataFim:'2026-07-31'};
  const jan=model.reportToggleDates(dates,empty,['2026-01-12']);
  assert.deepEqual({...jan},{dataInicio:'2026-01-12',dataFim:'2026-01-12'});
  const janMay=model.reportToggleDates(dates,jan,['2026-05-04']);
  assert.deepEqual([...janMay.datas],['2026-01-12','2026-05-04'],'março fica de fora mesmo estando entre as datas');
  assert.equal(janMay.dataInicio,'2026-01-12');assert.equal(janMay.dataFim,'2026-05-04');
  const plusDay=model.reportToggleDates(dates,janMay,['2026-03-02']);
  assert.deepEqual([...model.reportDatesInPeriod(dates,plusDay)],['2026-01-12','2026-03-02','2026-05-04']);
});

test('US16_datas_clicar_de_novo_desmarca_dia_e_mes',()=>{
  const dates=model.reportDates(availability);
  const all={dataInicio:'2026-01-12',dataFim:'2026-05-04'};
  const noDay=model.reportToggleDates(dates,all,['2026-03-10']);
  assert.deepEqual([...noDay.datas],['2026-01-12','2026-03-02','2026-05-04']);
  const noMonth=model.reportToggleDates(dates,noDay,['2026-03-02','2026-03-10']);
  assert.equal(noMonth.datas,undefined,'mês parcial é completado, e a seleção volta a ser contínua');
  const withoutMarch=model.reportToggleDates(dates,noMonth,['2026-03-02','2026-03-10']);
  assert.deepEqual([...withoutMarch.datas],['2026-01-12','2026-05-04']);
});

test('US16_datas_selecao_continua_nao_envia_a_lista',()=>{
  const dates=model.reportDates(availability);
  assert.deepEqual({...model.reportPeriodFromDates(dates,['2026-03-10','2026-03-02'],march)},{dataInicio:'2026-03-02',dataFim:'2026-03-10'});
  assert.deepEqual({...model.reportPeriodFromDates(dates,['2026-03-02','2026-03-02','2026-05-04','2026-03-10'],march)},{dataInicio:'2026-03-02',dataFim:'2026-05-04'});
});

test('US16_datas_desmarcar_tudo_exige_nova_selecao',()=>{
  const dates=model.reportDates(availability);
  const none=model.reportToggleDates(dates,{dataInicio:'2026-01-12',dataFim:'2026-01-12'},['2026-01-12']);
  assert.deepEqual([...none.datas],[]);
  assert.equal(model.reportPeriodError(none),model.REPORT_NO_DATES_MESSAGE);
  assert.deepEqual([...model.reportDatesInPeriod(dates,none)],[]);
});

test('US16_datas_marcadas_filtram_metricas_e_vao_no_filtro',()=>{
  const period={dataInicio:'2026-03-02',dataFim:'2026-05-04',datas:['2026-03-10','2026-05-04']};
  const groups=model.reportMetricsInPeriod(availability,1,period);
  assert.deepEqual(groups[0].metricas.map(item=>`${item.titulo}:${item.datas.length}`).join(),'Distância:2,Tempo:1');
  assert.deepEqual([...model.buildReportFilter(period,selection({modalidadeId:1}),availability).datas],['2026-03-10','2026-05-04']);
});

test('US16_personalizacao_lista_so_as_metricas_com_registros_no_periodo',()=>{
  const groups=model.reportMetricsInPeriod(availability,undefined,{dataInicio:'2026-03-05',dataFim:'2026-05-31'});
  assert.deepEqual([...groups.map(group=>group.modalidade)],['Natação']);
  assert.deepEqual(groups[0].metricas.map(item=>`${item.titulo}:${item.datas.length}`).join(),'Distância:2,Tempo:1');
  assert.equal(model.reportMetricsInPeriod(availability,3,march).length,0);
});

test('US16_personalizacao_sem_escolhas_gera_o_relatorio_completo',()=>{
  assert.deepEqual({...model.buildReportFilter(march,selection(),availability)},march);
  assert.deepEqual({...model.buildReportFilter(march,selection({modalidadeId:1}),availability)},{...march,modalidadeId:1});
  assert.deepEqual({...model.buildReportFilter(march,selection(),null)},march,'sem disponibilidade o relatório continua disponível');
});

test('US16_personalizacao_envia_apenas_o_que_foi_desmarcado_de_verdade',()=>{
  assert.deepEqual([...model.buildReportFilter(march,selection({excludedMetrics:['m2']}),availability).metricaIds],['m1','m3']);
  assert.equal(model.buildReportFilter({dataInicio:'2026-03-05',dataFim:'2026-03-31'},selection({excludedMetrics:['m2']}),availability).metricaIds,undefined,'métrica desmarcada fora do período não restringe o relatório');
  assert.deepEqual([...model.buildReportFilter(march,selection({contents:['VALORES','RESUMO']}),availability).conteudos],['RESUMO','VALORES']);
});

test('US16_personalizacao_sem_metricas_marcadas_tira_graficos_e_valores',()=>{
  const filter=model.buildReportFilter(march,selection({excludedMetrics:['m1','m2','m3']}),availability);
  assert.equal(filter.metricaIds,undefined,'lista vazia significaria todas as métricas no back-end');
  assert.deepEqual([...filter.conteudos],['RESUMO','RPE','SESSOES']);
  assert.deepEqual([...model.buildReportFilter(march,selection({excludedMetrics:['m1','m2','m3'],contents:['VALORES']}),availability).conteudos],[]);
  assert.deepEqual([...model.buildReportFilter(march,selection({contents:[]}),availability).conteudos],[]);
});

test('US16_disponibilidade_mostra_as_datas_e_destaca_as_do_periodo',()=>{
  const html=render(dialog.ReportAvailabilityPanel,{state:{status:'ready',data:availability},period:march,disabled:false,onPeriod(){},onRetry(){}});
  assert.match(html,/Datas com registros/);
  assert.match(html,/2 de 4 datas selecionadas/);
  assert.match(html,/aria-pressed="true"[^>]*>mar\/2026<\/button>/);
  assert.match(html,/aria-label="02\/03\/2026" aria-pressed="true"[^>]*>02<\/button>/);
  assert.match(html,/aria-label="12\/01\/2026" aria-pressed="false"[^>]*>12<\/button>/);
  assert.doesNotMatch(html,/Nenhum registro no período selecionado/);
});

test('US16_disponibilidade_respeita_a_modalidade_e_avisa_periodo_vazio',()=>{
  const html=render(dialog.ReportAvailabilityPanel,{state:{status:'ready',data:availability},modalidadeId:3,period:march,disabled:false,onPeriod(){},onRetry(){}});
  assert.match(html,/0 de 1 data selecionada/);
  assert.match(html,/Nenhum registro no período selecionado\./);
  assert.doesNotMatch(html,/mar\/2026/);
});

test('US16_datas_botoes_marcam_todas_limpam_e_alternam_mes_e_dia',()=>{
  const calls=[];
  const tree=dialog.ReportAvailabilityPanel({state:{status:'ready',data:availability},period:march,disabled:false,onPeriod:value=>calls.push({...value}),onRetry(){}});
  findByText(tree,'Marcar todas').props.onClick();
  findByText(tree,'Limpar').props.onClick();
  findByText(tree,'jan/2026').props.onClick();
  findByText(tree,'12').props.onClick();
  assert.deepEqual(calls.slice(0,1),[{dataInicio:'2026-01-12',dataFim:'2026-05-04'}]);
  assert.deepEqual([...calls[1].datas],[]);
  assert.deepEqual({...calls[2]},{dataInicio:'2026-01-12',dataFim:'2026-03-10'},'janeiro entra sem perder março');
  assert.equal(calls[3].dataInicio,'2026-01-12');
});

test('US16_datas_mes_parcial_e_nada_selecionado_aparecem_no_painel',()=>{
  const partial={dataInicio:'2026-03-02',dataFim:'2026-05-04',datas:['2026-03-02','2026-05-04']};
  const html=render(dialog.ReportAvailabilityPanel,{state:{status:'ready',data:availability},period:partial,disabled:false,onPeriod(){},onRetry(){}});
  assert.match(html,/aria-pressed="mixed"[^>]*>mar\/2026<\/button>/);
  assert.match(html,/aria-pressed="true"[^>]*>mai\/2026<\/button>/);
  assert.match(html,/aria-label="10\/03\/2026" aria-pressed="false"/);
  assert.match(html,/2 de 4 datas selecionadas/);
  const none=render(dialog.ReportAvailabilityPanel,{state:{status:'ready',data:availability},period:{...march,datas:[]},disabled:false,onPeriod(){},onRetry(){}});
  assert.match(none,/Nenhuma data selecionada\./);assert.doesNotMatch(none,/Nenhum registro no período/);
});

test('US16_disponibilidade_carregando_com_falha_e_sem_registros',()=>{
  const panel=state=>render(dialog.ReportAvailabilityPanel,{state,period:march,disabled:false,onPeriod(){},onRetry(){}});
  assert.equal(panel({status:'idle'}),'');
  assert.match(panel({status:'loading'}),/role="status"[^>]*>Buscando as datas com registros/);
  assert.match(panel({status:'error'}),/role="alert"/);assert.match(panel({status:'error'}),/>Tentar novamente<\/button>/);
  assert.match(panel({status:'ready',data:{dataInicio:null,dataFim:null,totalSessoes:0,modalidades:[]}}),/Ainda não há registros de desempenho para gerar o relatório\./);
});

test('US16_personalizacao_mostra_blocos_metricas_e_descontinuada',()=>{
  const groups=model.reportMetricsInPeriod(availability,undefined,{dataInicio:'2026-01-01',dataFim:'2026-03-31'});
  const html=render(dialog.ReportContentFields,{groups,showMetrics:true,excludedMetrics:[],contents:allContents,custom:false,disabled:false,onToggleMetric(){},onToggleAllMetrics(){},onToggleContent(){}});
  assert.match(html,/Personalizar conteúdo <span>Relatório completo<\/span>/);
  for(const label of ['Resumo do período','Gráficos das métricas','Nível de esforço \\(RPE\\)','Lista de sessões','Valores registrados','Distância','Saques'])assert.match(html,new RegExp(`<span>${label}</span>`));
  assert.match(html,/<h3>Natação<\/h3>/);assert.match(html,/<h3>Tênis<\/h3>/);
  assert.match(html,/métrica descontinuada/);assert.match(html,/2 datas/);
  assert.match(html,/Modalidades sem métrica marcada ficam fora do relatório\./);
  assert.match(html,/>Desmarcar todas<\/button>/);
});

test('US16_personalizacao_sem_metricas_marcadas_bloqueia_graficos_e_valores',()=>{
  const groups=model.reportMetricsInPeriod(availability,1,march);
  const html=render(dialog.ReportContentFields,{groups,showMetrics:true,excludedMetrics:['m1','m2','m3'],contents:allContents,custom:true,disabled:false,onToggleMetric(){},onToggleAllMetrics(){},onToggleContent(){}});
  assert.match(html,/<span>Relatório personalizado<\/span>/);
  assert.match(html,/>Marcar todas<\/button>/);
  assert.match(html,/<input disabled=""[^>]*type="checkbox"\/><span>Gráficos das métricas/);
  assert.match(html,/<input disabled=""[^>]*type="checkbox"\/><span>Valores registrados/);
  assert.match(html,/<input[^>]*type="checkbox" checked=""\/><span>Resumo do período/);
});

test('US16_personalizacao_periodo_sem_metricas_ou_disponibilidade_indisponivel',()=>{
  const props={excludedMetrics:[],contents:allContents,custom:false,disabled:false,onToggleMetric(){},onToggleAllMetrics(){},onToggleContent(){}};
  assert.match(render(dialog.ReportContentFields,{...props,groups:[],showMetrics:true}),/Nenhuma métrica registrada no período selecionado\./);
  const html=render(dialog.ReportContentFields,{...props,groups:[],showMetrics:false});
  assert.match(html,/Resumo do período/);assert.doesNotMatch(html,/Métricas do período/);
});

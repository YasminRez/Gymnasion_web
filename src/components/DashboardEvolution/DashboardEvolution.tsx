import { useState } from "react";
import DashboardPanel from "../DashboardPanel/DashboardPanel";
import { usePersonal } from "../../features/personal/PersonalContext";
import { displayDate, rpeSeries } from "../../features/personal/dashboardModel";
import "./DashboardEvolution.css";

export default function DashboardEvolution() {
  const {histories} = usePersonal();
  const [days,setDays] = useState(30);
  const data = rpeSeries(histories.data,days);
  const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate()-days+1);
  const points = data.map(item=>({...item,x:40+(new Date(item.date+"T00:00:00").getTime()-start.getTime())/(86400000*(days-1))*540,y:200-item.value*17}));
  return <DashboardPanel title="Evolução dos alunos" subtitle="Percepção de esforço (RPE médio por dia)" className="dashboard-evolution">
    <div className="dashboard-evolution__controls" aria-label="Período da evolução">{[7,30,90].map(value=><button key={value} aria-pressed={value===days} onClick={()=>setDays(value)}>{value} dias</button>)}</div>
    {histories.loading || histories.error || !data.length ? <div className="dashboard-v2__chart"><img src="/design-system/imgIconChart.svg" alt=""/><strong>{histories.loading?"Carregando evolução":histories.error?"Evolução indisponível":"Ainda sem registros neste período"}</strong><p>{histories.error || (!histories.loading ? "As sessões concluídas com RPE informado aparecerão aqui." : "Consultando as sessões dos seus alunos.")}</p></div> : <>
      <div className="dashboard-evolution__legend"><span/>RPE médio · escala de 0 a 10</div>
      <svg viewBox="0 0 620 230" role="img" aria-label={"RPE médio por dia nos últimos "+days+" dias. Valores disponíveis na tabela abaixo."}>
        {[0,5,10].map(value=><g key={value}><line x1="40" x2="580" y1={200-value*17} y2={200-value*17} stroke="var(--color-border)" strokeDasharray="4 5"/><text x="10" y={204-value*17}>{value}</text></g>)}
        <polyline points={points.map(item=>item.x+","+item.y).join(" ")} fill="none" stroke="var(--color-primary-500)" strokeWidth="2.5"/>
        {points.map(item=><circle key={item.date} cx={item.x} cy={item.y} r="4" fill="var(--color-surface)" stroke="var(--color-primary-500)" strokeWidth="2"><title>{displayDate(item.date)+": "+item.value.toFixed(1)+" RPE · "+item.count+" sessões"}</title></circle>)}
        <text x="40" y="225">{days} dias atrás</text><text x="580" y="225" textAnchor="end">Hoje</text>
      </svg>
      <details><summary>Ver valores do gráfico</summary><table><thead><tr><th>Data</th><th>RPE médio</th><th>Sessões</th></tr></thead><tbody>{data.map(item=><tr key={item.date}><td>{displayDate(item.date)}</td><td>{item.value.toFixed(1)}</td><td>{item.count}</td></tr>)}</tbody></table></details>
    </>}
  </DashboardPanel>;
}

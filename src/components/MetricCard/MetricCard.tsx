import type { Metric } from "../../pages/Metrics/metricData";
import "./MetricCard.css";
function MetricCard({ metric, onEdit, onDelete }: { metric: Metric; onEdit: () => void; onDelete: () => void }) {
  return <article className={`metric-card${metric.discontinued ? " metric-card--discontinued" : ""}`}>
    <span className="metric-card__sport">{metric.sport}</span><h3>{metric.title}</h3><p>{metric.type}</p>
    <p className="metric-card__count">{metric.studentCount} {metric.studentCount === 1 ? "aluno com registros" : "alunos com registros"}</p>
    {metric.discontinued ? <span className="metric-card__archived">Métrica descontinuada · Histórico preservado</span> : <div className="metric-card__actions"><button type="button" onClick={onEdit} aria-label={`Editar ${metric.title}`}>Editar</button><button type="button" onClick={onDelete} aria-label={`Excluir ${metric.title}`}>Excluir</button></div>}
  </article>;
}
export default MetricCard;

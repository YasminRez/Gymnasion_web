import { useState } from "react";
import toast from "react-hot-toast";
import MetricDialog from "../MetricDialog/MetricDialog";
import { metricSports, metricTypes, validateMetric, type Metric, type MetricValues } from "../../pages/Metrics/metricData";
import "./MetricForm.css";
function MetricForm({ metric, metrics, onSave, onClose }: { metric?: Metric; metrics: Metric[]; onSave: (values: MetricValues) => void; onClose: () => void }) {
  const [title, setTitle] = useState(metric?.title ?? "");
  const [sport, setSport] = useState(metric?.sport ?? "");
  const [type, setType] = useState<MetricValues["type"] | "">(metric?.type ?? "");
  const [error, setError] = useState("");
  const locked = Boolean(metric?.studentCount);
  return <MetricDialog title={metric ? "Editar métrica" : "Criar Métrica"} onClose={onClose}>
    <form className="metric-form" noValidate onSubmit={(event) => {
      event.preventDefault();
      const values = { title: title.trim(), sport, type: type as MetricValues["type"] };
      const message = validateMetric(values, metrics, metric);
      setError(message);
      if (message) { toast.error(message); return; }
      onSave(values);
    }}>
      <label htmlFor="metric-sport">Modalidade *</label>
      <select id="metric-sport" value={sport} disabled={locked} required onChange={(event) => setSport(event.target.value)}><option value="">Selecionar modalidade</option>{metricSports.map((item) => <option key={item}>{item}</option>)}</select>
      <label htmlFor="metric-title">Título da métrica *</label>
      <input id="metric-title" autoFocus value={title} required maxLength={100} placeholder="Ex.: Ritmo 100m" onChange={(event) => setTitle(event.target.value)} />
      <label htmlFor="metric-type">Tipo de métrica *</label>
      <select id="metric-type" value={type} disabled={locked} required aria-describedby={locked ? "metric-history-warning" : undefined} onChange={(event) => setType(event.target.value as MetricValues["type"])}><option value="">Selecionar tipo</option>{metricTypes.map((item) => <option key={item}>{item}</option>)}</select>
      {locked && <p id="metric-history-warning" className="metric-form__warning">Não é possível alterar o tipo de uma métrica com histórico de registros. Crie uma nova métrica. Apenas o título pode ser editado.</p>}
      {type && <p>Formato de registro: {type === "Numérico" ? "valor numérico" : type === "Tempo/Cronômetro" ? "tempo em mm:ss" : type === "Frequência cardíaca" ? "batimentos por minuto (bpm)" : "texto livre / observações"}.</p>}
      {error && <p className="metric-form__error" role="alert">{error}</p>}
      <div className="metric-dialog__actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" className="metric-dialog__primary">{metric ? "Salvar" : "Criar Métrica"}</button></div>
    </form>
  </MetricDialog>;
}
export default MetricForm;

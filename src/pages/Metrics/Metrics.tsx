import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AccountSidebar from "../../components/AccountSidebar/AccountSidebar";
import PlatformHeader from "../../components/PlatformHeader/PlatformHeader";
import MetricCard from "../../components/MetricCard/MetricCard";
import MetricForm from "../../components/MetricForm/MetricForm";
import MetricDialog from "../../components/MetricDialog/MetricDialog";
import { initialMetrics, metricSports, metricTypes, type Metric, type MetricValues } from "./metricData";
import "../Dashboard/Dashboard.css";
import "./Metrics.css";
const storageKey = "gymnasion.metrics.demo.v1";
function loadMetrics(): Metric[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (Array.isArray(saved) && saved.every((m) => m && typeof m.id === "string" && typeof m.title === "string" && metricSports.includes(m.sport) && metricTypes.includes(m.type) && Number.isInteger(m.studentCount) && m.studentCount >= 0 && typeof m.discontinued === "boolean")) return saved;
  } catch { /* Usa os dados de demonstração quando o armazenamento não está disponível. */ }
  return initialMetrics;
}
function Metrics() {
  const [metrics, setMetrics] = useState(loadMetrics);
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState("active");
  const [form, setForm] = useState<Metric | "new" | null>(null);
  const [deleting, setDeleting] = useState<Metric | null>(null);
  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify(metrics)); } catch { /* As alterações continuam disponíveis em memória. */ } }, [metrics]);
  const visible = metrics.filter((m) => (!sport || m.sport === sport) && (status === "all" || m.discontinued === (status === "discontinued")));
  function save(values: MetricValues) {
    setMetrics((previous) => typeof form === "object" && form ? previous.map((m) => m.id === form.id ? { ...m, ...values } : m) : [...previous, { ...values, id: crypto.randomUUID(), studentCount: 0, discontinued: false }]);
    toast.success(form === "new" ? "Métrica criada com sucesso!" : "Métrica atualizada com sucesso!");
    setSport(values.sport); setStatus("active"); setForm(null);
  }
  function remove() {
    if (!deleting) return;
    setMetrics((previous) => deleting.studentCount > 0 ? previous.map((m) => m.id === deleting.id ? { ...m, discontinued: true } : m) : previous.filter((m) => m.id !== deleting.id));
    toast.success(deleting.studentCount > 0 ? "Métrica descontinuada. Histórico preservado." : "Métrica excluída com sucesso!"); setDeleting(null);
  }
  return <div className="dashboard"><AccountSidebar /><div className="dashboard__body"><PlatformHeader activePage="metrics" />
    <main className="metrics"><header className="metrics__heading"><div><h1>Minhas Métricas</h1><p>Personalize os dados de desempenho de cada modalidade.</p></div><button type="button" onClick={() => setForm("new")}>+ Criar Métrica</button></header>
      <div className="metrics__filters"><label>Modalidade<select value={sport} onChange={(e) => setSport(e.target.value)}><option value="">Todas as modalidades</option>{metricSports.map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="active">Ativas</option><option value="discontinued">Descontinuadas</option><option value="all">Todas</option></select></label><span>{visible.length} {visible.length === 1 ? "métrica" : "métricas"}</span></div>
      <div className="metrics__grid">{visible.map((metric) => <MetricCard key={metric.id} metric={metric} onEdit={() => setForm(metric)} onDelete={() => setDeleting(metric)} />)}</div>
      {!visible.length && <p className="metrics__empty">Nenhuma métrica encontrada neste filtro.</p>}
      <p className="metrics__demo">Demonstração do personal · Alterações salvas nesta aba. Integração com o servidor e registro de desempenho pendentes.</p>
    </main>
    {form && <MetricForm metric={form === "new" ? undefined : form} metrics={metrics} onSave={save} onClose={() => setForm(null)} />}
    {deleting && <MetricDialog title={deleting.studentCount ? "Descontinuar métrica?" : "Excluir métrica?"} onClose={() => setDeleting(null)}><p><strong>{deleting.title}</strong></p><p>{deleting.studentCount ? "Esta métrica deixará de estar disponível para novos registros. Os dados existentes serão preservados e identificados como métrica descontinuada." : "Esta métrica não possui registros associados e será removida permanentemente. Esta ação não pode ser desfeita."}</p><div className="metric-dialog__actions"><button type="button" autoFocus onClick={() => setDeleting(null)}>Cancelar</button><button type="button" className="metric-dialog__primary" onClick={remove}>{deleting.studentCount ? "Descontinuar" : "Excluir"}</button></div></MetricDialog>}
  </div></div>;
}
export default Metrics;

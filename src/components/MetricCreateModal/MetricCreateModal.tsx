import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import MetricDialog from "../MetricDialog/MetricDialog";
import { metricaService } from "../../services/metricaService";
import { handleApiError } from "../../utils/handleApiError";
import { metricTypeOptions } from "../../pages/Routines/routineData";
import type { MetricaResponseDTO, TipoMetrica } from "../../types/metric";
// Mesmo visual do formulário da tela de Métricas.
import "../MetricForm/MetricForm.css";
import "./MetricCreateModal.css";

type Props = { modality: { id: number; nome: string }; onClose: () => void; onCreated: (metric: MetricaResponseDTO) => void };

// Atalho da US-10 (Cenário 2) para a US-18: cria a métrica direto no servidor, já na modalidade da rotina.
function MetricCreateModal({ modality, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TipoMetrica | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = {
    title: !title.trim() ? "Informe o título da métrica." : "",
    type: !type ? "Selecione o tipo da métrica." : "",
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (errors.title || errors.type || !type) return;

    setSaving(true);
    try {
      const metric = await metricaService.criarMetrica({ modalidadeId: modality.id, titulo: title.trim(), tipo: type });
      toast.success("Métrica criada com sucesso!");
      onCreated(metric);
    } catch (err) {
      handleApiError(err, "Não foi possível criar a métrica.");
    } finally {
      setSaving(false);
    }
  }

  return <MetricDialog title="Criar Métrica" onClose={() => { if (!saving) onClose(); }}>
    <form className="metric-form metric-create" noValidate onSubmit={handleSubmit}>
      <label htmlFor="metric-create-sport">Modalidade</label>
      <input id="metric-create-sport" value={modality.nome} disabled />
      <label htmlFor="metric-create-title">Título da métrica *</label>
      <input id="metric-create-title" autoFocus value={title} maxLength={100} placeholder="Ex.: Ritmo 100m" aria-invalid={submitted && Boolean(errors.title)} aria-describedby={submitted && errors.title ? "metric-create-title-error" : undefined} onChange={(event) => setTitle(event.target.value)} />
      {submitted && errors.title && <p className="metric-create__error" id="metric-create-title-error">{errors.title}</p>}
      <label htmlFor="metric-create-type">Tipo de métrica *</label>
      <select id="metric-create-type" value={type} aria-invalid={submitted && Boolean(errors.type)} aria-describedby={submitted && errors.type ? "metric-create-type-error" : undefined} onChange={(event) => setType(event.target.value as TipoMetrica)}>
        <option value="">Selecionar tipo</option>
        {metricTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {submitted && errors.type && <p className="metric-create__error" id="metric-create-type-error">{errors.type}</p>}
      <div className="metric-dialog__actions">
        <button type="button" disabled={saving} onClick={onClose}>Cancelar</button>
        <button type="submit" className="metric-dialog__primary" disabled={saving} aria-busy={saving}>{saving ? "Salvando..." : "Criar Métrica"}</button>
      </div>
    </form>
  </MetricDialog>;
}

export default MetricCreateModal;

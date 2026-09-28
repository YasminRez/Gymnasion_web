import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import PlatformHeader from '../../components/PlatformHeader/PlatformHeader';
import MetricCard from '../../components/MetricCard/MetricCard';
import MetricDialog from '../../components/MetricDialog/MetricDialog';

import { metricaService } from '../../services/metricaService';
import { modalidadeService } from '../../services/modalidadeService';
import { MetricaResponseDTO, TipoMetrica } from '../../types/metric';
import { ModalidadeResponseDTO } from '../../types/modalidade';
import { handleApiError } from '../../utils/handleApiError';

import './Metrics.css';

export const Metrics: React.FC = () => {
  const [modalidades, setModalidades] = useState<ModalidadeResponseDTO[]>([]);
  const [selectedModalidadeId, setSelectedModalidadeId] = useState<number | null>(null);
  const [metricas, setMetricas] = useState<MetricaResponseDTO[]>([]);

  const [loadingModalidades, setLoadingModalidades] = useState<boolean>(true);
  const [loadingMetricas, setLoadingMetricas] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Controlo dos Modais
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingMetrica, setEditingMetrica] = useState<MetricaResponseDTO | null>(null);

  // 1. Carregar modalidades da API
  useEffect(() => {
    const fetchModalidades = async () => {
      try {
        setLoadingModalidades(true);
        const data = await modalidadeService.listarTodas();
        setModalidades(data);
        if (data.length > 0) {
          setSelectedModalidadeId(data[0].id);
        }
      } catch (err) {
        handleApiError(err);
      } finally {
        setLoadingModalidades(false);
      }
    };

    fetchModalidades();
  }, []);

  // 2. Procurar métricas da modalidade selecionada
  const fetchMetricas = useCallback(async () => {
    if (!selectedModalidadeId) return;

    try {
      setLoadingMetricas(true);
      const data = await metricaService.listarPorModalidade(selectedModalidadeId);
      setMetricas(data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoadingMetricas(false);
    }
  }, [selectedModalidadeId]);

  useEffect(() => {
    fetchMetricas();
  }, [fetchMetricas]);

  // 3. Cadastrar nova métrica
  const handleCreateMetrica = async (titulo: string, tipo: TipoMetrica) => {
    if (!selectedModalidadeId) return;

    try {
      setSubmitting(true);
      await metricaService.criarMetrica({
        modalidadeId: selectedModalidadeId,
        titulo,
        tipo,
      });
      toast.success('Métrica cadastrada com sucesso!');
      setIsCreateOpen(false);
      await fetchMetricas();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Editar métrica
  const handleUpdateMetrica = async (id: string, titulo: string, tipo: TipoMetrica) => {
    try {
      setSubmitting(true);
      await metricaService.atualizarMetrica(id, { titulo, tipo });
      toast.success('Métrica atualizada com sucesso!');
      setEditingMetrica(null);
      await fetchMetricas();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Excluir / Descontinuar métrica
  const handleDeleteMetrica = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir/descontinuar esta métrica?')) {
      return;
    }

    try {
      const res = await metricaService.excluirMetrica(id);
      toast.success(res.mensagem || 'Operação realizada com sucesso!');
      await fetchMetricas();
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <>
      <PlatformHeader />

      <main className="metrics">
        <header className="metrics__heading">
          <div>
            <h1>Métricas Personalizadas</h1>
            <p>Gerencie os indicadores e métricas de acompanhamento dos seus atletas.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            disabled={!selectedModalidadeId || loadingModalidades}
          >
            + Nova Métrica
          </button>
        </header>

        {/* Filtros de Modalidade */}
        <section className="metrics__filters">
          <div>
            <label htmlFor="modalidade-select">Modalidade Esportiva:</label>
            {loadingModalidades ? (
              <span>Carregando modalidades...</span>
            ) : (
              <select
                id="modalidade-select"
                value={selectedModalidadeId ?? ''}
                onChange={(e) => setSelectedModalidadeId(Number(e.target.value))}
              >
                {modalidades.map((modalidade) => (
                  <option key={modalidade.id} value={modalidade.id}>
                    {modalidade.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>

        {/* Grelha de Métricas ou Estado Vazio */}
        {loadingMetricas ? (
          <div className="metrics__empty">
            <p>Carregando métricas...</p>
          </div>
        ) : metricas.length === 0 ? (
          <div className="metrics__empty">
            <p>Nenhuma métrica cadastrada para esta modalidade.</p>
            <br />
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              disabled={!selectedModalidadeId}
            >
              Cadastrar primeira métrica
            </button>
          </div>
        ) : (
          <div className="metrics__grid">
            {metricas.map((metrica) => (
              <MetricCard
                key={metrica.id}
                metrica={metrica}
                onEdit={() => setEditingMetrica(metrica)}
                onDelete={() => handleDeleteMetrica(metrica.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal de Criação */}
      {isCreateOpen && (
        <MetricDialog
          title="Nova Métrica Personalizada"
          onClose={() => setIsCreateOpen(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const titulo = formData.get('titulo') as string;
              const tipo = formData.get('tipo') as TipoMetrica;
              handleCreateMetrica(titulo, tipo);
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="titulo-criar" style={{ display: 'block', marginBottom: '8px' }}>
                Título da Métrica
              </label>
              <input
                id="titulo-criar"
                name="titulo"
                type="text"
                placeholder="Ex: Carga Máxima Supino"
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="tipo-criar" style={{ display: 'block', marginBottom: '8px' }}>
                Tipo de Dado
              </label>
              <select id="tipo-criar" name="tipo" defaultValue="NUMERICO" style={{ width: '100%', padding: '8px' }}>
                <option value="NUMERICO">Numérico</option>
                <option value="TEMPO">Tempo</option>
                <option value="FREQUENCIA_CARDIACA">Frequência Cardíaca</option>
                <option value="TEXTO">Texto</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Criar Métrica'}
              </button>
            </div>
          </form>
        </MetricDialog>
      )}

      {/* Modal de Edição */}
      {editingMetrica && (
        <MetricDialog
          title="Editar Métrica"
          onClose={() => setEditingMetrica(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const titulo = formData.get('titulo') as string;
              const tipo = formData.get('tipo') as TipoMetrica;
              handleUpdateMetrica(editingMetrica.id, titulo, tipo);
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="titulo-editar" style={{ display: 'block', marginBottom: '8px' }}>
                Título da Métrica
              </label>
              <input
                id="titulo-editar"
                name="titulo"
                type="text"
                defaultValue={editingMetrica.titulo}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="tipo-editar" style={{ display: 'block', marginBottom: '8px' }}>
                Tipo de Dado
              </label>
              <select
                id="tipo-editar"
                name="tipo"
                defaultValue={editingMetrica.tipo}
                disabled={editingMetrica.quantidadeAlunosComRegistros > 0}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="NUMERICO">Numérico</option>
                <option value="TEMPO">Tempo</option>
                <option value="FREQUENCIA_CARDIACA">Frequência Cardíaca</option>
                <option value="TEXTO">Texto</option>
              </select>
              {editingMetrica.quantidadeAlunosComRegistros > 0 && (
                <small style={{ color: '#aaa', display: 'block', marginTop: '4px' }}>
                  O tipo não pode ser alterado pois já existem registros vinculados a esta métrica.
                </small>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setEditingMetrica(null)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </MetricDialog>
      )}
    </>
  );
};

export default Metrics;
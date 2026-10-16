import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { metricaService } from "../../services/metricaService";
import { modalidadeService } from "../../services/modalidadeService";
import type { MetricaResponseDTO } from "../../types/metric";
import type { ModalidadeResponseDTO } from "../../types/modalidade";
import { handleApiError } from "../../utils/handleApiError";
import {
  filterMetrics,
  getMetricStudentCount,
  getModalityBadgeStyle,
  getPreenchimentoLabel,
  isMetricActive,
  metricModalityCounts,
  normalizeTipo,
} from "../../features/metrics/metricModel";
import MetricFormModal from "../../components/MetricModal/MetricFormModal";
import MetricDeleteModal from "../../components/MetricModal/MetricDeleteModal";
import "./Metrics.css";

export const Metrics: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const modalityParam = searchParams.get("modalidadeId");
  const searchParam = searchParams.get("busca") || "";

  const [modalidades, setModalidades] = useState<ModalidadeResponseDTO[]>([]);
  const [selectedModalidadeId, setSelectedModalidadeId] = useState<number | null>(() => {
    return modalityParam ? Number(modalityParam) : null;
  });

  const [allMetrics, setAllMetrics] = useState<MetricaResponseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [metricToEdit, setMetricToEdit] = useState<MetricaResponseDTO | null>(null);
  const [metricToDelete, setMetricToDelete] = useState<MetricaResponseDTO | null>(null);

  // Carrega modalidades da API
  useEffect(() => {
    async function loadModalidades() {
      try {
        const data = await modalidadeService.listarTodas();
        setModalidades(data);
      } catch (err) {
        handleApiError(err);
      }
    }
    loadModalidades();
  }, []);

  // Carrega todas as métricas do personal
  const fetchAllMetrics = useCallback(async (currentModalities: ModalidadeResponseDTO[]) => {
    setLoading(true);
    try {
      // Tenta listar todas de uma vez via endpoint da API
      try {
        const list = await metricaService.listarTodas();
        if (list && list.length > 0) {
          // Garante preenchimento de nomeModalidade
          const enriched = list.map((m) => {
            if (!m.nomeModalidade) {
              const found = currentModalities.find((mod) => mod.id === m.modalidadeId);
              return { ...m, nomeModalidade: found?.nome || "Modalidade" };
            }
            return m;
          });
          setAllMetrics(enriched);
          return;
        }
      } catch {
        // Fallback: se o backend exigir modalidadeId
      }

      if (currentModalities.length > 0) {
        const results = await Promise.all(
          currentModalities.map(async (mod) => {
            try {
              const items = await metricaService.listarPorModalidade(mod.id);
              return items.map((item) => ({
                ...item,
                modalidadeId: mod.id,
                nomeModalidade: mod.nome,
              }));
            } catch {
              return [];
            }
          })
        );
        setAllMetrics(results.flat());
      } else {
        setAllMetrics([]);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (modalidades.length > 0) {
      fetchAllMetrics(modalidades);
    }
  }, [modalidades, fetchAllMetrics]);

  // Sincroniza com parâmetros de URL
  useEffect(() => {
    if (modalityParam) {
      setSelectedModalidadeId(Number(modalityParam));
    }
  }, [modalityParam]);

  function handleSelectTab(modId: number | null) {
    setSelectedModalidadeId(modId);
    const newParams = new URLSearchParams(searchParams);
    if (modId !== null) {
      newParams.set("modalidadeId", String(modId));
    } else {
      newParams.delete("modalidadeId");
    }
    setSearchParams(newParams, { replace: true });
  }

  // Filtragem da lista
  const visibleMetrics = filterMetrics(allMetrics, selectedModalidadeId, searchParam);
  const tabCounts = metricModalityCounts(allMetrics, modalidades, {
    activeModalityId: selectedModalidadeId,
  });

  // Callbacks de sucesso dos modais
  function handleMetricCreated(newMetric: MetricaResponseDTO) {
    setAllMetrics((prev) => [newMetric, ...prev]);
  }

  function handleMetricUpdated(updated: MetricaResponseDTO) {
    setAllMetrics((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
    );
  }

  function handleMetricDeleted(deletedId: string) {
    setAllMetrics((prev) =>
      prev.map((m) => {
        if (m.id === deletedId) {
          // Se tiver registros, marca como descontinuada visualmente
          if (getMetricStudentCount(m) > 0) {
            return { ...m, descontinuada: true, ativo: false };
          }
          return null;
        }
        return m;
      }).filter(Boolean) as MetricaResponseDTO[]
    );
  }

  return (
    <div className="metrics-page">
      {/* Toolbar: Modality Tabs & Create Button */}
      <div className="metrics-page__toolbar">
        <div className="metrics-page__tabs" role="tablist">
          {tabCounts.map((tab) => {
            const isActive = selectedModalidadeId === tab.id;
            return (
              <button
                key={tab.id ?? "todas"}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`metrics-page__tab-btn ${isActive ? "is-active" : ""}`}
                onClick={() => handleSelectTab(tab.id)}
              >
                <span>{tab.nome}</span>
                <span>·</span>
                <span>{tab.count}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="metrics-page__btn-create"
          onClick={() => setIsCreateOpen(true)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Criar métrica</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="metrics-page__banner">
        <div className="metrics-page__banner-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <p>
          Métricas ficam disponíveis no registro de sessões dos alunos da modalidade. Métricas com histórico não podem ter o tipo alterado nem ser apagadas — elas são marcadas como descontinuadas.
        </p>
      </div>

      {/* Table Card */}
      <div className="metrics-page__card">
        {loading ? (
          <div className="metrics-page__empty">
            <p>Carregando métricas...</p>
          </div>
        ) : visibleMetrics.length === 0 ? (
          <div className="metrics-page__empty">
            <div className="metrics-page__empty-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3>Nenhuma métrica encontrada</h3>
            <p>
              {selectedModalidadeId !== null
                ? "Não existem métricas cadastradas para a modalidade selecionada."
                : "Você ainda não possui métricas personalizadas cadastradas."}
            </p>
            <button
              type="button"
              className="metrics-page__btn-empty"
              onClick={() => setIsCreateOpen(true)}
            >
              + Criar métrica
            </button>
          </div>
        ) : (
          <table className="metrics-page__table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Tipo</th>
                <th>Modalidade</th>
                <th>Alunos c/ Registros</th>
                <th>Status</th>
                <th aria-label="Ações" className="metrics-page__col-actions" />
              </tr>
            </thead>
            <tbody>
              {visibleMetrics.map((metrica) => {
                const studentCount = getMetricStudentCount(metrica);
                const active = isMetricActive(metrica);
                const normTipo = normalizeTipo(metrica.tipo);
                const modalityName =
                  metrica.nomeModalidade ||
                  modalidades.find((m) => m.id === metrica.modalidadeId)?.nome ||
                  "Modalidade";
                const badgeStyle = getModalityBadgeStyle(modalityName);

                return (
                  <tr key={metrica.id}>
                    {/* MÉTRICA */}
                    <td className="metrics-page__col-metric">
                      <h3>{metrica.titulo}</h3>
                      <p>
                        {metrica.obrigatoria !== false ? "Obrigatória" : "Opcional"} · preenche:{" "}
                        {getPreenchimentoLabel(metrica.quemPreenche)}
                      </p>
                    </td>

                    {/* TIPO */}
                    <td>
                      <span className="metrics-page__type-badge">
                        {normTipo === "NUMERICO" ? (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="4" y1="9" x2="20" y2="9" />
                            <line x1="4" y1="15" x2="20" y2="15" />
                            <line x1="10" y1="3" x2="8" y2="21" />
                            <line x1="16" y1="3" x2="14" y2="21" />
                          </svg>
                        ) : normTipo === "TEMPO" ? (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        ) : normTipo === "FREQUENCIA_CARDIACA" ? (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        ) : (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="21" y1="10" x2="3" y2="10" />
                            <line x1="21" y1="6" x2="3" y2="6" />
                            <line x1="21" y1="14" x2="3" y2="14" />
                            <line x1="21" y1="18" x2="3" y2="18" />
                          </svg>
                        )}
                        <span>
                          {normTipo === "TEMPO"
                            ? "Tempo / Cronômetro"
                            : normTipo === "NUMERICO"
                            ? "Numérico"
                            : normTipo === "FREQUENCIA_CARDIACA"
                            ? "Frequência cardíaca"
                            : "Texto / Observação"}
                        </span>
                      </span>
                    </td>

                    {/* MODALIDADE */}
                    <td>
                      <span
                        className="metrics-page__modality-badge"
                        style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
                      >
                        <img src={badgeStyle.icon} alt="" />
                        <span>{modalityName}</span>
                      </span>
                    </td>

                    {/* ALUNOS C/ REGISTROS */}
                    <td>
                      <span className="metrics-page__students-cell">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>{studentCount} alunos</span>
                      </span>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`metrics-page__status-badge ${
                          active ? "is-active" : "is-discontinued"
                        }`}
                      >
                        <span className="metrics-page__status-dot" />
                        <span>{active ? "Ativa" : "Descontinuada"}</span>
                      </span>
                    </td>

                    {/* AÇÕES */}
                    <td className="metrics-page__col-actions">
                      <div className="metrics-page__actions-wrap">
                        <button
                          type="button"
                          className="metrics-page__action-btn"
                          aria-label={`Editar métrica ${metrica.titulo}`}
                          onClick={() => setMetricToEdit(metrica)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="metrics-page__action-btn metrics-page__action-btn--delete"
                          aria-label={`Excluir métrica ${metrica.titulo}`}
                          onClick={() => setMetricToDelete(metrica)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Criar Métrica */}
      <MetricFormModal
        mode="create"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        modalidades={modalidades}
        defaultModalidadeId={selectedModalidadeId}
        existingMetrics={allMetrics}
        onSuccess={handleMetricCreated}
      />

      {/* Modal Editar Métrica */}
      {metricToEdit && (
        <MetricFormModal
          mode="edit"
          isOpen={Boolean(metricToEdit)}
          onClose={() => setMetricToEdit(null)}
          modalidades={modalidades}
          existingMetrics={allMetrics}
          metricToEdit={metricToEdit}
          onSuccess={handleMetricUpdated}
        />
      )}

      {/* Modal Excluir/Descontinuar Métrica */}
      {metricToDelete && (
        <MetricDeleteModal
          metric={metricToDelete}
          isOpen={Boolean(metricToDelete)}
          onClose={() => setMetricToDelete(null)}
          onSuccess={handleMetricDeleted}
        />
      )}
    </div>
  );
};

export default Metrics;
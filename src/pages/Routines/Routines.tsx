import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { usePersonal } from "../../features/personal/PersonalContext";
import {
  extractProblemDetail,
  getAvatarColor,
  getModalityBadgeStyle,
  getStudentInitials,
  isRoutineActive,
  normalize,
  routineModalityCounts,
} from "../../features/routines/routineModel";
import { modalidadeService } from "../../services/modalidadeService";
import { rotinaService } from "../../services/rotinaService";
import RoutineAssignModal from "../../components/RoutineAssignModal/RoutineAssignModal";
import RoutineDeleteModal from "../../components/RoutineDeleteModal/RoutineDeleteModal";
import RoutineReuseModal from "../../components/RoutineReuseModal/RoutineReuseModal";
import type { Modalidade } from "../../types/modalidade";
import type { RotinaResponse } from "../../types/rotina";
import "./Routines.css";

export default function Routines() {
  const navigate = useNavigate();
  const { routines, students, groups, syncRoutine, refresh } = usePersonal();
  const [params, setParams] = useSearchParams();

  // Modalidades disponíveis
  const [modalities, setModalities] = useState<Modalidade[]>([]);

  // Filtros
  const [selectedModalityId, setSelectedModalityId] = useState<number | null>(() => {
    const p = params.get("modalidade");
    return p ? Number(p) : null;
  });

  const [search, setSearch] = useState(() => params.get("busca") || "");

  // Modais
  const [assigningRoutine, setAssigningRoutine] = useState<RotinaResponse | null>(null);
  const [deletingRoutine, setDeletingRoutine] = useState<RotinaResponse | null>(null);
  const [reusingRoutine, setReusingRoutine] = useState<RotinaResponse | null>(null);

  // Carrega catálogo de modalidades
  useEffect(() => {
    modalidadeService
      .listarTodas()
      .then((data) => {
        setModalities(data);
      })
      .catch(() => {
        // Fallback para modalidades encontradas nas rotinas
      });
  }, []);

  const routinesList = useMemo(() => {
    return Array.isArray(routines?.data) ? routines.data : [];
  }, [routines?.data]);

  // Modalidades consolidadas
  const allModalities = useMemo(() => {
    const map = new Map<number, { id: number; nome: string }>();
    for (const m of modalities) map.set(m.id, { id: m.id, nome: m.nome });
    for (const r of routinesList) {
      const id = r.modalidadeId ?? r.modalidade?.id;
      const nome = r.nomeModalidade || r.modalidade?.nome;
      if (id && nome && !map.has(id)) map.set(id, { id, nome });
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [modalities, routinesList]);

  // Contadores para as tabs de modalidades (Apenas esportes com rotinas cadastradas)
  const modalityTabs = useMemo(() => {
    return routineModalityCounts(routinesList, allModalities, {
      activeModalityId: selectedModalityId,
    });
  }, [routinesList, allModalities, selectedModalityId]);

  // Atualiza query params
  function handleSelectModality(id: number | null) {
    setSelectedModalityId(id);
    const next = new URLSearchParams(params);
    if (id !== null) next.set("modalidade", String(id));
    else next.delete("modalidade");
    setParams(next, { replace: true });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    const next = new URLSearchParams(params);
    if (value) next.set("busca", value);
    else next.delete("busca");
    setParams(next, { replace: true });
  }

  // Filtragem das rotinas
  const filteredRoutines = useMemo(() => {
    const query = normalize(search.trim());

    return routinesList.filter((r) => {
      // Filtro de modalidade
      if (selectedModalityId !== null) {
        const rModId = r.modalidadeId ?? r.modalidade?.id;
        if (rModId !== selectedModalityId) return false;
      }

      // Filtro de busca
      if (query) {
        const titleMatch = normalize(r.titulo).includes(query);
        const goalMatch = r.objetivos ? normalize(r.objetivos).includes(query) : false;
        const studentMatch = (r.alunos || []).some(
          (a) => a.nome && normalize(a.nome).includes(query)
        );
        const modalityMatch = normalize(
          r.nomeModalidade || r.modalidade?.nome || ""
        ).includes(query);
        if (!titleMatch && !goalMatch && !studentMatch && !modalityMatch) return false;
      }

      return true;
    });
  }, [routinesList, selectedModalityId, search]);

  // Confirmação de exclusão
  async function handleConfirmDelete() {
    if (!deletingRoutine) return;
    try {
      await rotinaService.excluir(deletingRoutine.id);
      toast.success(`Rotina “${deletingRoutine.titulo}” excluída com sucesso!`);
      setDeletingRoutine(null);
      await refresh();
    } catch (err: unknown) {
      const msg = extractProblemDetail(err, "Não foi possível excluir a rotina.");
      toast.error(msg);
    }
  }

  return (
    <div className="routines-page">
      {/* Barra de Ferramentas / Toolbar do Figma */}
      <div className="routines-page__toolbar">
        {/* Pills de Modalidades: Todas · 6, Natação · 2, Tênis · 2, Academia · 2 */}
        <div className="routines-page__tabs" role="tablist" aria-label="Filtrar por modalidade">
          {modalityTabs.map((tab) => {
            const isActive = selectedModalityId === tab.id;
            return (
              <button
                key={tab.id ?? "all"}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`routines-page__tab-btn ${isActive ? "is-active" : ""}`}
                onClick={() => handleSelectModality(tab.id)}
              >
                {tab.nome} · {tab.count}
              </button>
            );
          })}
        </div>

        {/* Busca e Botão Nova Rotina */}
        <div className="routines-page__actions">
          <div className="routines-page__search-wrap">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className="routines-page__search-input"
              placeholder="Buscar rotina..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Buscar rotina por título ou aluno"
            />
          </div>

          <button
            type="button"
            className="routines-page__btn-create"
            onClick={() => navigate("/rotinas/nova")}
          >
            + Nova rotina
          </button>
        </div>
      </div>

      {/* Tabela de Rotinas no Card Branco */}
      <div className="routines-page__card">
        {routines.loading ? (
          <div className="routines-page__empty-box">
            <p>Carregando rotinas de treino...</p>
          </div>
        ) : filteredRoutines.length === 0 ? (
          <div className="routines-page__empty-box">
            <h3>Nenhuma rotina encontrada</h3>
            <p>
              {search || selectedModalityId !== null
                ? "Nenhum resultado corresponde aos filtros aplicados."
                : "Você ainda não possui rotinas cadastradas."}
            </p>
            <button
              type="button"
              className="routines-page__btn-create"
              onClick={() => navigate("/rotinas/nova")}
            >
              + Criar primeira rotina
            </button>
          </div>
        ) : (
          <table className="routines-page__table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "32%" }}>
                  ROTINA
                </th>
                <th scope="col" style={{ width: "16%" }}>
                  MODALIDADE
                </th>
                <th scope="col" style={{ width: "16%" }}>
                  FREQUÊNCIA
                </th>
                <th scope="col" style={{ width: "16%" }}>
                  MÉTRICAS
                </th>
                <th scope="col" style={{ width: "12%" }}>
                  ALUNOS
                </th>
                <th scope="col" style={{ width: "8%", textAlign: "right" }}>
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutines.map((routine) => {
                const modName =
                  routine.nomeModalidade || routine.modalidade?.nome || "Geral";
                const badgeStyle = getModalityBadgeStyle(modName);
                const studentsList = routine.alunos || [];
                const metricsCount = routine.metricas?.length || 0;

                return (
                  <tr key={routine.id}>
                    {/* ROTINA */}
                    <td
                      className="routines-page__col-routine routines-page__col-routine--clickable"
                      onClick={() => navigate(`/rotinas/${routine.id}/planejamento`)}
                      title="Clique para planejar ou adicionar sessões a esta rotina"
                    >
                      <h3>{routine.titulo}</h3>
                      {routine.objetivos && <p title={routine.objetivos}>{routine.objetivos}</p>}
                    </td>

                    {/* MODALIDADE */}
                    <td>
                      <span
                        className="routines-page__modality-badge"
                        style={{
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.color,
                        }}
                      >
                        <img src={badgeStyle.icon} alt="" aria-hidden="true" />
                        {modName}
                      </span>
                    </td>

                    {/* FREQUÊNCIA */}
                    <td>
                      <span className="routines-page__freq-badge">
                        {routine.frequenciaSemanal}x / semana
                      </span>
                    </td>

                    {/* MÉTRICAS */}
                    <td>
                      <div className="routines-page__metrics-cell">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        <span>
                          {metricsCount} {metricsCount === 1 ? "métrica" : "métricas"}
                        </span>
                      </div>
                    </td>

                    {/* ALUNOS */}
                    <td>
                      {studentsList.length === 0 ? (
                        <span className="routines-page__student-avatar--empty">—</span>
                      ) : (
                        <div
                          className="routines-page__students-stack"
                          title={studentsList.map((s) => s.nome || "Aluno").join(", ")}
                        >
                          {studentsList.map((aluno, index) => {
                            const color = getAvatarColor(index);
                            return (
                              <div
                                key={aluno.id}
                                className="routines-page__student-avatar"
                                style={{
                                  backgroundColor: color.bg,
                                  color: color.text,
                                }}
                                title={aluno.nome || "Aluno"}
                              >
                                {getStudentInitials(aluno.nome || "Aluno")}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* AÇÕES: Planejar sessões, Vincular turma/alunos, Reutilizar, Editar, Excluir */}
                    <td>
                      <div className="routines-page__actions-cell">
                        {/* Botão Principal: Planejar / Adicionar sessão */}
                        <button
                          type="button"
                          className="routines-page__action-circle-btn routines-page__action-circle-btn--plan"
                          title="Planejar semanas / Adicionar sessão à rotina"
                          aria-label={`Planejar ou adicionar sessão à rotina ${routine.titulo}`}
                          onClick={() => navigate(`/rotinas/${routine.id}/planejamento`)}
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
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <line x1="12" y1="14" x2="12" y2="18" />
                            <line x1="10" y1="16" x2="14" y2="16" />
                          </svg>
                        </button>

                        {/* Botão 0: Vincular turma / alunos (apenas rotinas ativas) */}
                        {isRoutineActive(routine) && (
                          <button
                            type="button"
                            className="routines-page__action-circle-btn"
                            title="Vincular turma ou alunos à rotina"
                            aria-label={`Vincular turma ou alunos à rotina ${routine.titulo}`}
                            onClick={() => setAssigningRoutine(routine)}
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
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="8.5" cy="7" r="4" />
                              <line x1="20" y1="8" x2="20" y2="14" />
                              <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                          </button>
                        )}

                        {/* Botão 1: Reutilizar */}
                        <button
                          type="button"
                          className="routines-page__action-circle-btn"
                          title="Reutilizar rotina como modelo"
                          aria-label={`Reutilizar rotina ${routine.titulo}`}
                          onClick={() => setReusingRoutine(routine)}
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
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                          </svg>
                        </button>

                        {/* Botão 2: Editar */}
                        <button
                          type="button"
                          className="routines-page__action-circle-btn"
                          title="Editar rotina"
                          aria-label={`Editar rotina ${routine.titulo}`}
                          onClick={() => navigate(`/rotinas/${routine.id}/editar`)}
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
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        {/* Botão 3: Excluir */}
                        <button
                          type="button"
                          className="routines-page__action-circle-btn routines-page__action-circle-btn--delete"
                          title="Excluir rotina"
                          aria-label={`Excluir rotina ${routine.titulo}`}
                          onClick={() => setDeletingRoutine(routine)}
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

      {/* Modal de Vincular Turma / Alunos */}
      {assigningRoutine && (
        <RoutineAssignModal
          routine={assigningRoutine}
          students={students.data}
          routines={routines.data}
          groups={groups.data}
          onClose={() => setAssigningRoutine(null)}
          onAssigned={(updated) => {
            syncRoutine(updated);
            setAssigningRoutine(null);
            toast.success(`Vínculo atualizado na rotina “${updated.titulo}”!`, {
              id: "routine-assigned",
            });
            void refresh();
          }}
        />
      )}

      {/* Modal de Exclusão (Figma Screenshot 2) */}
      {deletingRoutine && (
        <RoutineDeleteModal
          routine={deletingRoutine}
          onClose={() => setDeletingRoutine(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Modal de Reutilizar como Modelo */}
      {reusingRoutine && (
        <RoutineReuseModal
          routine={reusingRoutine}
          students={students.data}
          routines={routines.data}
          onClose={() => setReusingRoutine(null)}
          onReused={(created) => {
            setReusingRoutine(null);
            toast.success(`Nova rotina “${created.titulo}” criada a partir do modelo!`);
            void refresh();
          }}
        />
      )}
    </div>
  );
}

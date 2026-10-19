import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { usePersonal } from "../../features/personal/PersonalContext";
import {
  eligibleStudentsForRoutine,
  extractProblemDetail,
  getAvatarColor,
  getStudentInitials,
  metricLabels,
  validateCreateRoutinePayload,
  WEEK_DAYS,
} from "../../features/routines/routineModel";
import { modalidadeService } from "../../services/modalidadeService";
import { metricaService } from "../../services/metricaService";
import { rotinaService } from "../../services/rotinaService";
import { turmaService } from "../../services/turmaService";
import type { Modalidade } from "../../types/modalidade";
import type { MetricaResponseDTO, TipoMetrica } from "../../types/metric";
import type { TurmaResponse } from "../../types/turma";
import type { RotinaResponse } from "../../types/rotina";
import "./NewRoutine.css";

export default function NewRoutine() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { routineId } = useParams<{ routineId?: string }>();
  const isEditMode = Boolean(routineId);
  const { students, routines, refresh } = usePersonal();

  // URL params para pré-preenchimento
  const initialStudentId = params.get("aluno") || "";
  const modelRoutineId = params.get("modelo") || "";
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Catálogo de modalidades e turmas
  const [modalities, setModalities] = useState<Modalidade[]>([]);
  const [turmas, setTurmas] = useState<TurmaResponse[]>([]);

  // Estados do formulário
  const [titulo, setTitulo] = useState("");
  const [modalidadeId, setModalidadeId] = useState<number | null>(null);
  const [frequenciaSemanal, setFrequenciaSemanal] = useState<number>(4);
  const [objetivos, setObjetivos] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedMetricIds, setSelectedMetricIds] = useState<Set<string>>(new Set());

  // Métricas da modalidade
  const [metrics, setMetrics] = useState<MetricaResponseDTO[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Turma switch
  const [sendToTurma, setSendToTurma] = useState(false);

  // Busca e dropdown de alunos
  const [studentSearch, setStudentSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Erros e Toast de validação (Screenshot 4)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationToast, setValidationToast] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Modal de escolher rotina como modelo
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Carrega modalidades
  useEffect(() => {
    modalidadeService
      .listarTodas()
      .then((data) => {
        setModalities(data);
        if (data.length > 0 && !routineId) {
          const natacao = data.find((m) =>
            m.nome.toLowerCase().includes("nata")
          );
          setModalidadeId((prev) => prev ?? (natacao ? natacao.id : data[0].id));
        }
      })
      .catch(() => {
        // Fallback para modalidades das rotinas
        const map = new Map<number, string>();
        for (const r of routines.data) {
          const id = r.modalidadeId ?? r.modalidade?.id;
          const nome = r.nomeModalidade || r.modalidade?.nome;
          if (id && nome && !map.has(id)) map.set(id, nome);
        }
        const fallback: Modalidade[] = Array.from(map.entries()).map(([id, nome]) => ({
          id,
          nome,
          descricao: "",
        }));
        setModalities(fallback);
        if (fallback.length > 0 && !routineId) {
          setModalidadeId((prev) => prev ?? fallback[0].id);
        }
      });
  }, [routines.data, routineId]);

  // Carrega turmas
  useEffect(() => {
    turmaService
      .listar()
      .then((data) => setTurmas(data))
      .catch(() => setTurmas([]));
  }, []);

  // Carrega dados da rotina para edição quando routineId está presente
  useEffect(() => {
    if (!routineId) return;
    let active = true;
    setLoadingEdit(true);

    rotinaService
      .buscarPorId(routineId)
      .then((routine) => {
        if (!active) return;
        setTitulo(routine.titulo || "");
        const modId = routine.modalidadeId ?? routine.modalidade?.id;
        if (modId) {
          setModalidadeId(Number(modId));
        }
        if (routine.frequenciaSemanal) {
          setFrequenciaSemanal(routine.frequenciaSemanal);
        }
        if (routine.objetivos) {
          setObjetivos(routine.objetivos);
        }
        if (routine.alunos && routine.alunos.length > 0) {
          setSelectedStudentIds(routine.alunos.map((a) => a.id));
        }
        if (routine.metricas && routine.metricas.length > 0) {
          setSelectedMetricIds(new Set(routine.metricas.map((m) => m.id)));
        }
      })
      .catch((err) => {
        if (!active) return;
        const msg = extractProblemDetail(err, "Não foi possível carregar os dados da rotina para edição.");
        toast.error(msg);
        navigate("/rotinas");
      })
      .finally(() => {
        if (active) setLoadingEdit(false);
      });

    return () => {
      active = false;
    };
  }, [routineId, navigate]);

  // Pré-seleciona aluno vindo por query param (?aluno=...)
  useEffect(() => {
    if (initialStudentId && !routineId) {
      const student = students.data.find(
        (s) => s.id === initialStudentId && s.status === "ATIVO"
      );
      if (student) {
        setSelectedStudentIds((prev) =>
          prev.includes(initialStudentId) ? prev : [...prev, student.id]
        );
        if (student.modalidades?.[0]?.id) {
          setModalidadeId((prev) => prev ?? student.modalidades[0].id);
        }
      }
    }
  }, [initialStudentId, students.data, routineId]);

  // Pré-preenche a partir de uma rotina modelo (?modelo=...)
  useEffect(() => {
    if (modelRoutineId && routines.data.length > 0 && !routineId) {
      const model = routines.data.find((r) => r.id === modelRoutineId);
      if (model) {
        applyRoutineAsModel(model);
      }
    }
  }, [modelRoutineId, routines.data, routineId]);

  // Carrega métricas sempre que a modalidade muda
  useEffect(() => {
    if (!modalidadeId) {
      setMetrics([]);
      return;
    }

    let isCurrent = true;
    setLoadingMetrics(true);

    metricaService
      .listarPorModalidade(modalidadeId)
      .then((data) => {
        if (!isCurrent) return;
        const active = (data || []).filter((m) => m.ativo);
        setMetrics(active);
        // Pré-seleciona as métricas encontradas (até 4) apenas se for criação
        if (!routineId) {
          if (active.length > 0) {
            setSelectedMetricIds(new Set(active.slice(0, 4).map((m) => m.id)));
          } else {
            setSelectedMetricIds(new Set());
          }
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        setMetrics([]);
        if (!routineId) setSelectedMetricIds(new Set());
      })
      .finally(() => {
        if (isCurrent) setLoadingMetrics(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [modalidadeId, routineId]);

  // Fecha dropdown de alunos ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Nome da modalidade selecionada
  const selectedModality = useMemo(() => {
    return modalities.find((m) => m.id === modalidadeId);
  }, [modalities, modalidadeId]);

  const selectedModalidadeNome = selectedModality?.nome || "a modalidade";

  // Alunos elegíveis para a modalidade
  const eligibleStudents = useMemo(() => {
    const studentsList = Array.isArray(students?.data) ? students.data : [];
    const routinesList = Array.isArray(routines?.data) ? routines.data : [];
    return eligibleStudentsForRoutine(
      studentsList,
      routinesList,
      routineId || undefined,
      modalidadeId
    );
  }, [students?.data, routines?.data, routineId, modalidadeId]);

  // Alunos elegíveis que ainda não foram selecionados
  const candidateStudents = useMemo(() => {
    return eligibleStudents.filter((s) => !selectedStudentIds.includes(s.id));
  }, [eligibleStudents, selectedStudentIds]);

  // Filtragem da busca no autocomplete
  const filteredCandidates = useMemo(() => {
    if (!studentSearch.trim()) return candidateStudents;
    const q = studentSearch.toLowerCase();
    return candidateStudents.filter((s) =>
      s.usuario.nome.toLowerCase().includes(q)
    );
  }, [candidateStudents, studentSearch]);

  // Turma da modalidade correspondente
  const modalityTurma = useMemo(() => {
    if (!modalidadeId) return null;
    return (
      turmas.find(
        (t) =>
          t.modalidadeId === modalidadeId ||
          t.nomeModalidade?.toLowerCase() ===
            selectedModalidadeNome.toLowerCase()
      ) || null
    );
  }, [turmas, modalidadeId, selectedModalidadeNome]);

  const turmaName = modalityTurma
    ? modalityTurma.nome
    : `${selectedModalidadeNome} Intermediário`;
  const turmaCount = modalityTurma?.alunos?.length ?? 6;

  // Toggle do envio para turma
  function handleToggleTurma() {
    const nextState = !sendToTurma;
    setSendToTurma(nextState);

    if (nextState) {
      // Adiciona todos os alunos elegíveis da turma
      let studentIdsToAdd: string[] = [];
      if (modalityTurma && modalityTurma.alunos) {
        const eligibleTurmaStudents = modalityTurma.alunos
          .map((a) => a.id)
          .filter((id) => eligibleStudents.some((es) => es.id === id));
        studentIdsToAdd = eligibleTurmaStudents;
      } else {
        // Se a turma mock/backend não tem lista de alunos, adiciona alunos elegíveis da modalidade
        studentIdsToAdd = eligibleStudents.map((s) => s.id);
      }

      setSelectedStudentIds((prev) => {
        const set = new Set([...prev, ...studentIdsToAdd]);
        return Array.from(set);
      });
      // Remove erro de aluno se existia
      if (errors.alunosIds) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.alunosIds;
          return next;
        });
      }
    }
  }

  // Adiciona aluno chip
  function handleSelectStudent(studentId: string) {
    if (!selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds((prev) => [...prev, studentId]);
    }
    setStudentSearch("");
    setDropdownOpen(false);
    if (errors.alunosIds) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.alunosIds;
        return next;
      });
    }
  }

  // Remove aluno chip
  function handleRemoveStudent(studentId: string) {
    setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
  }

  // Toggle de métrica
  function handleToggleMetric(metricId: string) {
    setSelectedMetricIds((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) next.delete(metricId);
      else next.add(metricId);
      return next;
    });
    if (errors.metricasIds) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.metricasIds;
        return next;
      });
    }
  }

  // Aplica uma rotina modelo
  function applyRoutineAsModel(routine: RotinaResponse) {
    setTitulo(routine.titulo);
    if (routine.modalidadeId ?? routine.modalidade?.id) {
      setModalidadeId(routine.modalidadeId ?? routine.modalidade?.id ?? null);
    }
    if (routine.frequenciaSemanal) {
      setFrequenciaSemanal(routine.frequenciaSemanal);
    }
    if (routine.objetivos) {
      setObjetivos(routine.objetivos);
    }
    if (routine.metricas && routine.metricas.length > 0) {
      setSelectedMetricIds(new Set(routine.metricas.map((m) => m.id)));
    }
    setModelModalOpen(false);
    toast.success(`Campos preenchidos com o modelo “${routine.titulo}”!`);
  }

  // Renderiza ícone por tipo de métrica
  function renderMetricIcon(tipo: TipoMetrica) {
    switch (tipo) {
      case "TEMPO":
        return (
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
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case "FREQUENCIA_CARDIACA":
        return (
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
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case "TEXTO":
        return (
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
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        );
      case "NUMERICO":
      default:
        return (
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
            <line x1="4" y1="9" x2="20" y2="9" />
            <line x1="4" y1="15" x2="20" y2="15" />
            <line x1="10" y1="3" x2="8" y2="21" />
            <line x1="16" y1="3" x2="14" y2="21" />
          </svg>
        );
    }
  }

  // Submissão do formulário
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      titulo,
      modalidadeId: modalidadeId ?? 0,
      frequenciaSemanal,
      objetivos,
      alunosIds: selectedStudentIds,
      metricasIds: Array.from(selectedMetricIds),
    };

    const validationErrors = validateCreateRoutinePayload(payload);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Se o erro for de aluno, mostra o toast exato do Figma (Screenshot 4)
      if (validationErrors.alunosIds) {
        setValidationToast({
          title: "Selecione os alunos",
          description: "É necessário selecionar pelo menos 1 (um) aluno.",
        });
      } else if (validationErrors.titulo) {
        setValidationToast({
          title: "Título obrigatório",
          description: validationErrors.titulo,
        });
      } else if (validationErrors.metricasIds) {
        setValidationToast({
          title: "Métricas necessárias",
          description: "Selecione ao menos uma métrica para a rotina.",
        });
      } else {
        setValidationToast({
          title: "Verifique os campos",
          description: "Preencha todos os campos obrigatórios para continuar.",
        });
      }
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode && routineId) {
        await rotinaService.atualizar(routineId, {
          titulo,
          frequenciaSemanal,
          objetivos,
          alunosIds: selectedStudentIds,
          metricasIds: Array.from(selectedMetricIds),
        });
        toast.success("Rotina de treino atualizada com sucesso!");
        await refresh();
        navigate(`/rotinas/${routineId}/planejamento`);
      } else {
        const created = await rotinaService.criar(payload);
        toast.success("Treino criado com sucesso!");
        await refresh();
        navigate(created?.id ? `/rotinas/${created.id}/planejamento` : "/rotinas");
      }
    } catch (err: unknown) {
      const msg = extractProblemDetail(
        err,
        isEditMode
          ? "Não foi possível atualizar a rotina. Tente novamente."
          : "Não foi possível criar a rotina. Tente novamente."
      );
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingEdit) {
    return (
      <div className="new-routine-page" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--color-text-secondary, #666)" }}>
        Carregando dados da rotina...
      </div>
    );
  }

  return (
    <div className="new-routine-page">
      {/* Toast Flutuante de Validação (Screenshot 4) */}
      {validationToast && (
        <div className="new-routine-toast" role="alert">
          <div className="new-routine-toast__icon-wrap">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="new-routine-toast__content">
            <strong>{validationToast.title}</strong>
            <p>{validationToast.description}</p>
          </div>
          <button
            type="button"
            className="new-routine-toast__close"
            onClick={() => setValidationToast(null)}
            aria-label="Fechar notificação"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="new-routine-page__grid">
          {/* COLUNA ESQUERDA: Card 1 e Card 3 */}
          <div className="new-routine-column-left">
            {/* CARD 1: Informações da rotina */}
            <div className="new-routine-card">
              <div className="new-routine-card__header">
                <div className="new-routine-card__titles">
                  <h2>1 · Informações da rotina</h2>
                  <p>
                    {isEditMode
                      ? "Defina título, frequência e objetivo"
                      : "Defina título, modalidade, frequência e objetivo"}
                  </p>
                </div>
                {!isEditMode && routines.data.length > 0 && (
                  <button
                    type="button"
                    className="new-routine-card__link-action"
                    onClick={() => setModelModalOpen(true)}
                  >
                    Usar rotina como modelo
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
                      <polyline points="9 14 4 9 9 4" />
                      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="new-routine-form-row">
                <div
                  className={`new-routine-field ${
                    errors.titulo ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="routine-title">Título da rotina</label>
                  <input
                    id="routine-title"
                    type="text"
                    placeholder="Ex: Resistência 1500m"
                    value={titulo}
                    onChange={(e) => {
                      setTitulo(e.target.value);
                      if (errors.titulo) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.titulo;
                          return next;
                        });
                      }
                    }}
                  />
                  {errors.titulo && (
                    <span className="new-routine-field__error">
                      {errors.titulo}
                    </span>
                  )}
                </div>

                <div
                  className={`new-routine-field ${
                    errors.modalidadeId ? "has-error" : ""
                  }`}
                >
                  <label htmlFor="routine-modality">Modalidade</label>
                  <select
                    id="routine-modality"
                    value={modalidadeId ?? ""}
                    disabled={isEditMode}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setModalidadeId(id || null);
                      setSelectedStudentIds([]);
                      setSendToTurma(false);
                      if (errors.modalidadeId) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.modalidadeId;
                          return next;
                        });
                      }
                    }}
                  >
                    <option value="" disabled>
                      Selecione uma modalidade
                    </option>
                    {modalities.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                  {isEditMode && (
                    <small style={{ display: "block", marginTop: "4px", color: "var(--color-text-secondary, #666)", fontSize: "12px" }}>
                      A modalidade não pode ser alterada na edição.
                    </small>
                  )}
                  {errors.modalidadeId && (
                    <span className="new-routine-field__error">
                      {errors.modalidadeId}
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`new-routine-field ${
                  errors.frequenciaSemanal ? "has-error" : ""
                }`}
              >
                <label>Frequência semanal</label>
                <div className="new-routine-frequency-group">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`new-routine-frequency-btn ${
                        frequenciaSemanal === day ? "is-active" : ""
                      }`}
                      onClick={() => {
                        setFrequenciaSemanal(day);
                        if (errors.frequenciaSemanal) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.frequenciaSemanal;
                            return next;
                          });
                        }
                      }}
                    >
                      {day}×
                    </button>
                  ))}
                </div>
                {errors.frequenciaSemanal && (
                  <span className="new-routine-field__error">
                    {errors.frequenciaSemanal}
                  </span>
                )}
              </div>

              <div
                className={`new-routine-field ${
                  errors.objetivos ? "has-error" : ""
                }`}
              >
                <label htmlFor="routine-goal">Objetivo</label>
                <textarea
                  id="routine-goal"
                  rows={4}
                  placeholder="Descreva o objetivo da rotina..."
                  value={objetivos}
                  onChange={(e) => {
                    setObjetivos(e.target.value);
                    if (errors.objetivos) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.objetivos;
                        return next;
                      });
                    }
                  }}
                />
                {errors.objetivos && (
                  <span className="new-routine-field__error">
                    {errors.objetivos}
                  </span>
                )}
              </div>
            </div>

            {/* CARD 3: Vincular alunos */}
            <div className="new-routine-card" style={{ marginTop: 24 }}>
              <div className="new-routine-card__header">
                <div className="new-routine-card__titles">
                  <h2>3 · Vincular alunos</h2>
                  <p>
                    Apenas alunos ativos de {selectedModalidadeNome} sem rotina
                    ativa aparecem aqui
                  </p>
                </div>
                <div className="new-routine-card__count-badge">
                  {selectedStudentIds.length} selecionados
                </div>
              </div>

              <div
                ref={dropdownRef}
                className={`new-routine-chips-box ${
                  errors.alunosIds ? "has-error" : ""
                }`}
                onClick={() => setDropdownOpen(true)}
              >
                {selectedStudentIds.map((id, index) => {
                  const student = students.data.find((s) => s.id === id);
                  const name = student?.usuario.nome || "Aluno";
                  const color = getAvatarColor(index);
                  return (
                    <span key={id} className="new-routine-chip">
                      <span
                        className="new-routine-chip__avatar"
                        style={{
                          backgroundColor: color.bg,
                          color: color.text,
                        }}
                      >
                        {getStudentInitials(name)}
                      </span>
                      {name}
                      <button
                        type="button"
                        className="new-routine-chip__remove"
                        aria-label={`Remover ${name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStudent(id);
                        }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}

                <input
                  type="text"
                  placeholder={
                    selectedStudentIds.length === 0
                      ? "Buscar aluno ou turma..."
                      : ""
                  }
                  value={studentSearch}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setDropdownOpen(true);
                  }}
                />

                {dropdownOpen && (
                  <div className="new-routine-dropdown">
                    {filteredCandidates.length === 0 ? (
                      <div className="new-routine-dropdown__empty">
                        {eligibleStudents.length === 0
                          ? `Nenhum aluno ativo em ${selectedModalidadeNome} disponível sem rotina.`
                          : "Nenhum aluno encontrado para a busca."}
                      </div>
                    ) : (
                      filteredCandidates.map((candidate, idx) => {
                        const color = getAvatarColor(idx);
                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            className="new-routine-dropdown__item"
                            onClick={() => handleSelectStudent(candidate.id)}
                          >
                            <span
                              className="new-routine-dropdown__avatar"
                              style={{
                                backgroundColor: color.bg,
                                color: color.text,
                              }}
                            >
                              {getStudentInitials(candidate.usuario.nome)}
                            </span>
                            <span className="new-routine-dropdown__name">
                              {candidate.usuario.nome}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              {errors.alunosIds && (
                <div className="new-routine-field__error">
                  {errors.alunosIds}
                </div>
              )}

              <div className="new-routine-turma-box">
                <div className="new-routine-turma-box__info">
                  <h3>Enviar também para uma turma</h3>
                  <p>
                    {turmaName} · {turmaCount} alunos
                  </p>
                </div>
                <label className="new-routine-toggle">
                  <input
                    type="checkbox"
                    checked={sendToTurma}
                    onChange={handleToggleTurma}
                  />
                  <span className="new-routine-toggle__slider" />
                </label>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Card 2 (Métricas acompanhadas) */}
          <div className="new-routine-column-right">
            <div className="new-routine-card new-routine-card--metrics">
              <div className="new-routine-card__header">
                <div className="new-routine-card__titles">
                  <h2>2 · Métricas acompanhadas</h2>
                  <p>Cadastradas para {selectedModalidadeNome}</p>
                </div>
                <Link to="/metricas" className="new-routine-card__manage-link">
                  Gerenciar →
                </Link>
              </div>

              {loadingMetrics ? (
                <div className="new-routine-metrics-loading">
                  Carregando métricas...
                </div>
              ) : metrics.length === 0 ? (
                /* Empty state quando a modalidade não tem métricas (Screenshot 5) */
                <div className="new-routine-empty-metrics">
                  <div className="new-routine-empty-metrics__icon-wrap">!</div>
                  <h3>Nenhuma métrica cadastrada para essa modalidade.</h3>
                  <p>Cadastre ao menos uma métrica antes de continuar.</p>
                  <button
                    type="button"
                    className="new-routine-empty-metrics__btn"
                    onClick={() =>
                      navigate(
                        modalidadeId
                          ? `/metricas?modalidadeId=${modalidadeId}`
                          : "/metricas"
                      )
                    }
                  >
                    + Cadastrar métrica
                  </button>
                </div>
              ) : (
                /* Lista de métricas cadastradas (Screenshot 3) */
                <div className="new-routine-metrics-list">
                  {metrics.map((item) => {
                    const isSelected = selectedMetricIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`new-routine-metric-card ${
                          isSelected ? "is-selected" : ""
                        }`}
                        onClick={() => handleToggleMetric(item.id)}
                      >
                        <div className="new-routine-metric-checkbox">
                          {isSelected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>

                        <div className="new-routine-metric-icon">
                          {renderMetricIcon(item.tipo)}
                        </div>

                        <div className="new-routine-metric-info">
                          <h4>{item.titulo}</h4>
                          <p>
                            {metricLabels[item.tipo] || item.tipo} · Obrigatória
                            · aluno
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé da Página: Cancelar e Criar */}
        <div className="new-routine-footer">
          <button
            type="button"
            className="new-routine-footer__btn-cancel"
            onClick={() => navigate("/rotinas")}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="new-routine-footer__btn-submit"
            disabled={submitting}
          >
            {submitting
              ? isEditMode
                ? "Salvando..."
                : "Criando..."
              : isEditMode
              ? "Salvar alterações"
              : "Criar e planejar semanas"}
          </button>
        </div>
      </form>

      {/* Modal para escolher modelo */}
      {modelModalOpen && (
        <div
          className="new-routine-model-modal-overlay"
          onClick={() => setModelModalOpen(false)}
        >
          <div
            className="new-routine-model-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="new-routine-model-modal__header">
              <h3>Selecione uma rotina existente como modelo</h3>
              <button
                type="button"
                className="new-routine-chip__remove"
                onClick={() => setModelModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="new-routine-model-modal__list">
              {routines.data.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="new-routine-model-modal__item"
                  onClick={() => applyRoutineAsModel(r)}
                >
                  <strong>{r.titulo}</strong>
                  <span>
                    {r.nomeModalidade} · {r.frequenciaSemanal}x/sem ·{" "}
                    {r.metricas?.length || 0} métricas
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

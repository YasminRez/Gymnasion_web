import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { alunoService } from "../../services/alunoService";
import { localDateKey } from "../personal/dashboardModel";
import { StudentContext, type StudentActiveRoutineInfo, type StudentIdentityInfo } from "./StudentContext";
import {
  applySessionExecution,
  buildWeekDaysSummary,
  countCompletedSessions,
  formatDiaSemanaPt,
  formatDataPlanejadaDdMm,
} from "./studentAreaModel";
import { parseAtividades } from "../../utils/activityParser";
import type {
  StudentFeedbackItem,
  StudentHistoricalRoutine,
  StudentRoutineWeek,
  StudentWorkoutSession,
} from "../../types/studentArea";
import type { PersonalNotification } from "../../types/personalDashboard";

export default function StudentProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRoutine, setActiveRoutine] = useState<StudentActiveRoutineInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [weeks, setWeeks] = useState<StudentRoutineWeek[]>([]);
  const [historicalRoutines, setHistoricalRoutines] = useState<StudentHistoricalRoutine[]>([]);
  const [feedbacks, setFeedbacks] = useState<StudentFeedbackItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [notifications, setNotifications] = useState<{
    data: PersonalNotification[];
    loading: boolean;
    error: string;
  }>({ data: [], loading: false, error: "" });
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get("busca") || "");
  const [rpeModalSessionId, setRpeModalSessionId] = useState<string | null>(() =>
    searchParams.get("modal") === "rpe" ? "w3-s3" : null
  );
  const [rpeBusy, setRpeBusy] = useState<boolean>(false);
  const [inspectedSession, setInspectedSession] = useState<StudentWorkoutSession | null>(null);
  const [inspectedRoutine, setInspectedRoutine] = useState<StudentHistoricalRoutine | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState<boolean>(false);

  const [student, setStudent] = useState<StudentIdentityInfo>({
    name: "Aluno",
    firstName: "Aluno",
    initials: "AL",
    roleLabel: "Aluno(a)",
    personal: {
      name: "Personal Trainer",
      initials: "PT",
      cref: "CREF Gymnasion",
    },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carrega dados do perfil real do aluno
      try {
        const perfil = await alunoService.obterMeuPerfil();
        if (perfil) {
          const fullName = perfil.usuario?.nome || "Aluno";
          const parts = fullName.trim().split(/\s+/);
          const first = parts[0] || fullName;
          const inits = [parts[0]?.[0], parts.length > 1 ? parts[parts.length - 1]?.[0] : ""]
            .filter(Boolean)
            .join("")
            .toUpperCase() || "AL";

          const pName = perfil.nomePersonal || "Personal Trainer";
          const pParts = pName.trim().split(/\s+/);
          const pInits = [pParts[0]?.[0], pParts.length > 1 ? pParts[pParts.length - 1]?.[0] : ""]
            .filter(Boolean)
            .join("")
            .toUpperCase() || "PT";

          setStudent({
            name: fullName,
            firstName: first,
            initials: inits,
            roleLabel: "Aluno(a)",
            personal: {
              name: pName,
              initials: pInits,
              cref: "CREF Gymnasion",
            },
          });
        }
      } catch {
        // Fallback gracioso
      }

      // 2. Carrega notificações e feedbacks
      alunoService.contagemNaoLidas().then((c) => setUnreadNotifications(c)).catch(() => {});
      alunoService
        .listarNotificacoes()
        .then((items) => {
          if (Array.isArray(items) && items.length > 0) {
            setNotifications({ data: items, loading: false, error: "" });
            setUnreadNotifications(items.filter((i) => !i.lida).length);
          } else {
            alunoService
              .listarFeedbacks()
              .then((fbs) => {
                if (Array.isArray(fbs) && fbs.length > 0) {
                  const synched: PersonalNotification[] = fbs.map((fb, idx) => ({
                    id: fb.id,
                    titulo: `Feedback de ${fb.autorNome || "Personal"}`,
                    mensagem: fb.conteudo,
                    tipo: "FEEDBACK",
                    lida: idx >= 2,
                    referenciaId: null,
                    dataCriacao: new Date().toISOString(),
                  }));
                  setNotifications({ data: synched, loading: false, error: "" });
                  setUnreadNotifications(synched.filter((i) => !i.lida).length);
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          alunoService
            .listarFeedbacks()
            .then((fbs) => {
              if (Array.isArray(fbs) && fbs.length > 0) {
                const synched: PersonalNotification[] = fbs.map((fb, idx) => ({
                  id: fb.id,
                  titulo: `Feedback de ${fb.autorNome || "Personal"}`,
                  mensagem: fb.conteudo,
                  tipo: "FEEDBACK",
                  lida: idx >= 2,
                  referenciaId: null,
                  dataCriacao: new Date().toISOString(),
                }));
                setNotifications({ data: synched, loading: false, error: "" });
                setUnreadNotifications(synched.filter((i) => !i.lida).length);
              }
            })
            .catch(() => {});
        });

      alunoService
        .listarFeedbacks()
        .then((items) => {
          if (Array.isArray(items)) {
            const mapped: StudentFeedbackItem[] = items.slice(0, 5).map((item, idx) => {
              const words = (item.autorNome || "Personal").trim().split(/\s+/);
              const inits = [words[0]?.[0], words.length > 1 ? words[words.length - 1]?.[0] : ""]
                .join("")
                .toUpperCase();
              return {
                id: item.id,
                autorNome: item.autorNome || "Personal",
                autorIniciais: inits || "PT",
                tempoRelativo: idx === 0 ? "recente" : "anterior",
                conteudo: item.conteudo,
                novo: idx < 2,
              };
            });
            setFeedbacks(mapped);
          }
        })
        .catch(() => {});

      // 3. Carrega rotinas reais do aluno
      const rotinas = await alunoService.listarRotinas();
      if (Array.isArray(rotinas) && rotinas.length > 0) {
        const rotinaAtiva = rotinas.find((r) => r.ativo) || rotinas[0];
        const rotinasEncerradas = rotinas.filter((r) => !r.ativo);

        setHistoricalRoutines(
          rotinasEncerradas.map((r) => ({
            id: r.id,
            titulo: r.titulo,
            periodo: `${r.frequenciaSemanal}x por semana`,
            semanas: 4,
            status: "ENCERRADA",
            modalidade: r.nomeModalidade || "Treino",
            objetivo: r.objetivos || "Sem objetivos cadastrados.",
            sessoesConcluidas: 0,
          }))
        );

        if (rotinaAtiva) {
          const plan = await alunoService.consultarPlanejamento(rotinaAtiva.id);
          const semanasBackend = plan.semanas || [];
          
          let numSemanaAtual = 1;
          if (semanasBackend.length > 0) {
            const semanaComPendente = semanasBackend.find((sem) =>
              (sem.sessoes || []).some(
                (s) =>
                  !s.concluidaAluno &&
                  !s.validadaPersonal &&
                  s.status !== "CONCLUIDA" &&
                  s.status !== "VALIDADA"
              )
            );
            numSemanaAtual = semanaComPendente
              ? semanaComPendente.numeroSemana
              : semanasBackend[semanasBackend.length - 1].numeroSemana;
          }
          setSelectedWeekNum(numSemanaAtual);

          setActiveRoutine({
            id: rotinaAtiva.id,
            titulo: rotinaAtiva.titulo,
            modalidade: rotinaAtiva.nomeModalidade || "Treino",
            frequenciaSemanal: rotinaAtiva.frequenciaSemanal || 3,
            objetivos: rotinaAtiva.objetivos || "Desenvolver resistência e capacidade física.",
            totalSemanas: Math.max(semanasBackend.length, numSemanaAtual),
            semanaAtual: numSemanaAtual,
            metricas: (rotinaAtiva.metricas || []).map((m) => ({
              id: m.id,
              titulo: m.titulo,
              tipo: m.tipo,
              obrigatoria: Boolean(m.obrigatoria),
              quemPreenche: m.quemPreenche || "ALUNO",
            })),
          });

          let highlightAssigned = false;
          const mappedWeeks: StudentRoutineWeek[] = semanasBackend.map((sem) => {
            const isAtual = sem.numeroSemana === numSemanaAtual;
            const isAnterior = sem.numeroSemana < numSemanaAtual;
            const estado: "anterior" | "atual" | "bloqueada" = isAtual
              ? "atual"
              : isAnterior
              ? "anterior"
              : "bloqueada";

            const sessoes: StudentWorkoutSession[] = (sem.sessoes || []).map((s, idx) => {
              const status = (s.validadaPersonal || s.status === "VALIDADA"
                ? "VALIDADA"
                : s.concluidaAluno || s.status === "CONCLUIDA"
                ? "CONCLUIDA"
                : "PLANEJADA") as "PLANEJADA" | "CONCLUIDA" | "VALIDADA";

              let destaque = false;
              if (isAtual && status === "PLANEJADA" && !highlightAssigned) {
                destaque = true;
                highlightAssigned = true;
              }

              const diaSemana = formatDiaSemanaPt(s.dataPlanejada);
              const dataDdMm = formatDataPlanejadaDdMm(s.dataPlanejada);
              const rpe = s.desempenho?.nivelCansaco ?? null;
              const parsed = parseAtividades(s.atividades);
              const headline = parsed.sessionName || parsed.activities[0]?.title || "";

              return {
                id: s.id,
                numero: idx + 1,
                semana: sem.numeroSemana,
                diaSemana,
                dataPlanejada: dataDdMm,
                dataPlanejadaIso: s.dataPlanejada,
                titulo: headline ? `Sessão ${idx + 1} · ${headline}` : `Sessão ${idx + 1}`,
                descricao: s.atividades || "Sem descrição informada.",
                duracaoPlanejada: s.duracao || 50,
                duracaoReal: s.duracao,
                dataReal: s.dataReal ? formatDataPlanejadaDdMm(s.dataReal) : null,
                status,
                destaque,
                rpe,
                resultados: (s.desempenho?.metricas || []).map((m) => ({
                  metricaId: m.metricaId,
                  titulo: m.titulo || m.tituloMetrica || "Métrica",
                  tipo: m.tipo || m.tipoMetrica || "NUMERICO",
                  valor: m.valor,
                })),
              };
            });

            return {
              numero: sem.numeroSemana,
              titulo: `Semana ${sem.numeroSemana}`,
              periodo: isAtual ? "Semana atual" : isAnterior ? "anterior" : "bloqueada",
              estado,
              sessoes,
            };
          });

          setWeeks(mappedWeeks);
        } else {
          setWeeks([]);
          setActiveRoutine(null);
        }
      } else {
        // Aluno sem rotinas no backend ainda
        setWeeks([]);
        setHistoricalRoutines([]);
        setActiveRoutine(null);
      }
    } catch {
      // Se der erro ao carregar do backend, inicializa vazio em vez de mock antigo
      setWeeks([]);
      setHistoricalRoutines([]);
      setActiveRoutine(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const weekDays = useMemo(() => {
    const currentWeek = weeks.find((w) => w.estado === "atual") || weeks[0];
    return buildWeekDaysSummary(currentWeek);
  }, [weeks]);

  const openRpeModal = useCallback(
    (sessionId?: string) => {
      if (sessionId) {
        setRpeModalSessionId(sessionId);
        return;
      }
      const currentWeek = weeks.find((w) => w.estado === "atual");
      const nextSession =
        currentWeek?.sessoes.find((s) => s.destaque && s.status === "PLANEJADA") ||
        currentWeek?.sessoes.find((s) => s.status === "PLANEJADA") ||
        weeks.flatMap((w) => w.sessoes).find((s) => s.status === "PLANEJADA");
      setRpeModalSessionId(nextSession?.id || null);
    },
    [weeks]
  );

  const closeRpeModal = useCallback(() => {
    setRpeModalSessionId(null);
    if (searchParams.get("modal") === "rpe") {
      const next = new URLSearchParams(searchParams);
      next.delete("modal");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const confirmRpeExecution = useCallback(
    async (
      rpe: number | null,
      details?: {
        dataReal?: string;
        duracao?: number | null;
        resultados?: StudentWorkoutSession["resultados"];
        alreadySavedOnBackend?: boolean;
      }
    ) => {
      if (!rpeModalSessionId) return;
      setRpeBusy(true);
      try {
        const realIso = details?.dataReal || localDateKey(new Date());
        if (!details?.alreadySavedOnBackend) {
          await alunoService.registrarExecucao(rpeModalSessionId, {
            dataReal: realIso,
            duracao: details?.duracao ?? 50,
            nivelCansaco: rpe,
            resultados: (details?.resultados || []).map((r) => ({
              metricaId: r.metricaId,
              valor: r.valor,
            })),
          });
        }

        const formattedRealDate = formatDataPlanejadaDdMm(realIso);
        setWeeks((prev) =>
          applySessionExecution(
            prev,
            rpeModalSessionId,
            rpe,
            formattedRealDate,
            details?.resultados,
            details?.duracao
          )
        );
        toast.success(
          rpe !== null
            ? `Sessão finalizada com sucesso (RPE ${rpe}/10)!`
            : "Sessão finalizada com sucesso!"
        );
        closeRpeModal();
        void loadData();
      } finally {
        setRpeBusy(false);
      }
    },
    [rpeModalSessionId, closeRpeModal, loadData]
  );

  const sendObservationToPersonal = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      try {
        await alunoService.registrarObservacao(trimmed);
      } catch {
        // Confirma localmente
      }
      toast.success(`Mensagem enviada para ${student.personal.name}!`);
      setMessageModalOpen(false);
    },
    [student.personal.name]
  );

  const markFeedbacksRead = useCallback(() => {
    setUnreadNotifications(0);
    setFeedbacks((prev) => prev.map((f) => ({ ...f, novo: false })));
    setNotifications((prev) => ({
      ...prev,
      data: prev.data.map((item) => ({ ...item, lida: true })),
    }));
    alunoService.lerTodasNotificacoes().catch(() => {});
  }, []);

  const readNotification = useCallback(async (id?: string) => {
    try {
      if (id) {
        await alunoService.lerNotificacao(id);
        setNotifications((prev) => ({
          ...prev,
          data: prev.data.map((item) => (item.id === id ? { ...item, lida: true } : item)),
        }));
        setUnreadNotifications((prev) => Math.max(0, prev - 1));
      } else {
        await alunoService.lerTodasNotificacoes();
        setNotifications((prev) => ({
          ...prev,
          data: prev.data.map((item) => ({ ...item, lida: true })),
        }));
        setUnreadNotifications(0);
      }
    } catch {
      if (id) {
        setNotifications((prev) => ({
          ...prev,
          data: prev.data.map((item) => (item.id === id ? { ...item, lida: true } : item)),
        }));
        setUnreadNotifications((prev) => Math.max(0, prev - 1));
      } else {
        setNotifications((prev) => ({
          ...prev,
          data: prev.data.map((item) => ({ ...item, lida: true })),
        }));
        setUnreadNotifications(0);
      }
    }
  }, []);

  const completedCount = useMemo(() => countCompletedSessions(weeks, 0), [weeks]);
  const totalSessionsCount = useMemo(() => {
    const total = weeks.reduce((acc, w) => acc + w.sessoes.length, 0);
    return Math.max(1, total);
  }, [weeks]);
  const monthlySessionsCount = completedCount;

  const averageRpe = useMemo(() => {
    const validRpes = weeks
      .flatMap((w) => w.sessoes)
      .map((s) => s.rpe)
      .filter((v): v is number => typeof v === "number");
    if (validRpes.length === 0) return "—";
    const avg = validRpes.reduce((a, b) => a + b, 0) / validRpes.length;
    return avg.toFixed(1).replace(".", ",");
  }, [weeks]);

  return (
    <StudentContext.Provider
      value={{
        student,
        activeRoutine,
        loading,
        selectedWeekNum,
        setSelectedWeekNum,
        weeks,
        weekDays,
        historicalRoutines,
        feedbacks,
        completedCount,
        totalSessionsCount,
        monthlySessionsCount,
        averageRpe,
        unreadNotifications,
        searchQuery,
        setSearchQuery,
        rpeModalSessionId,
        rpeBusy,
        openRpeModal,
        closeRpeModal,
        confirmRpeExecution,
        inspectedSession,
        setInspectedSession,
        inspectedRoutine,
        setInspectedRoutine,
        messageModalOpen,
        setMessageModalOpen,
        sendObservationToPersonal,
        markFeedbacksRead,
        notifications,
        readNotification,
        refreshData: loadData,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

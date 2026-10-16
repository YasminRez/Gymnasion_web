import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import SportTag from "../../components/SportTag/SportTag";
import { useStudentArea } from "../../features/studentArea/StudentContext";
import { filterStudentSessions } from "../../features/studentArea/studentAreaModel";
import "./StudentWorkouts.css";

export default function StudentWorkouts() {
  const [searchParams] = useSearchParams();
  const {
    activeRoutine,
    loading,
    selectedWeekNum,
    setSelectedWeekNum,
    weeks,
    historicalRoutines,
    completedCount,
    totalSessionsCount,
    searchQuery,
    setSearchQuery,
    openRpeModal,
    setInspectedSession,
    setInspectedRoutine,
  } = useStudentArea();

  useEffect(() => {
    const q = searchParams.get("busca");
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams, setSearchQuery]);

  const activeWeek = weeks.find((w) => w.numero === selectedWeekNum) || weeks[0];
  const visibleSessions = filterStudentSessions(activeWeek?.sessoes || [], searchQuery);
  const progressPercent = Math.min(100, Math.round((completedCount / totalSessionsCount) * 100));

  const sportKey: "natacao" | "tenis" | "academia" | "corrida" | "ciclismo" | "funcional" =
    activeRoutine?.modalidade?.toLowerCase().includes("tenis")
      ? "tenis"
      : activeRoutine?.modalidade?.toLowerCase().includes("corr")
      ? "corrida"
      : activeRoutine?.modalidade?.toLowerCase().includes("acad") ||
        activeRoutine?.modalidade?.toLowerCase().includes("musc")
      ? "academia"
      : activeRoutine?.modalidade?.toLowerCase().includes("cicl")
      ? "ciclismo"
      : activeRoutine?.modalidade?.toLowerCase().includes("func")
      ? "funcional"
      : "natacao";

  return (
    <div className="student-workouts">
      {/* Top Active Routine Banner */}
      <section className="student-workouts__banner" aria-label="Rotina ativa">
        <div className="student-workouts__banner-main">
          <div className="student-workouts__banner-badges">
            <Badge tone="success">{activeRoutine ? "Rotina ativa" : "Nenhuma rotina ativa"}</Badge>
            {activeRoutine && <SportTag sport={sportKey} />}
            {activeRoutine && (
              <Badge tone="primary">{activeRoutine.frequenciaSemanal}x por semana</Badge>
            )}
          </div>
          <h2>{activeRoutine ? activeRoutine.titulo : "Aguardando novo treino do seu personal"}</h2>
          <p>
            {activeRoutine
              ? `Objetivo: ${activeRoutine.objetivos}`
              : "Seu personal trainer ainda não vinculou uma rotina ativa à sua conta."}
          </p>
        </div>

        {activeRoutine && (
          <div className="student-workouts__banner-progress">
            <span className="student-workouts__banner-progress-label">
              Semana {activeRoutine.semanaAtual} de {activeRoutine.totalSemanas} · {completedCount} de {totalSessionsCount} sessões
            </span>
            <div
              className="student-workouts__progress-track"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={totalSessionsCount}
              aria-label="Progresso de sessões da rotina"
            >
              <div
                className="student-workouts__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Main 2-Column Content */}
      <div className="student-workouts__grid">
        {/* Left: Sessões da semana */}
        <section className="student-workouts__sessions-card" aria-label="Sessões da semana">
          <header className="student-workouts__sessions-header">
            <h2>Sessões da semana</h2>

            {weeks.length > 0 && (
              <div className="student-workouts__week-tabs" role="tablist" aria-label="Semanas da rotina">
                {weeks.map((week) => {
                  const isSelected = week.numero === selectedWeekNum;
                  const isLocked = week.estado === "bloqueada";
                  return (
                    <button
                      key={week.numero}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      disabled={isLocked}
                      className={`student-workouts__week-tab${isSelected ? " is-active" : ""}${
                        isLocked ? " is-locked" : ""
                      }`}
                      onClick={() => !isLocked && setSelectedWeekNum(week.numero)}
                    >
                      <span className="student-workouts__week-tab-title">
                        {isLocked && (
                          <img src="/workspace/402-2299-imgIconLock.svg" alt="" aria-hidden="true" />
                        )}
                        {week.titulo}
                      </span>
                      <small>{week.periodo}</small>
                    </button>
                  );
                })}
              </div>
            )}
          </header>

          <div className="student-workouts__session-list">
            {loading ? (
              <div className="student-workouts__empty">
                <p>Carregando treinos da sua rotina...</p>
              </div>
            ) : visibleSessions.length === 0 ? (
              <div className="student-workouts__empty">
                <p>
                  {searchQuery
                    ? `Nenhuma sessão encontrada para “${searchQuery}”.`
                    : "Nenhuma sessão planejada para esta semana."}
                </p>
                {searchQuery && (
                  <Button variant="secondary" onClick={() => setSearchQuery("")}>
                    Limpar busca
                  </Button>
                )}
              </div>
            ) : (
              visibleSessions.map((sessao) => {
                const isHighlight = Boolean(sessao.destaque && sessao.status === "PLANEJADA");
                return (
                  <article
                    key={sessao.id}
                    className={`student-workouts__session${
                      isHighlight ? " student-workouts__session--highlight" : ""
                    }`}
                  >
                    <div
                      className={`student-workouts__date-box${
                        isHighlight ? " student-workouts__date-box--highlight" : ""
                      }`}
                    >
                      <span>{sessao.diaSemana}</span>
                      <strong>{sessao.dataPlanejada}</strong>
                    </div>

                    <div className="student-workouts__session-info">
                      <h3>{sessao.titulo}</h3>
                      <p>{sessao.descricao}</p>
                    </div>

                    <div className="student-workouts__session-actions">
                      <Badge
                        tone={
                          sessao.status === "CONCLUIDA"
                            ? "success"
                            : sessao.status === "VALIDADA"
                            ? "info"
                            : "neutral"
                        }
                      >
                        {sessao.status === "CONCLUIDA"
                          ? "Concluída"
                          : sessao.status === "VALIDADA"
                          ? "Validada"
                          : "Planejada"}
                      </Badge>

                      {sessao.status !== "PLANEJADA" ? (
                        <button
                          type="button"
                          className="student-workouts__link-btn"
                          onClick={() => setInspectedSession(sessao)}
                        >
                          Ver resultados
                        </button>
                      ) : isHighlight ? (
                        <Button onClick={() => openRpeModal(sessao.id)}>
                          Registrar execução
                        </Button>
                      ) : (
                        <button
                          type="button"
                          className="student-workouts__link-btn"
                          onClick={() => setInspectedSession(sessao)}
                        >
                          Ver detalhes
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <footer className="student-workouts__readonly-note">
            <img src="/workspace/402-2299-imgIconLock.svg" alt="" aria-hidden="true" />
            <span>
              Somente leitura · o planejamento é definido pelo seu personal. Semanas futuras
              aparecem quando começarem.
            </span>
          </footer>
        </section>

        {/* Right: Histórico de rotinas + Status das sessões */}
        <aside className="student-workouts__aside">
          <section className="student-workouts__side-card" aria-label="Histórico de rotinas">
            <header className="student-workouts__side-header">
              <h2>Histórico de rotinas</h2>
              <p>Consulte semanas, sessões e resultados</p>
            </header>

            <div className="student-workouts__history-list">
              {historicalRoutines.length === 0 ? (
                <p style={{ color: "var(--color-neutral-500, #64748b)", fontSize: "0.875rem", margin: "0.5rem 0" }}>
                  Nenhuma rotina encerrada no momento.
                </p>
              ) : (
                historicalRoutines.map((rotina) => (
                  <button
                    key={rotina.id}
                    type="button"
                    className="student-workouts__history-item"
                    onClick={() => setInspectedRoutine(rotina)}
                  >
                    <div className="student-workouts__history-info">
                      <strong>{rotina.titulo}</strong>
                      <span>{rotina.periodo}</span>
                      <Badge tone="neutral">Encerrada</Badge>
                    </div>
                    <img
                      src="/workspace/401-744-imgIconChevr.svg"
                      alt=""
                      aria-hidden="true"
                      className="student-workouts__history-chevron"
                    />
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="student-workouts__side-card" aria-label="Status das sessões">
            <header className="student-workouts__side-header">
              <h2>Status das sessões</h2>
            </header>

            <ul className="student-workouts__legend-list">
              <li>
                <Badge tone="neutral">Planejada</Badge>
                <span>Aguardando sua execução</span>
              </li>
              <li>
                <Badge tone="success">Concluída</Badge>
                <span>Execução confirmada por você</span>
              </li>
              <li>
                <Badge tone="info">Validada</Badge>
                <span>Conferida pelo personal</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

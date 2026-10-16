import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Avatar from "../../components/Avatar/Avatar";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import SportTag from "../../components/SportTag/SportTag";
import StudentSmoothChart from "../../components/StudentSmoothChart/StudentSmoothChart";
import { useStudentArea } from "../../features/studentArea/StudentContext";
import "./AccountHome.css";

export default function AccountHome() {
  const location = useLocation();
  const {
    student,
    activeRoutine,
    weeks,
    weekDays,
    feedbacks,
    monthlySessionsCount,
    averageRpe,
    openRpeModal,
    setInspectedSession,
  } = useStudentArea();

  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  const currentWeek = weeks.find((w) => w.estado === "atual") || weeks[0];
  const nextSession =
    currentWeek?.sessoes.find((s) => s.destaque && s.status === "PLANEJADA") ||
    currentWeek?.sessoes.find((s) => s.status === "PLANEJADA") ||
    currentWeek?.sessoes[0];

  const newFeedbacksCount = feedbacks.filter((f) => f.novo).length;
  const completedDaysInWeek = currentWeek
    ? currentWeek.sessoes.filter((s) => s.status !== "PLANEJADA").length
    : 0;
  const totalDaysInWeek = currentWeek ? currentWeek.sessoes.length : 0;

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
    <div className="student-panel">
      {/* Row 1: 4 KPI Cards */}
      <section className="student-panel__stats" aria-label="Indicadores do aluno">
        <article className="student-panel__stat-card">
          <div className="student-panel__stat-top">
            <span className="student-panel__stat-icon student-panel__stat-icon--orange">
              <img src="/student-profile/imgIconActivity2.svg" alt="" />
            </span>
            <Badge tone="success">Ativo</Badge>
          </div>
          <strong className="student-panel__stat-value">{monthlySessionsCount}</strong>
          <span className="student-panel__stat-label">Sessões concluídas</span>
        </article>

        <article className="student-panel__stat-card">
          <div className="student-panel__stat-top">
            <span className="student-panel__stat-icon student-panel__stat-icon--amber">
              <img src="/student-profile/imgIconFlame.svg" alt="" />
            </span>
            <Badge tone="warning">Meta</Badge>
          </div>
          <strong className="student-panel__stat-value">
            {activeRoutine ? `${activeRoutine.frequenciaSemanal}x` : "—"}
          </strong>
          <span className="student-panel__stat-label">Frequência semanal</span>
        </article>

        <article className="student-panel__stat-card">
          <div className="student-panel__stat-top">
            <span className="student-panel__stat-icon student-panel__stat-icon--red">
              <img src="/institutional/imgIconHeart.svg" alt="" />
            </span>
            <Badge tone="neutral">Borg CR-10</Badge>
          </div>
          <strong className="student-panel__stat-value">{averageRpe}</strong>
          <span className="student-panel__stat-label">RPE médio</span>
        </article>

        <article className="student-panel__stat-card">
          <div className="student-panel__stat-top">
            <span className="student-panel__stat-icon student-panel__stat-icon--blue">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2e90fa"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <Badge tone="info">{activeRoutine ? activeRoutine.modalidade : "Geral"}</Badge>
          </div>
          <strong className="student-panel__stat-value">
            {activeRoutine ? `${activeRoutine.semanaAtual}/${activeRoutine.totalSemanas}` : "—"}
          </strong>
          <span className="student-panel__stat-label">Semana da rotina ativa</span>
        </article>
      </section>

      {/* Row 2: Próxima Sessão + Minha Semana */}
      <div className="student-panel__middle">
        <section className="student-panel__card student-panel__next" aria-label="Próxima sessão">
          {nextSession ? (
            <>
              <div className="student-panel__next-date" aria-hidden="true">
                <span className="student-panel__next-weekday">{nextSession.diaSemana}</span>
                <strong className="student-panel__next-day">{nextSession.dataPlanejada}</strong>
                <span className="student-panel__next-time">{nextSession.duracaoPlanejada ? `${nextSession.duracaoPlanejada} min` : "Treino"}</span>
              </div>

              <div className="student-panel__next-body">
                <span className="student-panel__next-eyebrow">PRÓXIMA SESSÃO</span>
                <div className="student-panel__next-title-row">
                  <h2>{activeRoutine ? activeRoutine.titulo : "Treino"}</h2>
                  {activeRoutine && <SportTag sport={sportKey} />}
                </div>
                <p className="student-panel__next-subtitle">
                  {`Com ${student.personal.name} · ${nextSession.descricao.slice(0, 60)}`}
                </p>
                <div className="student-panel__next-actions">
                  <Button
                    variant="secondary"
                    onClick={() => setInspectedSession(nextSession)}
                  >
                    Ver sessão
                  </Button>
                  <Button onClick={() => openRpeModal(nextSession.id)}>
                    Registrar execução
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="student-panel__next-body" style={{ padding: "1.5rem 0" }}>
              <span className="student-panel__next-eyebrow">PRÓXIMA SESSÃO</span>
              <h2>Nenhum treino pendente para esta semana</h2>
              <p className="student-panel__next-subtitle">
                {activeRoutine
                  ? "Todas as sessões planejadas da semana atual foram concluídas."
                  : "Aguardando novo planejamento de treino do seu personal."}
              </p>
            </div>
          )}
        </section>

        <section className="student-panel__card student-panel__week" aria-label="Minha semana">
          <header className="student-panel__card-header">
            <div>
              <h2>Minha semana</h2>
              <p>
                {totalDaysInWeek > 0
                  ? `${completedDaysInWeek} de ${totalDaysInWeek} sessões planejadas concluídas`
                  : "Sem sessões agendadas para esta semana"}
              </p>
            </div>
          </header>

          <div className="student-panel__week-days">
            {weekDays.map((day) => (
              <div
                key={day.id}
                className={`student-panel__week-day student-panel__week-day--${day.status}`}
              >
                <span className="student-panel__week-day-label">{day.label}</span>
                {day.status === "completed" ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2e90fa"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="Concluída"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span
                    className={`student-panel__week-dot${
                      day.status === "rest" ? " student-panel__week-dot--muted" : ""
                    }`}
                    aria-label={day.status === "rest" ? "Descanso" : "Planejada"}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="student-panel__week-legend">
            <span className="student-panel__week-dot" aria-hidden="true" />
            <span>Natação</span>
          </div>
        </section>
      </div>

      {/* Row 3: Minha Evolução + Feedbacks do Personal */}
      <div className="student-panel__bottom">
        <section className="student-panel__card student-panel__evolution" aria-label="Minha evolução">
          <header className="student-panel__card-header">
            <div>
              <h2>Minha evolução</h2>
              <p>Ritmo médio /100m · últimas 8 semanas</p>
            </div>
          </header>

          <div className="student-panel__evolution-metric">
            <strong>1:42</strong>
            <span className="student-panel__evolution-unit">min/100m</span>
            <Badge tone="success">▼ 8% melhora</Badge>
          </div>

          <div className="student-panel__evolution-chart">
            <StudentSmoothChart
              values={[12, 18, 22, 30, 42, 46, 56, 68, 74, 88]}
              labels={["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]}
              color="blue"
              ariaLabel="Gráfico de evolução de ritmo médio por 100 metros nas últimas 8 semanas"
            />
          </div>
        </section>

        <section
          id="feedbacks"
          className="student-panel__card student-panel__feedbacks"
          aria-label="Feedbacks do personal"
        >
          <header className="student-panel__feedbacks-header">
            <h2>Feedbacks do personal</h2>
            <Badge tone="primary">{newFeedbacksCount} novos</Badge>
          </header>

          <div className="student-panel__feedbacks-list">
            {feedbacks.length === 0 ? (
              <p style={{ color: "var(--color-neutral-500, #64748b)", fontSize: "0.875rem", margin: "1rem 0" }}>
                Nenhum feedback registrado pelo seu personal ainda.
              </p>
            ) : (
              feedbacks.map((fb) => (
                <article key={fb.id} className="student-panel__feedback-item">
                  <Avatar name={fb.autorNome} initials={fb.autorIniciais} tone="primary" />
                  <div className="student-panel__feedback-content">
                    <div className="student-panel__feedback-meta">
                      <strong>{fb.autorNome}</strong>
                      <span>{fb.tempoRelativo}</span>
                    </div>
                    <p>{fb.conteudo}</p>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="student-panel__strava-banner">
            <span className="student-panel__strava-icon" aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <div>
              <strong>Strava conectado</strong>
              <p>Última sincronização hoje, 06:58</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

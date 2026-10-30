import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppSidebar from "../AppSidebar/AppSidebar";
import AppTopbar from "../AppTopbar/AppTopbar";
import TermsModal from "../TermsModal/TermsModal";
import ReportDialog from "../ReportDialog/ReportDialog";
import { usePersonal } from "../../features/personal/PersonalContext";
import { authService } from "../../services/authService";
import { relatorioService } from "../../services/relatorioService";
import { studentCounts } from "../../features/personal/studentModel";
import "./PersonalLayout.css";

export default function PersonalLayout() {
  const { students, notifications, groups, readNotification, notificationBusy, refresh } = usePersonal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const studentsList = Array.isArray(students?.data) ? students.data : [];
  const notificationsList = Array.isArray(notifications?.data) ? notifications.data : [];
  const groupsList = Array.isArray(groups?.data) ? groups.data : [];
  const name = studentsList.find(student => student.nomePersonal)?.nomePersonal || "Personal";
  const isSettings = location.pathname === "/configuracoes";
  const isStudents = location.pathname === "/alunos";
  const isGroups = location.pathname === "/grupos" || location.pathname.startsWith("/grupos/");
  const isGroupDetail = location.pathname.startsWith("/grupos/");
  const group = groupsList.find(item => item.id === decodeURIComponent(location.pathname.slice("/grupos/".length)));
  const isProfile = location.pathname.startsWith("/alunos/");
  const isNewRoutine = location.pathname === "/rotinas/nova";
  const isEditRoutine = location.pathname.startsWith("/rotinas/") && location.pathname.endsWith("/editar");
  const isRoutines = location.pathname === "/rotinas";
  const isMetrics = location.pathname === "/metricas";
  const profileStudent = isProfile ? studentsList.find(student => student.id === decodeURIComponent(location.pathname.slice("/alunos/".length))) : undefined;
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="personal-layout">
      <a className="personal-layout__skip" href="#personal-content">Ir para o conteúdo</a>

      {menuOpen && (
        <div
          className="personal-layout__backdrop"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        id="personal-sidebar"
        className={`personal-layout__sidebar${menuOpen ? " personal-layout__sidebar--open" : ""}`}
      >
        <AppSidebar
          user={{ name, subtitle: "Personal Trainer" }}
          onCloseMobile={() => setMenuOpen(false)}
          onLogout={() => {
            authService.logout();
            navigate("/login", { replace: true });
          }}
          menu={[
            { id: "home", label: "Início", icon: "imgIconHome", to: "/home" },
            { id: "students", label: "Alunos", icon: "imgIconUsers", to: "/alunos", count: studentCounts(studentsList).pending },
            { id: "groups", label: "Turmas", icon: "imgIconLayers", to: "/grupos" },
            { id: "routines", label: "Rotinas de treino", icon: "imgIconDumbbell", to: "/rotinas" },
            { id: "metrics", label: "Métricas", icon: "imgIconActivity", to: "/metricas" },
            { id: "reports", label: "Relatórios", icon: "imgIconFile", onClick: () => setReportOpen(true) },
          ]}
          general={[
            { id: "settings", label: "Configurações", icon: "imgIconSliders", to: "/configuracoes" },
            { id: "terms", label: "Termos e privacidade", icon: "imgIconShield", onClick: () => setTermsOpen(true) },
          ]}
        />
      </div>

      <div className="personal-layout__body">
        <AppTopbar
          menuOpen={menuOpen}
          sidebarId="personal-sidebar"
          onToggleMenu={() => setMenuOpen(value => !value)}
          title={
            isSettings ? "Configurações" : isGroups
              ? isGroupDetail
                ? group?.nome || "Gerenciar turma"
                : "Turmas"
              : isMetrics
              ? "Minhas métricas"
              : isProfile
              ? "Perfil do aluno"
              : isStudents
              ? "Meus alunos"
              : isNewRoutine
              ? "Nova rotina"
              : isEditRoutine
              ? "Editar rotina"
              : isRoutines
              ? "Rotinas de treino"
              : name === "Personal"
              ? "Olá, personal!"
              : `Olá, ${name.split(" ")[0]}`
          }
          subtitle={
            isSettings ? "Personalize sua experiência no Gymnasion" : isGroups
              ? isGroupDetail
                ? "Turmas / Gerenciar turma"
                : "Organize alunos em grupos por modalidade ou horário"
              : isMetrics
              ? "Crie campos personalizados de desempenho por modalidade"
              : isProfile
              ? "Alunos / " + (profileStudent?.usuario.nome || "Perfil")
              : isStudents
              ? "Gerencie cadastros, status e vínculos dos seus alunos"
              : isNewRoutine
              ? "Rotinas de treino / Nova rotina"
              : isEditRoutine
              ? "Rotinas de treino / Editar rotina"
              : isRoutines
              ? "Planeje sessões com métricas personalizadas por modalidade"
              : `${date} · Aqui está o resumo dos seus alunos`
          }
          notificationCount={notificationsList.filter(item => !item.lida).length}
          userName={name}
          searchLabel={isGroups ? "Buscar turmas..." : "Buscar alunos, turmas..."}
          onSearch={query =>
            navigate(
              isGroups
                ? `/grupos?busca=${encodeURIComponent(query)}`
                : isRoutines
                ? `/rotinas?busca=${encodeURIComponent(query)}`
                : isMetrics
                ? `/metricas?busca=${encodeURIComponent(query)}`
                : `/alunos?busca=${encodeURIComponent(query)}`
            )
          }
          notifications={notifications}
          onReadNotification={readNotification}
          notificationBusy={notificationBusy}
          onRefreshNotifications={() => void refresh()}
        />
        <main id="personal-content" tabIndex={-1}><Outlet /></main>
      </div>

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
      {/* US-16: pelo menu o personal escolhe o aluno; inativos mantêm o histórico (RN-014). */}
      {reportOpen && (
        <ReportDialog
          onClose={() => setReportOpen(false)}
          students={studentsList
            .filter(student => student.status === "ATIVO" || student.status === "INATIVO")
            .map(student => ({ id: student.id, nome: student.usuario.nome, modalidades: student.modalidades }))}
          generate={(filter, signal, studentId) => relatorioService.gerarPeloPersonal(studentId ?? "", filter, signal)}
          loadAvailability={(signal, studentId) => relatorioService.disponibilidadePeloPersonal(studentId ?? "", signal)}
        />
      )}
    </div>
  );
}

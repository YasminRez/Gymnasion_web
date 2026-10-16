import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppSidebar from "../AppSidebar/AppSidebar";
import AppTopbar from "../AppTopbar/AppTopbar";
import TermsModal from "../TermsModal/TermsModal";
import { usePersonal } from "../../features/personal/PersonalContext";
import { authService } from "../../services/authService";
import { studentCounts } from "../../features/personal/studentModel";
import "./PersonalLayout.css";

export default function PersonalLayout() {
  const { students, notifications } = usePersonal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const studentsList = Array.isArray(students?.data) ? students.data : [];
  const notificationsList = Array.isArray(notifications?.data) ? notifications.data : [];
  const name = studentsList.find(student => student.nomePersonal)?.nomePersonal || "Personal";
  const isStudents = location.pathname === "/alunos";
  const isProfile = location.pathname.startsWith("/alunos/");
  const isNewRoutine = location.pathname === "/rotinas/nova";
  const isRoutines = location.pathname === "/rotinas";
  const isMetrics = location.pathname === "/metricas";
  const profileStudent = isProfile ? studentsList.find(student => student.id === decodeURIComponent(location.pathname.slice("/alunos/".length))) : undefined;
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());
  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.search]);
  return <div className="personal-layout">
    <a className="personal-layout__skip" href="#personal-content">Ir para o conteúdo</a>
    <button className="personal-layout__menu" aria-expanded={menuOpen} aria-controls="personal-sidebar" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? "Fechar menu" : "Abrir menu"}</button>
    <div id="personal-sidebar" className={`personal-layout__sidebar${menuOpen ? " personal-layout__sidebar--open" : ""}`}>
      <AppSidebar user={{ name, subtitle: "Personal Trainer" }} onLogout={() => { authService.logout(); navigate("/login", { replace: true }); }}
        menu={[
          { id: "home", label: "Início", icon: "imgIconHome", to: "/home" },
          { id: "students", label: "Alunos", icon: "imgIconUsers", to: "/alunos", count: studentCounts(studentsList).pending },
          { id: "groups", label: "Turmas", icon: "imgIconLayers", to: "/grupos" },
          { id: "routines", label: "Rotinas de treino", icon: "imgIconDumbbell", to: "/rotinas" },
          { id: "metrics", label: "Métricas", icon: "imgIconActivity", to: "/metricas" },
          { id: "modalities", label: "Modalidades", icon: "imgIconGrid" },
          { id: "evolution", label: "Evolução", icon: "imgIconChart" },
          { id: "reports", label: "Relatórios", icon: "imgIconFile" },
        ]}
        general={[{ id: "settings", label: "Configurações", icon: "imgIconSliders" }, { id: "terms", label: "Termos e privacidade", icon: "imgIconShield", onClick: () => setTermsOpen(true) }]}
        footer={<div className="personal-layout__strava"><img src="/design-system/imgIconZap1.svg" alt="" /><strong>Sincronize com o Strava</strong><p>Integração disponível em breve.</p><button disabled>Conectar →</button></div>} />
    </div>
    <div className="personal-layout__body">
      <AppTopbar
        title={isMetrics ? "Minhas métricas" : isProfile ? "Perfil do aluno" : isStudents ? "Meus alunos" : isNewRoutine ? "Nova rotina" : isRoutines ? "Rotinas de treino" : name === "Personal" ? "Olá, personal!" : `Olá, ${name.split(" ")[0]}`}
        subtitle={isMetrics ? "Crie campos personalizados de desempenho por modalidade" : isProfile ? "Alunos / " + (profileStudent?.usuario.nome || "Perfil") : isStudents ? "Gerencie cadastros, status e vínculos dos seus alunos" : isNewRoutine ? "Rotinas de treino / Nova rotina" : isRoutines ? "Planeje sessões com métricas personalizadas por modalidade" : `${date} · Aqui está o resumo dos seus alunos`}
        notificationCount={notificationsList.filter(item=>!item.lida).length}
        userName={name}
        searchLabel="Buscar alunos, turmas..."
        onSearch={query => navigate(isRoutines ? `/rotinas?busca=${encodeURIComponent(query)}` : isMetrics ? `/metricas?busca=${encodeURIComponent(query)}` : `/alunos?busca=${encodeURIComponent(query)}`)}
        onNotifications={() => navigate("/home#notificacoes")}
      />
      <main id="personal-content"><Outlet /></main>
    </div>
    {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
  </div>;
}


// src/App.tsx
import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import SignIn from "./pages/SignIn/SignIn";
import Home from "./pages/Home/Home";
import SignUp from "./pages/SignUp/SignUp";
import Students from "./pages/Students/Students";
import SignUpStudent from "./pages/SingUpStudent/SingUpStudent";
import Dashboard from "./pages/Dashboard/Dashboard";
import Groups from "./pages/Groups/Groups";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute/PublicOnlyRoute";
import { SESSION_EXPIRED_EVENT } from "./services/session";


function App() {
  const navigate = useNavigate();

  // Quando a API recusa o token, volta para o login avisando o motivo
  useEffect(() => {
    function onSessionExpired(event: Event) {
      const detail = (event as CustomEvent<string | undefined>).detail;
      toast.error(detail || "Sua sessão expirou. Faça login novamente.", { id: "session-expired" });
      navigate("/login", { replace: true });
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [navigate]);

  return (
    <>
      {/* Configuração global do Pop-up */}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cadastro-aluno" element={<SignUpStudent />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<SignIn />} />
          <Route path="/cadastro" element={<SignUp />} />
        </Route>

        <Route element={<ProtectedRoute roles={["PERSONAL_TRAINER"]} />}>
          <Route path="/alunos" element={<Students />} />
          <Route path="/grupos" element={<Groups />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/home/notificacoes" element={<Dashboard section="notifications" />} />
          <Route path="/home/ultimos-aceitos" element={<Dashboard section="recent" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;

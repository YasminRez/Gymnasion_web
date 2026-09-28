// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SignIn from "./pages/SignIn/SignIn";
import Home from "./pages/Home/Home";
import SignUp from "./pages/SignUp/SignUp";
import Students from "./pages/Students/Students";
import SignUpStudent from "./pages/SingUpStudent/SingUpStudent";
import Dashboard from "./pages/Dashboard/Dashboard";


function App() {
  return (
    <>
      {/* Configuração global do Pop-up */}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/cadastro" element={<SignUp />} />
        <Route path="/alunos" element={<Students />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/home/notificacoes" element={<Dashboard section="notifications" />} />
        <Route path="/home/ultimos-aceitos" element={<Dashboard section="recent" />} />
        <Route path="/cadastro-aluno" element={<SignUpStudent />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/home/notificacoes" element={<Dashboard section="notifications"/>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;

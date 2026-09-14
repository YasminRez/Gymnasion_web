import SignIn from "./pages/SignIn/SignIn";
import Home from "./pages/Home/Home";
import SignUp from "./pages/SignUp/SignUp";
import Students from "./pages/Students/Students";
import Dashboard from "./pages/Dashboard/Dashboard";

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/login") return <SignIn />;
  if (pathname === "/alunos") return <Students />;
  if (pathname === "/home") return <Dashboard />;
  if (pathname === "/home/notificacoes") return <Dashboard section="notifications" />;

  return pathname === "/cadastro" ? <SignUp /> : <Home />;
}

export default App;

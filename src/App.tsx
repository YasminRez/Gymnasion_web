import SignIn from "./pages/SignIn/SignIn";
import Home from "./pages/Home/Home";
import SignUp from "./pages/SignUp/SignUp";
import Students from "./pages/Students/Students";

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/login") return <SignIn />;
  if (pathname === "/alunos") return <Students />;

  return pathname === "/cadastro" ? <SignUp /> : <Home />;
}

export default App;

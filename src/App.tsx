import SignIn from "./pages/SignIn/SignIn";
import Home from "./pages/Home/Home";
import SignUp from "./pages/SignUp/SignUp";

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/login") return <SignIn />;

  return pathname === "/cadastro" ? <SignUp /> : <Home />;
}

export default App;
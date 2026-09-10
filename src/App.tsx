import Home from "./pages/Home/Home";
import SignUp from "./pages/SignUp/SignUp";

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  return pathname === "/cadastro" ? <SignUp /> : <Home />;
}

export default App;
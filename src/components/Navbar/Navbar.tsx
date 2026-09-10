import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <a href="#" className="navbar-logo">
        GYMNASION
      </a>

      <nav className="navbar-links">
        <a href="#sobre">Conheça o Gymnasion</a>
        <a href="#login">Login</a>
        <a href="#home">Home</a>
        <a href="#esportes">Esportes</a>
      </nav>

      <button className="navbar-menu">
        ☰
      </button>
    </header>
  );
}

export default Navbar;
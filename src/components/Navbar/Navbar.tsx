import { useState } from "react";
import "./Navbar.css";

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <a href="/#sobre" className="navbar-logo">
        conheça o Gymnasion
      </a>

      <nav className={`navbar-links ${open ? "navbar-links--open" : ""}`}>
        <a href="/login" onClick={() => setOpen(false)}>Login</a>
        <a href="/#home" onClick={() => setOpen(false)}>Home</a>
        <a href="/#esportes" onClick={() => setOpen(false)}>Esportes</a>
        <a
          className="navbar-cta"
          href="/cadastro"
          onClick={() => setOpen(false)}
        >
          Cadastre-se
        </a>
      </nav>

      <button
        className="navbar-menu"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        {open ? "✕" : "☰"}
      </button>
    </header>
  );
}

export default Navbar;

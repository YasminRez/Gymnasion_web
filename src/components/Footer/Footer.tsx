import "./Footer.css";

const gallery = [
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=500&q=80",
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-gallery">
        {gallery.map((src, index) => (
          <img key={src} src={src} alt="" loading="lazy" style={{ animationDelay: `${index * 0.05}s` }} />
        ))}
      </div>

      <div className="footer-content">
        <div className="footer-brand">
          <span className="footer-logo">GYMNASION</span>
          <p>
            Eleve seu estilo de vida a outro nível construindo um treino
            de qualidade.
          </p>
        </div>

        <nav className="footer-links">
          <div>
            <h4>Navegação</h4>
            <a href="/#home">Home</a>
            <a href="/#sobre">Conheça o Gymnasion</a>
            <a href="/#esportes">Esportes</a>
          </div>

          <div>
            <h4>Conta</h4>
            <a href="/login">Login</a>
            <a href="/cadastro">Cadastre-se</a>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Gymnasion. Todos os direitos reservados.</span>
        <span>Fotos: Pexels &amp; Unsplash</span>
      </div>
    </footer>
  );
}

export default Footer;

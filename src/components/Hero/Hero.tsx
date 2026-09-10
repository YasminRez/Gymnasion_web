import "./Hero.css";

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-overlay" />

      <div className="hero-content">
        <span className="hero-tag">
          GYMNASION
        </span>

        <h1>
          Eleve seu estilo de vida a
          <br />

          <span>
            outro nível construindo
          </span>

          <br />

          <strong>
            um treino de qualidade!
          </strong>
        </h1>

        <p>
          Tenha acesso a uma experiência completa
          <br />
          para transformar seus treinos e alcançar
          <br />
          seus objetivos.
        </p>

        <button className="hero-button">
          Cadastre-se
        </button>
      </div>

      <div className="hero-scroll">
        <span>SCROLL</span>
        <div />
      </div>
    </section>
  );
}

export default Hero;
import "./Sports.css";

const sports = [
  {
    name: "Musculação",
    image:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Natação",
    image:
      "https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Tênis",
    image:
      "https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=900&q=80",
  },
];

function Sports() {
  return (
    <section className="sports" id="esportes">
      <h2>Nossos Esportes</h2>

      <div className="sports-frame">
        <svg
          className="sports-frame-svg"
          viewBox="0 0 1200 480"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect
            x="10"
            y="10"
            width="1180"
            height="460"
            rx="44"
            className="sports-frame-outline"
          />
          <line x1="360" y1="10" x2="440" y2="470" className="sports-frame-x" />
          <line x1="440" y1="10" x2="360" y2="470" className="sports-frame-x" />
          <line x1="760" y1="10" x2="840" y2="470" className="sports-frame-x" />
          <line x1="840" y1="10" x2="760" y2="470" className="sports-frame-x" />
        </svg>

        <div className="sports-grid">
          {sports.map((sport) => (
            <div className="sports-item" key={sport.name}>
              <img src={sport.image} alt={sport.name} loading="lazy" />
              <span>{sport.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Sports;

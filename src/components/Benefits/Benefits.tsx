import "./Benefits.css";

const benefits = [
  {
    number: "01",
    title: "Treinos personalizados",
    description:
      "Monte treinos de acordo com seus objetivos, nível e necessidades.",
  },
  {
    number: "02",
    title: "Acompanhamento",
    description:
      "Acompanhe sua evolução e tenha maior controle sobre seus resultados.",
  },
  {
    number: "03",
    title: "Organização",
    description:
      "Tenha seus exercícios, treinos e informações organizados em um só lugar.",
  },
];

function Benefits() {
  return (
    <section className="benefits" id="sobre">
      <div className="benefits-header">
        <span>POR QUE GYMNASION?</span>

        <h2>
          Benefícios do <strong>Serviço</strong>
        </h2>

        <p>
          Tudo o que você precisa para tornar sua
          experiência de treino mais completa.
        </p>
      </div>

      <div className="benefits-grid">
        {benefits.map((benefit) => (
          <article className="benefit-card" key={benefit.number}>
            <div className="benefit-number">
              {benefit.number}
            </div>

            <h3>{benefit.title}</h3>

            <p>{benefit.description}</p>

            <span className="benefit-arrow">
              →
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Benefits;
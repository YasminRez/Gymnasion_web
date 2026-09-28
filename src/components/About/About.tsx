import "./About.css";

function About() {
  return (
    <section className="about">
      <div className="about-image">
        <img
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80"
          alt="Aluno treinando com halteres na academia"
          loading="lazy"
        />
        <span className="about-diamond" aria-hidden="true" />
        <span className="about-arc" aria-hidden="true" />
      </div>

      <div className="about-content">
        <h2>
          Sobre nosso projeto
          <br />
          <strong>treino de qualidade!</strong>
        </h2>

        <p>
          O Gymnasion nasceu para simplificar a rotina de quem treina.
          Reunimos em um só lugar o planejamento dos seus treinos, o
          acompanhamento da sua evolução e o acesso às melhores modalidades
          esportivas, tudo pensado para que você foque no que realmente
          importa: seus resultados.
        </p>

        <p>
          Nossa equipe acompanha de perto cada etapa da sua jornada,
          ajustando cargas, exercícios e metas conforme seu progresso, para
          que cada treino te leve um passo mais perto do seu melhor
          desempenho.
        </p>
      </div>
    </section>
  );
}

export default About;

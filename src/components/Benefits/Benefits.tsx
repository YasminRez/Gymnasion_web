import "./Benefits.css";
const features = [
  ["imgIconLink", "Cadastro por link seguro", "Gere um convite de 15 minutos e o aluno preenche os próprios dados."],
  ["imgIconDumbbell", "Rotinas de treino", "Monte rotinas por modalidade com frequência semanal e objetivos."],
  ["imgIconUsers", "Turmas", "Agrupe alunos por horário ou modalidade e envie treinos em lote."],
  ["imgIconChart", "Dashboards de evolução", "Gráficos de linha com indicadores de melhora ou regressão."],
  ["imgIconHeart", "Nível de esforço (RPE)", "Escala de Borg CR-10 registrada ao final de cada sessão."],
  ["imgIconZap", "Integração com Strava", "Importe distância, tempo, ritmo e frequência cardíaca automaticamente."],
];
export default function Benefits() {
  return <section className="institutional-section" id="funcionalidades" aria-labelledby="features-title"><span id="sobre" />
    <div className="institutional-container">
      <div className="institutional-heading"><p className="institutional-eyebrow">Funcionalidades</p><h2 id="features-title">Tudo o que o personal precisa</h2><p>Do convite do aluno até o relatório de performance — sem planilhas e sem troca de dados sensíveis por mensagem.</p></div>
      <div className="institutional-features">{features.map(([icon, title, text]) => <article className="institutional-features__card" key={title}><span><img src={`/institutional/${icon}.svg`} alt="" /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </div>
  </section>;
}

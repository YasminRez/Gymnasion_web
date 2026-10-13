import "./HowItWorks.css";
const steps = [
  ["Crie sua conta", "Cadastro com CPF, senha forte e verificação CAPTCHA."],
  ["Convide seus alunos", "Envie o link por e-mail ou mensagem e aprove as solicitações."],
  ["Acompanhe a evolução", "Registre sessões, veja gráficos e gere relatórios em PDF."],
];
export default function HowItWorks() {
  return <section className="institutional-section" id="como-funciona" aria-labelledby="steps-title"><div className="institutional-container">
    <div className="institutional-heading"><p className="institutional-eyebrow">Como funciona</p><h2 id="steps-title">Comece em três passos</h2><p>Simples para o personal, seguro para o aluno.</p></div>
    <ol className="institutional-steps">{steps.map(([title, text], index) => <li key={title}><span aria-hidden="true">{index + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
  </div></section>;
}

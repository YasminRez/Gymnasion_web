import "./Highlights.css";
const items = [
  ["imgIconLayers", "Modalidades ilimitadas", "Cadastre quantos esportes quiser"],
  ["imgIconActivity", "Métricas sob medida", "Numérico, tempo, FC e texto"],
  ["imgIconFile", "Relatórios em PDF", "Gerados em até 40 segundos"],
  ["imgIconShield", "LGPD e CAPTCHA", "Segurança desde o cadastro"],
];
export default function Highlights() {
  return <section className="institutional-highlights" aria-label="Destaques"><div className="institutional-container institutional-highlights__grid">{items.map(([icon, title, text]) => <div className="institutional-highlights__item" key={title}><span><img src={`/institutional/${icon}.svg`} alt="" /></span><div><h2>{title}</h2><p>{text}</p></div></div>)}</div></section>;
}

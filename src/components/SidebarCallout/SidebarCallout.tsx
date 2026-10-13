import Avatar from "../Avatar/Avatar";
import "./SidebarCallout.css";
type Props = { variant: "strava"; onAction: () => void } | { variant: "personal"; name: string; registration: string; onAction: () => void };
export default function SidebarCallout(props: Props) {
  return props.variant === "strava" ? <div className="ds-callout ds-callout--strava">
    <span className="ds-callout__icon"><img src="/design-system/imgIconZap1.svg" alt="" /></span>
    <strong>Sincronize com o Strava</strong><p>Importe atividades dos seus alunos automaticamente.</p>
    <button type="button" onClick={props.onAction}>Conectar<img src="/design-system/imgIconArrowr.svg" alt="" /></button>
  </div> : <div className="ds-callout ds-callout--personal">
    <h2>Seu personal</h2><div className="ds-callout__personal"><Avatar name={props.name} /><div><strong>{props.name}</strong><p>{props.registration}</p></div></div>
    <button type="button" onClick={props.onAction}><img src="/design-system/imgIconMsg.svg" alt="" />Enviar mensagem</button>
  </div>;
}

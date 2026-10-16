import { Link } from "react-router-dom";
import Avatar from "../Avatar/Avatar";
import UnavailableAction from "../UnavailableAction/UnavailableAction";
import { groupIcon, normalizeGroupText } from "../../features/groups/groupModel";
import { formatSchedule } from "../../pages/Groups/groupData";
import type { TurmaResponse } from "../../types/turma";
import "./GroupCard.css";
export default function GroupCard({ group }: { group: TurmaResponse }) {
  const path = "/grupos/" + encodeURIComponent(group.id);
  return <article className="group-card-v2">
    <header><span className={"group-card-v2__sport group-card-v2__sport--" + normalizeGroupText(group.nomeModalidade)}><img src={"/groups/" + groupIcon(group.nomeModalidade) + ".svg"} alt={group.nomeModalidade} /></span>
      <div><h2>{group.nome}</h2><p>{group.horario ? formatSchedule(group.horario) : "Horário não definido"}</p></div>
      <Link className="group-card-v2__more" to={path} aria-label={"Gerenciar " + group.nome}><img src="/groups/imgIconMore.svg" alt="" /></Link>
    </header>
    <div className="group-card-v2__members"><div>{group.alunos.slice(0, 3).map(student => <Avatar key={student.id} name={student.nome || "Aluno"} />)}{group.quantidadeAlunos > 3 && <span className="group-card-v2__remaining">+{group.quantidadeAlunos - 3}</span>}</div><span>{group.quantidadeAlunos} {group.quantidadeAlunos === 1 ? "aluno" : "alunos"}</span></div>
    <footer><UnavailableAction variant="ghost" reason="O backend ainda não permite vincular uma rotina diretamente à turma." icon={<img src="/groups/imgIconDumbbell1.svg" alt="" />}>Vincular rotina</UnavailableAction><Link to={path}>Gerenciar <img src="/groups/imgIconArrowr.svg" alt="" /></Link></footer>
  </article>;
}

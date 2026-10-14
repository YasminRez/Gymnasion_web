import Avatar from "../Avatar/Avatar";
import SportTag, { type Sport } from "../SportTag/SportTag";
import { normalizeSearch } from "../../features/personal/studentModel";
import type { AlunoResponse } from "../../types/student";
import "./StudentIdentity.css";

export function StudentSports({ student }: { student: AlunoResponse }) {
  const known: Record<string, Sport> = { natacao: "natacao", tenis: "tenis", academia: "academia", corrida: "corrida", "corrida de rua": "corrida", ciclismo: "ciclismo", funcional: "funcional" };
  return <span className="student-sports">{student.modalidades.length ? student.modalidades.map(modality => known[normalizeSearch(modality.nome)]
    ? <SportTag key={modality.id} sport={known[normalizeSearch(modality.nome)]} />
    : <span className="student-sports__other" key={modality.id}>{modality.nome}</span>) : <span>Sem modalidade</span>}</span>;
}

export default function StudentIdentity({ student, detail }: { student: AlunoResponse; detail?: string }) {
  const tones = ["orange", "blue", "purple", "green", "mint", "amber"];
  const tone = tones[Array.from(student.id).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % tones.length];
  return <div className="student-identity"><Avatar name={student.usuario.nome} className={`student-avatar--${tone}`} /><div><strong>{student.usuario.nome}</strong><small>{detail ?? student.usuario.email}</small></div></div>;
}

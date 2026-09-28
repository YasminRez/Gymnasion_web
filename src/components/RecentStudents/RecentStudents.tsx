import RecentStudentRow from "../RecentStudentRow/RecentStudentRow";
import { recentStudentsData } from "./recentStudentsData";
import "./RecentStudents.css";

function RecentStudents() {
  return <section className="recent-students" aria-labelledby="recent-students-greeting">
    <h1 id="recent-students-greeting">Olá, @personal</h1>
    <section className="recent-students__panel" aria-labelledby="recent-students-title">
      <h2 id="recent-students-title">Últimos alunos aceitos</h2>
      <div className="recent-students__scroll" tabIndex={0} role="region" aria-label="Lista dos últimos alunos aceitos">
        <table className="recent-students__table"><thead><tr><th scope="col">Aluno</th><th scope="col">Modalidade</th><th scope="col">Data aceite</th><th scope="col">Status</th><th scope="col"><span className="recent-students__sr-only">Detalhes</span></th></tr></thead><tbody>{recentStudentsData.map((student) => <RecentStudentRow key={student.id} student={student} />)}</tbody></table>
      </div>
    </section>
    <p className="recent-students__demo">Dados demonstrativos · Integração com os aceites reais pendente.</p>
  </section>;
}
export default RecentStudents;

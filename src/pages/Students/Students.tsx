import { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import StudentCard from "../../components/StudentCard/StudentCard";
import StudentToolbar from "../../components/StudentToolbar/StudentToolbar";
import PendingStudent from "../../components/PendingStudent/PendingStudent";
import StudentInviteModal from "../../components/StudentInviteModal/StudentInviteModal";
import { type Student, type StudentStatus } from "./studentData";
import "./Students.css";
import StudentActionModal, { type StudentAction } from "../../components/StudentActionModal/StudentActionModal";
import StudentsEmptyState from "../../components/StudentsEmptyState/StudentsEmptyState";
import StudentToast from "../../components/StudentToast/StudentToast";
import { personalTrainerService } from "../../services/personalTrainerService";
import { handleApiError } from "../../utils/handleApiError";
import type { AlunoResponse } from "../../types/student";

function mapAlunoToStudent(aluno: AlunoResponse): Student {
  return {
    id: aluno.id,
    name: aluno.usuario.nome,
    email: aluno.usuario.email,
    phone: aluno.usuario.celular,
    sport: aluno.modalidades.map((m) => m.nome).join(", ") || "Geral",
    status: aluno.status === "PENDENTE" ? "pending" : aluno.status === "ATIVO" ? "active" : "inactive",
  };
}

function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StudentStatus | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<StudentAction | null>(null);

  const closeNotice = useCallback(() => setNotice(""), []);

  // Busca todos os alunos e pendentes da API
  const loadStudentsFromApi = useCallback(async () => {
    try {
      const [todos, pendentes] = await Promise.all([
        personalTrainerService.listarTodos(),
        personalTrainerService.listarPendentes(),
      ]);

      // Junta as duas listas removendo eventuais duplicidades pelo id
      const combinedMap = new Map<string, AlunoResponse>();
      todos.forEach((item) => combinedMap.set(item.id, item));
      pendentes.forEach((item) => combinedMap.set(item.id, item));

      const mapped = Array.from(combinedMap.values()).map(mapAlunoToStudent);
      setStudents(mapped);
    } catch (err) {
      handleApiError(err, "Não foi possível carregar a lista de alunos.");
    }
  }, []);

  useEffect(() => {
    loadStudentsFromApi();
  }, [loadStudentsFromApi]);

  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visible = students.filter((student) => normalize(student.name).includes(normalize(search.trim())) && (!filter || student.status === filter));
  const enrolled = visible.filter((student) => student.status !== "pending");
  const pending = visible.filter((student) => student.status === "pending");
  
  const counts = { active: 0, inactive: 0, pending: 0 };
  students.forEach((student) => {
    if (counts[student.status] !== undefined) {
      counts[student.status]++;
    }
  });

  async function handleDecision(student: Student, accept: boolean) {
    if (accept) {
      try {
        await personalTrainerService.aprovarAtleta(String(student.id));
        setStudents((previous) => previous.map((item) => item.id === student.id ? { ...item, status: "active" } : item));
        setNotice(`${student.name}: aluno aprovado com sucesso!`);
        setAction({ type: "approved", student });
      } catch (err) {
        handleApiError(err, "Erro ao aprovar o aluno no servidor.");
      }
    } else {
      setStudents((previous) => previous.filter((item) => item.id !== student.id));
      setNotice(`${student.name}: solicitação recusada.`);
      setAction({ type: "rejected", student });
    }
  }

  function confirmStatus() {
    if (!action || (action.type !== "deactivate" && action.type !== "reactivate")) return;
    const status = action.type === "deactivate" ? "inactive" : "active";
    setStudents((previous) => previous.map((student) => student.id === action.student.id ? { ...student, status } : student));
    setAction(null);
    setNotice(`${action.student.name}: aluno ${status === "active" ? "reativado" : "desativado"} com sucesso!`);
  }

  return (
    <>
      <Navbar />
      <main className="students" aria-label="Alunos">
        <h1 className="students__sr-only">Alunos</h1>
        <StudentToolbar search={search} onSearch={setSearch} filter={filter} onFilter={setFilter} counts={counts} onRegister={() => setInviteOpen(true)} />
        {visible.length === 0 && <StudentsEmptyState search={search.trim()} filtered={Boolean(filter)} onRegister={() => setInviteOpen(true)} />}
        {enrolled.length > 0 && (
          <section className="students__grid" aria-label="Alunos cadastrados">
            {enrolled.map((student) => <StudentCard key={student.id} student={student} onStatusChange={(selected) => { setNotice(""); setAction({ type: selected.status === "active" ? "deactivate" : "reactivate", student: selected }); }} />)}
          </section>
        )}
        {pending.length > 0 && (
          <section className="students__pending" aria-labelledby="pending-title">
            <h2 id="pending-title">Pendentes</h2>
            <div className="students__pending-grid">
              {pending.map((student) => <PendingStudent key={student.id} student={student} onDecision={handleDecision} />)}
            </div>
          </section>
        )}
      </main>
      {inviteOpen && <StudentInviteModal onClose={() => setInviteOpen(false)} onViewStudents={() => { setInviteOpen(false); setSearch(""); setFilter(null); }} />}
      {action && <StudentActionModal action={action} onClose={() => setAction(null)} onConfirm={confirmStatus} />}
      {notice && <StudentToast message={notice} onClose={closeNotice} />}
    </>
  );
}

export default Students;
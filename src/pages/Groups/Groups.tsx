import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import PlatformHeader from "../../components/PlatformHeader/PlatformHeader";
import GroupToolbar from "../../components/GroupToolbar/GroupToolbar";
import GroupCard from "../../components/GroupCard/GroupCard";
import GroupFormModal from "../../components/GroupFormModal/GroupFormModal";
import GroupAddStudentModal from "../../components/GroupAddStudentModal/GroupAddStudentModal";
import GroupConfirmModal from "../../components/GroupConfirmModal/GroupConfirmModal";
import GroupsEmptyState from "../../components/GroupsEmptyState/GroupsEmptyState";
import StudentToast from "../../components/StudentToast/StudentToast";
import { turmaService } from "../../services/turmaService";
import { modalidadeService } from "../../services/modalidadeService";
import { personalTrainerService } from "../../services/personalTrainerService";
import { handleApiError } from "../../utils/handleApiError";
import { normalize } from "./groupData";
import type { Modalidade } from "../../types/modalidade";
import type { AlunoResponse } from "../../types/student";
import type { TurmaResponse } from "../../types/turma";
import "./Groups.css";

type Form = { mode: "create" } | { mode: "edit"; group: TurmaResponse };
type Removal = { group: TurmaResponse; studentId: string };

function Groups() {
  const [groups, setGroups] = useState<TurmaResponse[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [modalities, setModalities] = useState<Modalidade[]>([]);
  const [students, setStudents] = useState<AlunoResponse[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<number | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [adding, setAdding] = useState<TurmaResponse | null>(null);
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [removing, setRemoving] = useState(false);
  const [notice, setNotice] = useState("");

  const closeNotice = useCallback(() => setNotice(""), []);

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await turmaService.listar());
      setLoadFailed(false);
    } catch (err) {
      handleApiError(err, "Não foi possível carregar as turmas.");
      setLoadFailed(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    modalidadeService.listarTodas().then(setModalities).catch((err) => handleApiError(err, "Erro ao carregar as modalidades."));
    // Só alunos ativos podem entrar em uma turma.
    personalTrainerService.listarTodos()
      .then((data) => { setStudents(data.filter((aluno) => aluno.status === "ATIVO")); setStudentsLoaded(true); })
      .catch((err) => handleApiError(err, "Não foi possível carregar a lista de alunos."));
  }, [loadGroups]);

  // Filtros: apenas as modalidades que já possuem turma.
  const groupModalities = Array.from(new Map(groups.map((group) => [group.modalidadeId, { id: group.modalidadeId, nome: group.nomeModalidade }])).values())
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const activeFilter = groupModalities.some((modality) => modality.id === filter) ? filter : null;
  const suggestedModalityIds = [...new Set([...groupModalities.map((m) => m.id), ...students.flatMap((aluno) => aluno.modalidades.map((m) => m.id))])];

  const term = normalize(search.trim());
  const visible = groups
    .filter((group) => normalize(group.nome).includes(term) && (activeFilter === null || group.modalidadeId === activeFilter))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  function openCreate() {
    setNotice("");
    // US-07 - Cenário 2: sem alunos não há como montar a turma.
    if (studentsLoaded && students.length === 0) {
      toast.error("Precisa ter pelo menos um aluno vinculado para conseguir criar uma turma");
      return;
    }
    setForm({ mode: "create" });
  }

  function handleSaved(message: string) {
    setForm(null);
    setAdding(null);
    setNotice(message);
    loadGroups();
  }

  // US-09 - Cenários 5 e 6: sempre confirma; se era o último aluno, o backend apaga a turma.
  async function confirmRemoval() {
    if (!removal) return;
    const { group, studentId } = removal;
    setRemoving(true);
    try {
      const { mensagem } = await turmaService.removerAluno(group.id, studentId);
      const lastStudent = group.alunos.length === 1;
      setGroups((previous) => lastStudent
        ? previous.filter((item) => item.id !== group.id)
        : previous.map((item) => item.id === group.id ? { ...item, alunos: item.alunos.filter((aluno) => aluno.id !== studentId), quantidadeAlunos: item.quantidadeAlunos - 1 } : item));
      setRemoval(null);
      setNotice(mensagem || "Aluno removido com sucesso!");
    } catch (err) {
      handleApiError(err, "Erro ao remover o aluno da turma.");
    } finally {
      setRemoving(false);
    }
  }

  const removalStudent = removal?.group.alunos.find((aluno) => aluno.id === removal.studentId);

  return (
    <>
      <PlatformHeader activePage="groups" />
      <main className="groups" aria-label="Grupos">
        <h1 className="groups__sr-only">Grupos</h1>
        <GroupToolbar search={search} onSearch={setSearch} modalities={groupModalities} filter={activeFilter} onFilter={setFilter} onRegister={openCreate} />
        {loaded && !loadFailed && visible.length === 0 && <GroupsEmptyState search={search.trim()} filtered={activeFilter !== null} onRegister={openCreate} />}
        {visible.length > 0 && (
          <section className="groups__grid" aria-label="Turmas cadastradas">
            {visible.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                activeStudents={students.length}
                removingId={removing ? removal?.studentId ?? null : null}
                onEdit={(selected) => { setNotice(""); setForm({ mode: "edit", group: selected }); }}
                onAddStudent={(selected) => { setNotice(""); setAdding(selected); }}
                onRemoveStudent={(selected, studentId) => { setNotice(""); setRemoval({ group: selected, studentId }); }}
              />
            ))}
          </section>
        )}
      </main>
      {form && (
        <GroupFormModal
          group={form.mode === "edit" ? form.group : undefined}
          modalities={modalities}
          suggestedModalityIds={suggestedModalityIds}
          students={students}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      )}
      {adding && <GroupAddStudentModal group={adding} students={students} onClose={() => setAdding(null)} onAdded={handleSaved} />}
      {removal && (
        <GroupConfirmModal
          title="Remover aluno?"
          description={`Clique para confirmar a remoção do aluno ${removalStudent?.nome ?? ""} da turma "${removal.group.nome}".${removal.group.alunos.length === 1 ? " Por ser o único aluno, a turma também será apagada." : ""}`}
          confirmLabel="Confirmar remoção"
          loading={removing}
          onClose={() => setRemoval(null)}
          onConfirm={confirmRemoval}
        />
      )}
      {notice && <StudentToast message={notice} onClose={closeNotice} />}
    </>
  );
}

export default Groups;

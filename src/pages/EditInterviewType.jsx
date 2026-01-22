import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * EditInterviewType (Settings)
 * - Cria / edita Tipo de Entrevista
 * - Edita Competências
 * - NOVO: vincula 1 Roteiro (interview_script) ao Tipo (interview_type)
 *   - Seleciona roteiro existente
 *   - OU cria novo roteiro na hora ("+ Criar novo roteiro")
 */
export default function EditInterviewType() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  // Usado no botão "Gerar descrição" por competência
  const [generatingIndex, setGeneratingIndex] = useState(null);

  // Dados do tipo
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cultura");
  const [competencies, setCompetencies] = useState([]);

  // NOVO: roteiros existentes e vínculo com o tipo
  const [scripts, setScripts] = useState([]);
  const [interviewScriptId, setInterviewScriptId] = useState("none"); // "none" | "new" | "<id>"
  const [creatingScript, setCreatingScript] = useState(false);
  const [newScriptName, setNewScriptName] = useState("");
  const [newScriptContent, setNewScriptContent] = useState("");

  const userId = useMemo(() => localStorage.getItem("userId"), []);

  /**
   * Carrega o Tipo de Entrevista (quando editando)
   * Endpoint atual retorna algo como:
   * { type: {...}, competencies: [...] }
   *
   * IMPORTANTE: aqui também tentamos ler type.interview_script_id (novo campo do DB/API).
   */
  useEffect(() => {
    if (isNew || !userId) return;

    fetch(`${BASE_URL}/interview_types/${id}?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        // Mantém padrão do seu arquivo: data.type / data.competencies
        setName(data?.type?.name || "");
        setCategory(data?.type?.category || "cultura");
        setCompetencies(Array.isArray(data?.competencies) ? data.competencies : []);

        // NOVO: preenche o roteiro vinculado (se o backend já estiver retornando)
        const linkedScriptId = data?.type?.interview_script_id;
        setInterviewScriptId(linkedScriptId ? String(linkedScriptId) : "none");
        setCreatingScript(false);
        setNewScriptName("");
        setNewScriptContent("");
      })
      .catch((err) => {
        console.error(err);
        alert("Erro ao carregar tipo de entrevista.");
      });
  }, [BASE_URL, id, isNew, userId]);

  /**
   * Carrega todos os roteiros do usuário (para o select)
   * GET /interview_scripts?user_id=...
   */
  useEffect(() => {
    if (!userId) return;

    fetch(`${BASE_URL}/interview_scripts?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        // Alguns endpoints retornam array direto; outros podem retornar { scripts: [...] }.
        // Mantemos robusto:
        const list = Array.isArray(data) ? data : (data?.scripts || []);
        setScripts(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error(err);
        // Não bloqueia a tela; só impede seleção de roteiros
        setScripts([]);
      });
  }, [BASE_URL, userId]);

  function handleAddCompetency() {
    setCompetencies([
      ...competencies,
      {
        name: "",
        description: "",
        insuficiente: "",
        abaixo_do_esperado: "",
        dentro_expectativas: "",
        excepcional: ""
      }
    ]);
  }

  /**
   * NOVO: handle de mudança do select de roteiros
   * - "none": desvincula
   * - "new": abre inputs para criar roteiro
   * - "<id>": vincula roteiro existente
   */
  function handleChangeScriptSelect(value) {
    setInterviewScriptId(value);

    if (value === "new") {
      setCreatingScript(true);
    } else {
      setCreatingScript(false);
      setNewScriptName("");
      setNewScriptContent("");
    }
  }

  /**
   * Salva Tipo + Competências
   * NOVO: também salva interview_script_id.
   *
   * Fluxo:
   * 1) Se creatingScript => cria roteiro (POST /interview_scripts) e pega ID
   * 2) Cria ou atualiza o tipo (POST/PATCH /interview_types) incluindo interview_script_id
   * 3) Upsert das competências (PATCH se tem id, senão POST)
   */
  async function handleSave() {
    if (!userId) {
      alert("Usuário não identificado. Faça login novamente.");
      return;
    }

    if (!name?.trim()) {
      alert("Informe o nome do Tipo de Entrevista.");
      return;
    }

    // 1) Determina o interview_script_id final
    let finalScriptId = null;

    if (creatingScript) {
      // Valida campos mínimos para criar roteiro
      if (!newScriptName?.trim()) {
        alert("Informe o nome do novo roteiro.");
        return;
      }
      if (!newScriptContent?.trim()) {
        alert("Informe o conteúdo do novo roteiro.");
        return;
      }

      // Cria roteiro
      const resScript = await fetch(`${BASE_URL}/interview_scripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: newScriptName,
          interview_script: newScriptContent
        })
      });

      const dataScript = await resScript.json();

      if (!resScript.ok) {
        console.error("Erro ao criar roteiro:", dataScript);
        alert(dataScript?.error || "Erro ao criar roteiro.");
        return;
      }

      // Suporta retorno como objeto direto {id,...} ou {script:{id}}
      const createdId = dataScript?.id ?? dataScript?.script?.id;
      if (!createdId) {
        console.error("Retorno inesperado ao criar roteiro:", dataScript);
        alert("Roteiro criado, mas não foi possível obter o ID.");
        return;
      }

      finalScriptId = createdId;

      // Atualiza lista de scripts localmente (opcional, melhora UX)
      setScripts((prev) => [
        ...prev,
        {
          id: createdId,
          name: newScriptName,
          interview_script: newScriptContent
        }
      ]);

      // Seleciona o roteiro recém-criado e fecha criação
      setInterviewScriptId(String(createdId));
      setCreatingScript(false);
      setNewScriptName("");
      setNewScriptContent("");
    } else {
      // Quando não criando, usa o que veio do select
      if (interviewScriptId !== "none" && interviewScriptId !== "new") {
        finalScriptId = Number(interviewScriptId);
        if (Number.isNaN(finalScriptId)) finalScriptId = null;
      }
    }

    // 2) Cria/Atualiza tipo
    let typeId = id;

    if (isNew) {
      const res = await fetch(`${BASE_URL}/interview_types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name,
          category,
          interview_script_id: finalScriptId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro ao criar tipo:", data);
        alert(data?.error || "Erro ao criar Tipo de Entrevista.");
        return;
      }

      // Seu código anterior usa data.type.id
      typeId = data?.type?.id ?? data?.id;

      if (!typeId) {
        console.error("Retorno inesperado ao criar tipo:", data);
        alert("Tipo criado, mas não foi possível obter o ID.");
        return;
      }
    } else {
      const res = await fetch(`${BASE_URL}/interview_types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name,
          category,
          interview_script_id: finalScriptId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro ao atualizar tipo:", data);
        alert(data?.error || "Erro ao atualizar Tipo de Entrevista.");
        return;
      }
    }

    // 3) Upsert das competências (mantém seu fluxo atual)
    for (const comp of competencies) {
      if (comp.id) {
        const res = await fetch(`${BASE_URL}/competencies/${comp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...comp,
            user_id: userId
          })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Erro ao atualizar competência:", data);
          alert(data?.error || "Erro ao atualizar competência.");
          return;
        }
      } else {
        const res = await fetch(`${BASE_URL}/interview_types/${typeId}/competencies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...comp,
            user_id: userId
          })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Erro ao criar competência:", data);
          alert(data?.error || "Erro ao criar competência.");
          return;
        }
      }
    }

    navigate("/settings/interview_types");
  }

  async function handleGenerateCompetency(index) {
    const competency = competencies[index];

    if (!userId) {
      alert("Usuário não identificado. Faça login novamente.");
      return;
    }

    if (!competency?.name?.trim()) {
      alert("Informe o nome da competência antes de gerar.");
      return;
    }

    setGeneratingIndex(index);

    try {
      const res = await fetch(`${BASE_URL}/interview_types/competencies/generate_texts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          interview_type_name: name,
          category,
          competency_name: competency.name
        })
      });

      const data = await res.json();

      if (!res.ok || !data?.texts) {
        throw new Error(data?.error || "Erro ao gerar textos");
      }

      const updated = [...competencies];
      updated[index] = {
        ...updated[index],
        description: data.texts.description || "",
        insuficiente: data.texts.insuficiente || "",
        abaixo_do_esperado: data.texts.abaixo_do_esperado || "",
        dentro_expectativas: data.texts.dentro_expectativas || "",
        excepcional: data.texts.excepcional || ""
      };

      setCompetencies(updated);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar descrição da competência.");
    } finally {
      setGeneratingIndex(null);
    }
  }

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h1>{isNew ? "Novo Tipo de Entrevista" : "Editar Tipo de Entrevista"}</h1>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div>
          <h3>Nome do Tipo</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <h3 style={{ marginTop: 24 }}>Categoria</h3>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="cultura">Cultura</option>
            <option value="tecnica">Técnica</option>
            <option value="gestor_lider">Gestor / Liderança</option>
          </select>
        </div>

        {/* NOVO: Vincular roteiro ao tipo */}
        <div>
          <h3 style={{ marginTop: 24 }}>Roteiro de Entrevista</h3>

          <select
            className="input"
            value={interviewScriptId}
            onChange={(e) => handleChangeScriptSelect(e.target.value)}
          >
            <option value="none">Nenhum</option>

            {scripts.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}

            <option value="new">+ Criar novo roteiro</option>
          </select>

          {creatingScript && (
            <div className="card" style={{ marginTop: 12 }}>
              <h4>Novo roteiro</h4>

              <label style={{ display: "block", marginTop: 8 }}>Nome do novo roteiro</label>
              <input
                className="input"
                value={newScriptName}
                onChange={(e) => setNewScriptName(e.target.value)}
                placeholder="Ex.: Roteiro Técnico - Backend"
              />

              <label style={{ display: "block", marginTop: 12 }}>Conteúdo do roteiro</label>
              <textarea
                className="input_text"
                rows={8}
                value={newScriptContent}
                onChange={(e) => setNewScriptContent(e.target.value)}
                placeholder="Cole aqui o roteiro (perguntas, critérios, etc.)"
              />

              <div style={{ marginTop: 12, color: "var(--muted)" }}>
                O roteiro será criado e automaticamente vinculado a este tipo quando você salvar.
              </div>
            </div>
          )}
        </div>

        {/* Competências */}
        <div>
          <h3 style={{ width: "100%", marginTop: 32 }}>Competências</h3>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Insuficiente</th>
                <th>Abaixo do Esperado</th>
                <th>Dentro das Expectativas</th>
                <th>Excepcional</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {competencies.map((comp, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <textarea
                        className="input_text"
                        value={comp.name}
                        placeholder="Nome da competência"
                        onChange={(e) => {
                          const updated = [...competencies];
                          updated[index].name = e.target.value;
                          setCompetencies(updated);
                        }}
                      />
                      <button
                        onClick={() => handleGenerateCompetency(index)}
                        disabled={generatingIndex === index || !comp.name?.trim()}
                        style={{ minWidth: 160 }}
                      >
                        {generatingIndex === index ? "Gerando..." : "Gerar descrição"}
                      </button>
                    </div>
                  </td>

                  <td>
                    <textarea
                      value={comp.description}
                      onChange={(e) => {
                        const arr = [...competencies];
                        arr[index].description = e.target.value;
                        setCompetencies(arr);
                      }}
                      className="input_text"
                    />
                  </td>

                  <td>
                    <textarea
                      value={comp.insuficiente}
                      onChange={(e) => {
                        const arr = [...competencies];
                        arr[index].insuficiente = e.target.value;
                        setCompetencies(arr);
                      }}
                      className="input_text"
                    />
                  </td>

                  <td>
                    <textarea
                      value={comp.abaixo_do_esperado}
                      onChange={(e) => {
                        const arr = [...competencies];
                        arr[index].abaixo_do_esperado = e.target.value;
                        setCompetencies(arr);
                      }}
                      className="input_text"
                    />
                  </td>

                  <td>
                    <textarea
                      value={comp.dentro_expectativas}
                      onChange={(e) => {
                        const arr = [...competencies];
                        arr[index].dentro_expectativas = e.target.value;
                        setCompetencies(arr);
                      }}
                      className="input_text"
                    />
                  </td>

                  <td>
                    <textarea
                      value={comp.excepcional}
                      onChange={(e) => {
                        const arr = [...competencies];
                        arr[index].excepcional = e.target.value;
                        setCompetencies(arr);
                      }}
                      className="input_text"
                    />
                  </td>

                  <td>
                    <button
                      onClick={() => {
                        const arr = [...competencies];
                        arr.splice(index, 1);
                        setCompetencies(arr);
                      }}
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {competencies.length === 0 && (
            <div className="card" style={{ color: "var(--muted)", marginBottom: 32 }}>
              Nenhuma competência adicionada.
            </div>
          )}

          <button onClick={handleAddCompetency}>+ Adicionar Competência</button>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={handleSave}>Salvar Tipo</button>
        <button style={{ marginLeft: 12 }} onClick={() => navigate("/settings/interview_types")}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

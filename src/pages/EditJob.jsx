import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function EditJob() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Estados da vaga
  // ---------------------------------------------------------------------------
  const [name, setName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobResponsibilities, setJobResponsibilities] = useState("");

  // Tipos existentes
  const [interviewTypes, setInterviewTypes] = useState([]);
  const [selectedInterviewTypeIds, setSelectedInterviewTypeIds] = useState([]);

  // Novo tipo (SOMENTE CRIAÇÃO)
  const [createNewType, setCreateNewType] = useState(false);
  const [newInterviewType, setNewInterviewType] = useState({
    name: "",
    category: "cultura",
    competencies: []
  });

  const [generatingIndex, setGeneratingIndex] = useState(null);
  const [suggestedCompetencies, setSuggestedCompetencies] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // ---------------------------------------------------------------------------
  // LOAD INICIAL (CRIAÇÃO E EDIÇÃO)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // 1️⃣ Tipos de entrevista
    fetch(`${BASE_URL}/interview_types?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setInterviewTypes(data.types || []));

    // 2️⃣ EDIÇÃO → carregar vaga
    if (!isNew) {
      fetch(`${BASE_URL}/jobs/${id}`)
        .then(res => {
          if (!res.ok) throw new Error("Vaga não encontrada");
          return res.json();
        })
        .then(data => {
          const job = data.job;

          setName(job.name || "");
          setJobDescription(job.job_description || "");
          setJobResponsibilities(job.job_responsibilities || "");

          setSelectedInterviewTypeIds(
            data.interview_types?.map(t => t.id) || []
          );
        })
        .catch(err => {
          console.error(err);
          alert("Erro ao carregar vaga");
          navigate("/jobs");
        });
    }
  }, [id, isNew, navigate]);

  // ---------------------------------------------------------------------------
  // ALTERAÇÃO DO NOME DA ENTREVISTA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isNew) return;
    if (!createNewType) return;
    if (!newInterviewType.category) return;

    const baseMap = {
      cultura: "Entrevista com RH",
      tecnica: "Entrevista Técnica",
      gestor_lider: "Entrevista com liderança"
    };

    const baseName = baseMap[newInterviewType.category];
    if (!baseName) return;

    const currentName = newInterviewType.name || "";

    // Só atualiza se o nome ainda estiver no padrão automático
    const isAutoName =
      currentName === "" ||
      currentName.startsWith("Entrevista com RH") ||
      currentName.startsWith("Entrevista Técnica") ||
      currentName.startsWith("Entrevista com liderança");

    if (!isAutoName) return;

    const finalName = name && name.trim()
      ? `${baseName} - ${name}`
      : baseName;

    setNewInterviewType(prev => ({
      ...prev,
      name: finalName
    }));
  }, [
    isNew,
    createNewType,
    newInterviewType.category,
    name
  ]);


  // ---------------------------------------------------------------------------
  // Toggle tipo existente
  // ---------------------------------------------------------------------------
  function toggleInterviewType(typeId) {
    setSelectedInterviewTypeIds(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  }

  // ---------------------------------------------------------------------------
  // Adicionar competência (novo tipo)
  // ---------------------------------------------------------------------------
  function addNewCompetency() {
    setNewInterviewType(prev => ({
      ...prev,
      competencies: [
        ...prev.competencies,
        {
          name: "",
          description: "",
          insuficiente: "",
          abaixo_do_esperado: "",
          dentro_expectativas: "",
          excepcional: ""
        }
      ]
    }));
  }

  // ---------------------------------------------------------------------------
  // IA — gerar textos da competência
  // ---------------------------------------------------------------------------
  async function handleGenerateCompetency(index) {
    const userId = localStorage.getItem("userId");
    const comp = newInterviewType.competencies[index];

    if (!comp?.name) {
      alert("Informe o nome da competência.");
      return;
    }

    setGeneratingIndex(index);

    try {
      const res = await fetch(
        `${BASE_URL}/interview_types/competencies/generate_texts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            interview_type_name: newInterviewType.name || name,
            category: newInterviewType.category,
            competency_name: comp.name
          })
        }
      );

      const data = await res.json();
      if (!res.ok || !data.texts) throw new Error();

      const updated = [...newInterviewType.competencies];
      updated[index] = { ...updated[index], ...data.texts };

      setNewInterviewType(prev => ({
        ...prev,
        competencies: updated
      }));
    } catch {
      alert("Erro ao gerar descrição.");
    } finally {
      setGeneratingIndex(null);
    }
  }

  // ---------------------------------------------------------------------------
  // IA — sugerir competências (inline) com contexto da vaga
  // ---------------------------------------------------------------------------
  async function handleSuggestCompetenciesInline() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("Usuário não identificado. Faça login novamente.");
      return;
    }

    if (!newInterviewType.name?.trim()) {
      alert("Informe o nome do tipo de entrevista.");
      return;
    }

    if (!name?.trim()) {
      alert("Informe o nome da vaga.");
      return;
    }

    setLoadingSuggestions(true);
    setSuggestedCompetencies([]);

    try {
      const res = await fetch(
        `${BASE_URL}/interview_types/0/suggest_competencies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: Number(userId),

            // necessários para o modo inline (tipo virtual)
            interview_type_name: newInterviewType.name,
            category: newInterviewType.category,

            job_context: {
              name,
              job_description: jobDescription,
              job_responsibilities: jobResponsibilities
            }
          })
        }
      );

      const data = await res.json();
      console.log("Resposta IA:", data);

      if (!res.ok || !data.competencies) {
        // tenta mostrar erro real do backend quando existir
        alert(data?.error || "Erro ao sugerir competências.");
        return;
      }

      // evitar duplicadas (e ignorar vazios)
      const existing = newInterviewType.competencies
        .map(c => (c?.name || "").toLowerCase().trim())
        .filter(Boolean);

      const filtered = (data.competencies || []).filter(c => {
        const n = (c?.name || "").toLowerCase().trim();
        if (!n) return false;
        return !existing.includes(n);
      });

      setSuggestedCompetencies(filtered);

    } catch (err) {
      console.error(err);
      alert("Erro ao sugerir competências.");
    } finally {
      setLoadingSuggestions(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Adicionar competência sugerida (com todos os campos)
  // ---------------------------------------------------------------------------
  function addSuggestedCompetencyInline(item) {
    setNewInterviewType(prev => ({
      ...prev,
      competencies: [
        ...prev.competencies,
        {
          name: item.name,
          description: "",
          insuficiente: "",
          abaixo_do_esperado: "",
          dentro_expectativas: "",
          excepcional: ""
        }
      ]
    }));

    setSuggestedCompetencies(prev =>
      prev.filter(c => c.name !== item.name)
    );
  }

  // ---------------------------------------------------------------------------
  // SALVAR
  // ---------------------------------------------------------------------------
  async function handleSave() {
    const userId = localStorage.getItem("userId");

    const payload = {
      user_id: Number(userId),
      name,
      job_description: jobDescription,
      job_responsibilities: jobResponsibilities,
      interview_type_ids: selectedInterviewTypeIds
    };

    // 🔒 NOVO TIPO SOMENTE NA CRIAÇÃO
    if (isNew && createNewType) {
      payload.new_interview_type = newInterviewType;
    }

    const url = isNew ? `${BASE_URL}/jobs` : `${BASE_URL}/jobs/${id}`;
    const method = isNew ? "POST" : "PATCH";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    navigate("/jobs");
  }

  function generateInterviewTypeName(category, jobName) {
    const baseMap = {
      cultura: "Entrevista com RH",
      tecnica: "Entrevista Técnica",
      gestor_lider: "Entrevista com liderança"
    };

    const base = baseMap[category] || "Entrevista";

    if (jobName && jobName.trim()) {
      return `${base} - ${jobName}`;
    }

    return base;
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h1>{isNew ? "Nova Vaga" : "Editar Vaga"}</h1>
      </div>

      <div className="card">
        <h3>Nome da Vaga</h3>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <h3 style={{ marginTop: 24 }}>Descrição da Vaga</h3>
        <textarea
          className="input_text"
          rows={4}
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
        />

        <h3 style={{ marginTop: 24 }}>Responsabilidades</h3>
        <textarea
          className="input_text"
          rows={4}
          value={jobResponsibilities}
          onChange={e => setJobResponsibilities(e.target.value)}
        />

        <h3 style={{ marginTop: 32 }}>Entrevistas da Vaga</h3>

        {interviewTypes.map(type => (
          <label key={type.id} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={selectedInterviewTypeIds.includes(type.id)}
              onChange={() => toggleInterviewType(type.id)}
            />{" "}
            {type.name} ({type.category})
          </label>
        ))}

        {/* 🔒 “OUTRO” APENAS NA CRIAÇÃO */}
        {isNew && (
          <label style={{ display: "block", marginTop: 12 }}>
            <input
              type="checkbox"
              checked={createNewType}
              onChange={e => setCreateNewType(e.target.checked)}
            />{" "}
            Outra (criar nova entrevista para a vaga)
          </label>
        )}

        {/* BLOCO INLINE SOMENTE NA CRIAÇÃO */}
        {isNew && createNewType && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3>Nova entrevista para a vaga:</h3> 
            <select
              className="input"
              value={newInterviewType.category}
              placeholder="Entrevista de:"
              style={{ marginTop: 12,  marginRight:24 }}
              onChange={e => {
                const newCategory = e.target.value;

                const autoName = generateInterviewTypeName(newCategory, name);

                setNewInterviewType(prev => ({
                  ...prev,
                  category: newCategory,
                  name: autoName
                }));
              }}
            >
              <option value="cultura">Cultura</option>
              <option value="tecnica">Técnica</option>
              <option value="gestor_lider">Gestor / Liderança</option>
            </select>
            
            <input
              className="input"
              placeholder="Nome da entrevista"
              value={newInterviewType.name}
              onChange={e =>
                setNewInterviewType(prev => ({ ...prev, name: e.target.value }))
              }
            />           

            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <button
                onClick={handleSuggestCompetenciesInline}
                disabled={loadingSuggestions}
              >
                {loadingSuggestions ? "Sugerindo..." : "Sugerir competências (IA)"}
              </button>
            </div>

            {/* ✅ LISTAGEM DAS COMPETÊNCIAS SUGERIDAS */}
            {suggestedCompetencies.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h4>Competências sugeridas</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {suggestedCompetencies.map(item => (
                    <li key={item.name} style={{ marginBottom: 12 }}>
                      <strong>{item.name}</strong>
                      <p style={{ color: "var(--muted)", margin: "4px 0" }}>
                        {item.reason}
                      </p>
                      <button onClick={() => addSuggestedCompetencyInline(item)}>
                        Adicionar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <h4 style={{ marginTop: 24 }}>Competências</h4>

            <table style={{ width: "100%" }}>
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
                {newInterviewType.competencies.map((comp, index) => (
                  <tr key={index}>
                    <td>
                      <textarea
                        className="input_text"
                        value={comp.name}
                        onChange={e => {
                          const arr = [...newInterviewType.competencies];
                          arr[index].name = e.target.value;
                          setNewInterviewType(prev => ({
                            ...prev,
                            competencies: arr
                          }));
                        }}
                      />
                      <button
                        onClick={() => handleGenerateCompetency(index)}
                        disabled={generatingIndex === index}
                      >
                        {generatingIndex === index ? "Gerando..." : "Gerar descrição"}
                      </button>
                    </td>

                    {[
                      "description",
                      "insuficiente",
                      "abaixo_do_esperado",
                      "dentro_expectativas",
                      "excepcional"
                    ].map(field => (
                      <td key={field}>
                        <textarea
                          className="input_text"
                          value={comp[field]}
                          onChange={e => {
                            const arr = [...newInterviewType.competencies];
                            arr[index][field] = e.target.value;
                            setNewInterviewType(prev => ({
                              ...prev,
                              competencies: arr
                            }));
                          }}
                        />
                      </td>
                    ))}

                    <td>
                      <button
                        onClick={() => {
                          const arr = [...newInterviewType.competencies];
                          arr.splice(index, 1);
                          setNewInterviewType(prev => ({
                            ...prev,
                            competencies: arr
                          }));
                        }}
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={addNewCompetency} style={{ marginTop: 12 }}>
              + Adicionar Competência
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={handleSave}>Salvar</button>
        <button style={{ marginLeft: 12 }} onClick={() => navigate("/jobs")}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
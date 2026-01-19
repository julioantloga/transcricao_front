/* =============================================================================
   FILE: pages/Candidates.jsx
   RESPONSABILIDADE: Listagem de candidatos
   ============================================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    fetch(`${BASE_URL}/candidates?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setCandidates(data.candidates || []));
  }, []);

  async function handleDelete(id) {
    const confirm = window.confirm("Deseja excluir este candidato?");
    if (!confirm) return;

    await fetch(`${BASE_URL}/candidates/${id}`, {
      method: "DELETE"
    });

    setCandidates(candidates.filter(c => c.id !== id));
  }

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h1>Candidatos</h1>
        <button onClick={() => navigate("/candidates/new")}>
          + Novo Candidato
        </button>
      </div>

      <div className="card">
        <table style={{ width: "100%" }}>
          <tbody>
            {candidates.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td style={{ width: 120 }}>
                  <button onClick={() => navigate(`/candidates/${c.id}`)}>
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    style={{ marginLeft: 8, background: "#f85149", color: "#fff" }}
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            Nenhum candidato cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: pages/EditCandidate.jsx
   RESPONSABILIDADE: Criar / editar candidato
   ============================================================================= */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BASE_URL_CANDIDATE = import.meta.env.VITE_API_URL;

export default function EditCandidate() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [resume, setResume] = useState("");

  useEffect(() => {
    if (!isNew) {
      fetch(`${BASE_URL_CANDIDATE}/candidates/${id}`)
        .then(res => res.json())
        .then(data => {
          setName(data.candidate.name || "");
          setResume(data.candidate.resume_transcript || "");
        });
    }
  }, [id, isNew]);

  async function handleSave() {
    const userId = localStorage.getItem("userId");

    if (isNew) {
      await fetch(`${BASE_URL_CANDIDATE}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name,
          resume_transcript: resume
        })
      });
    } else {
      await fetch(`${BASE_URL_CANDIDATE}/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          resume_transcript: resume
        })
      });
    }

    navigate("/candidates");
  }

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h1>{isNew ? "Novo Candidato" : "Editar Candidato"}</h1>
      </div>

      <div className="card">
        <h3>Nome</h3>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <h3 style={{ marginTop: 24 }}>Transcrição do Currículo</h3>
        <textarea
          className="input_text"
          value={resume}
          onChange={e => setResume(e.target.value)}
          rows={10}
        />

        <button onClick={handleSave} style={{ marginTop: 24 }}>
          Salvar
        </button>
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: pages/EditJob.jsx
   RESPONSABILIDADE: Criar / editar vaga
   ============================================================================= */

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
    category: "",
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

/* =============================================================================
   FILE: pages/Home.jsx
   RESPONSABILIDADE: Página inicial / entrevistas
   ============================================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL_HOME = import.meta.env.VITE_API_URL;

export default function Home() {
  const [interviews, setInterviews] = useState([]);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const userId = localStorage.getItem("userId");
        const res = await fetch(`${BASE_URL_HOME}/interviews?user_id=${userId}`);
        const json = await res.json();
        setInterviews(json.interviews || []);
      } catch (err) {
        console.error("Erro ao buscar entrevistas:", err);
        setErro("Erro ao buscar entrevistas");
      }
    }

    fetchData();
  }, []);

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h2>Transcrição e Parecer de Entrevistas</h2>
        <p>
          Selecione uma entrevista para visualizar ou iniciar uma nova transcrição
        </p>
      </div>

      <div className="card">
        <h2>Suas entrevistas</h2>

        {erro && <p style={{ color: "red" }}>{erro}</p>}

        {!erro && interviews.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            Nenhuma entrevista encontrada.
          </p>
        )}

        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {interviews.map(i => (
            <li key={i.id}>
              <a href={`/interview_transcription?id=${i.id}`}>
                <strong>{i.job_title || "Vaga sem nome"}</strong>
                <br />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Criada em: {new Date(i.created_at).toLocaleString("pt-BR")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: pages/JobProfile.jsx
   RESPONSABILIDADE: Perfil da vaga + entrevistas + chat
   ============================================================================= */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import JobChat from "../components/JobChat";

const BASE_URL_PROFILE = import.meta.env.VITE_API_URL;

export default function JobProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const jobId = searchParams.get("id");
  const userId = localStorage.getItem("userId");

  const [job, setJob] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId || !userId) return;

    async function loadData() {
      try {
        const jobRes = await fetch(`${BASE_URL_PROFILE}/jobs/${jobId}`);
        const jobJson = await jobRes.json();
        setJob(jobJson.job);

        const intRes = await fetch(
          `${BASE_URL_PROFILE}/jobs/${jobId}/interviews?user_id=${userId}`
        );
        const intJson = await intRes.json();
        setInterviews(intJson.interviews || []);
      } catch {
        setError("Erro ao carregar perfil da vaga");
      }
    }

    loadData();
  }, [jobId, userId]);

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h2>{job ? job.name : "Carregando..."}</h2>

        {job && <JobChat jobId={jobId} />}

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      <div className="card">
        <h2>Entrevistas</h2>

        {interviews.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            Nenhuma entrevista vinculada a esta vaga.
          </p>
        )}

        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {interviews.map(i => (
            <li
              key={i.id}
              onClick={() => navigate(`/interview_transcription?id=${i.id}`)}
            >
              <strong>{i.candidate_name}</strong> – {i.job_title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: pages/Jobs.jsx
   RESPONSABILIDADE: Listagem de vagas
   ============================================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL_JOBS = import.meta.env.VITE_API_URL;

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    fetch(`${BASE_URL_JOBS}/jobs?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setJobs(data.jobs || []));
  }, []);

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h1>Vagas</h1>
        <button onClick={() => navigate("/jobs/new")}>
          + Nova Vaga
        </button>
      </div>

      <div className="card">
        <table style={{ width: "100%" }}>
          <tbody>
            {jobs.map(job => (
              <tr
                key={job.id}
                onClick={() => navigate(`/job_profile?id=${job.id}`)}
              >
                <td>{job.name}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {jobs.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            Nenhuma vaga cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}

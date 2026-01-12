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

const BASE_URL_JOB = import.meta.env.VITE_API_URL;

export default function EditJob() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobResponsibilities, setJobResponsibilities] = useState("");

  useEffect(() => {
    if (!isNew) {
      fetch(`${BASE_URL_JOB}/jobs/${id}`)
        .then(res => res.json())
        .then(data => {
          const job = data.job;
          setName(job.name || "");
          setJobDescription(job.job_description || "");
          setJobResponsibilities(job.job_responsibilities || "");
        });
    }
  }, [id, isNew]);

  async function handleSave() {
    const userId = localStorage.getItem("userId");

    if (isNew) {
      await fetch(`${BASE_URL_JOB}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name,
          job_description: jobDescription,
          job_responsibilities: jobResponsibilities
        })
      });
    } else {
      await fetch(`${BASE_URL_JOB}/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          job_description: jobDescription,
          job_responsibilities: jobResponsibilities
        })
      });
    }

    navigate("/jobs");
  }

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
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
        />

        <h3 style={{ marginTop: 24 }}>Atividades da Vaga</h3>
        <textarea
          className="input_text"
          value={jobResponsibilities}
          onChange={e => setJobResponsibilities(e.target.value)}
        />

        <div style={{ marginTop: 24 }}>
          <button onClick={handleSave}>Salvar</button>
        </div>
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

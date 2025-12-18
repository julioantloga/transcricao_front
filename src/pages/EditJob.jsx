// Objetivo: Criar / Editar Vagas
// Layout e comportamento espelhados de EditInterviewType.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function EditJob() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobResponsibilities, setJobResponsibilities] = useState("");

  useEffect(() => {
    if (!isNew) {
      fetch(`${BASE_URL}/jobs/${id}`)
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
      await fetch(`${BASE_URL}/jobs`, {
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
      await fetch(`${BASE_URL}/jobs/${id}`, {
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
          <button onClick={handleSave}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function EditCandidate() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [resume, setResume] = useState("");

  useEffect(() => {
    if (!isNew) {
      fetch(`${BASE_URL}/candidates/${id}`)
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
      await fetch(`${BASE_URL}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name,
          resume_transcript: resume
        })
      });
    } else {
      await fetch(`${BASE_URL}/candidates/${id}`, {
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

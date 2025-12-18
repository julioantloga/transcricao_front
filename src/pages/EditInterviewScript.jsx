// Objetivo: Criar / Editar Roteiro de Entrevista
// Espelha EditInterviewType.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function EditInterviewScript() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [script, setScript] = useState("");

  useEffect(() => {
    if (!isNew) {
      fetch(`${BASE_URL}/interview_scripts/${id}`)
        .then(res => res.json())
        .then(data => {
          setName(data.script.name || "");
          setScript(data.script.interview_script || "");
        });
    }
  }, [id, isNew]);

  async function handleSave() {
    const userId = localStorage.getItem("userId");

    if (isNew) {
      await fetch(`${BASE_URL}/interview_scripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name,
          interview_script: script
        })
      });
    } else {
      await fetch(`${BASE_URL}/interview_scripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          interview_script: script
        })
      });
    }

    navigate("/settings/interview_scripts");
  }

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h1>{isNew ? "Novo Roteiro de Entrevista" : "Editar Roteiro de Entrevista"}</h1>
      </div>

      <div className="card">
        <h3>Nome do Roteiro</h3>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <h3 style={{ marginTop: 24 }}>Roteiro da Entrevista</h3>
        <textarea
          className="input_text"
          value={script}
          onChange={e => setScript(e.target.value)}
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
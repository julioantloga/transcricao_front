// Objetivo: Listagem de Roteiros de Entrevista
// Espelha InterviewTypes.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function InterviewScripts() {

  const [scripts, setScripts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    fetch(`${BASE_URL}/interview_scripts?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setScripts(data.scripts || []));
  }, []);

  async function handleDelete(id) {
    const confirm = window.confirm("Tem certeza que deseja excluir este roteiro?");
    if (!confirm) return;

    await fetch(`${BASE_URL}/interview_scripts/${id}`, {
        method: "DELETE"
    });

    setScripts(scripts.filter(s => s.id !== id));
    }

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h1>Roteiros de Entrevista</h1>
        <button
          onClick={() => navigate("/settings/interview_scripts/new")}
          style={{ marginBottom: 16 }}
        >
          + Novo Roteiro
        </button>
      </div>

      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {scripts.map(s => (
              <tr key={s.id}>
                <td style={{ padding: "8px 0" }}>
                  {s.name}
                </td>
                <td style={{ width: 120 }}>
                    <button onClick={() => navigate(`/settings/interview_scripts/${s.id}`)}>
                        Editar
                    </button>

                    <button
                        onClick={() => handleDelete(s.id)}
                        style={{ marginLeft: 8, background: "#f85149", color: "#fff" }}
                    > X                        
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {scripts.length === 0 && (
            <p style={{ color: "var(--muted)" }}>
                Nenhuma reteiro cadastrado.
            </p> 
        )}       

      </div>
    </div>
  );
}

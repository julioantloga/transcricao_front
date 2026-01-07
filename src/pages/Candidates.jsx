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

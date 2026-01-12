/* =============================================================================
   FILE: pages/ConfigMenu.jsx
   RESPONSABILIDADE: Menu intermediário de configurações
   ============================================================================= */

import { useNavigate } from "react-router-dom";

export default function ConfigMenu() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "calc(60vh - 120px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 300px)",
          gap: 24
        }}
      >
        <div
          className="card"
          style={{ cursor: "pointer", textAlign: "center" }}
          onClick={() => navigate("/settings/interview_types")}
        >
          <h2>Tipos de Entrevista</h2>
          <p style={{ color: "var(--muted)" }}>
            Defina modelos de entrevista e competências avaliadas
          </p>
        </div>

        <div
          className="card"
          style={{ cursor: "pointer", textAlign: "center" }}
          onClick={() => navigate("/settings/interview_scripts")}
        >
          <h2>Roteiros de Entrevista</h2>
          <p style={{ color: "var(--muted)" }}>
            Crie e reutilize roteiros de entrevista
          </p>
        </div>
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: pages/EditInterviewScript.jsx
   RESPONSABILIDADE: Criar / editar roteiro de entrevista
   ============================================================================= */

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
          <button onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: pages/EditInterviewType.jsx
   RESPONSABILIDADE: Criar / editar tipo de entrevista e competências
   ============================================================================= */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function EditInterviewType() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [competencies, setCompetencies] = useState([]);
  const [category, setCategory] = useState("cultura");

  useEffect(() => {
    if (!isNew) {
      fetch(`${BASE_URL}/interview_types/${id}`)
        .then(res => res.json())
        .then(data => {
          setName(data.type.name);
          setCategory(data.type.category || "cultura");
          setCompetencies(data.competencies);
        });
    }
  }, []);

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

  async function handleSave() {
    const userId = localStorage.getItem("userId");

    let typeId = id;

    if (isNew) {
      const res = await fetch(`${BASE_URL}/interview_types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, name, category })
      });
      const data = await res.json();
      typeId = data.type.id;
    } else {
      await fetch(`${BASE_URL}/interview_types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category })
      });
    }

    for (const comp of competencies) {
      if (comp.id) {
        await fetch(`${BASE_URL}/competencies/${comp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(comp)
        });
      } else {
        await fetch(`${BASE_URL}/interview_types/${typeId}/competencies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(comp)
        });
      }
    }

    navigate("/settings/interview_types");
  }

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h1>{isNew ? "Novo Tipo de Entrevista" : "Editar Tipo de Entrevista"}</h1>
      </div>

      <div className="card">
        <h3>Nome do Tipo</h3>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <h3 style={{ marginTop: 24 }}>Categoria</h3>
        <select
          className="input"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="cultura">Cultura</option>
          <option value="tecnica">Técnica</option>
          <option value="gestor_lider">Gestor / Liderança</option>
        </select>

        <h3 style={{ marginTop: 32 }}>Competências</h3>

        <button onClick={handleAddCompetency}>
          + Adicionar Competência
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={handleSave}>Salvar Tipo</button>
        <button
          style={{ marginLeft: 12 }}
          onClick={() => navigate("/settings/interview_types")}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: pages/InterviewScripts.jsx
   RESPONSABILIDADE: Listagem de roteiros de entrevista
   ============================================================================= */

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
                <td>{s.name}</td>
                <td>
                  <button onClick={() => navigate(`/settings/interview_scripts/${s.id}`)}>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    style={{ marginLeft: 8, background: "#f85149", color: "#fff" }}
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {scripts.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            Nenhum roteiro cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: pages/InterviewTypes.jsx
   RESPONSABILIDADE: Listagem de tipos de entrevista
   ============================================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function InterviewTypes() {
  const [types, setTypes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    fetch(`${BASE_URL}/interview_types?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setTypes(data.types || []));
  }, []);

  async function handleDelete(id) {
    const confirm = window.confirm("Tem certeza que deseja excluir este tipo?");
    if (!confirm) return;

    await fetch(`${BASE_URL}/interview_types/${id}`, { method: "DELETE" });
    setTypes(types.filter(t => t.id !== id));
  }

  return (
    <div className="layout" style={{ padding: 24 }}>
      <div className="card">
        <h1>Tipos de Entrevista</h1>
        <button
          onClick={() => navigate("/settings/interview_types/new")}
          style={{ marginBottom: 16 }}
        >
          + Novo Tipo
        </button>
      </div>

      <div className="card">
        <table>
          <tbody>
            {types.map(t => (
              <tr key={t.id}>
                <td>
                  <strong>[{t.category.toUpperCase()}]</strong> {t.name}
                </td>
                <td>
                  <button onClick={() => navigate(`/settings/interview_types/${t.id}`)}>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    style={{ marginLeft: 8, background: "#f85149", color: "#fff" }}
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: pages/Login.jsx
   RESPONSABILIDADE: Autenticação do usuário
   ============================================================================= */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoMind from "../assets/logo_mind.png";

const BASE_URL_LOGIN = import.meta.env.VITE_API_URL;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setErro(null);

    try {
      const res = await fetch(`${BASE_URL_LOGIN}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data?.error || "Erro ao fazer login");
        return;
      }

      localStorage.setItem("userId", data.userId);
      navigate("/");
    } catch {
      setErro("Erro interno ao fazer login");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <img src={logoMind} alt="Logo" style={{ height: 32, marginBottom: 20 }} />
      <h2>Login</h2>
      <h3>Transcrição e parecer de entrevistas</h3>

      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <form onSubmit={handleLogin}>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Usuário"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Senha"
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

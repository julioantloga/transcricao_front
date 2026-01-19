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
  const [generatingIndex, setGeneratingIndex] = useState(null);


  const [name, setName] = useState("");
  const [competencies, setCompetencies] = useState([]);
  const [category, setCategory] = useState("cultura");

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!isNew && userId) {
      fetch(`${BASE_URL}/interview_types/${id}?user_id=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setName(data.type.name);
          setCategory(data.type.category || "cultura");
          setCompetencies(data.competencies);
        });
    }
  }, [id, isNew]);

  function handleAddCompetency() {
    setCompetencies([
      ...competencies,
      { name: "", description: "", insuficiente: "", abaixo_do_esperado: "", dentro_expectativas: "", excepcional: "" }
    ]);
  }

  async function handleSave() {
    const userId = localStorage.getItem("userId");

    // criar tipo se novo
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
      console.log(category);  
      await fetch(`${BASE_URL}/interview_types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name,
          category
        })
      });
    }

    // garantir que cada competência existente seja inserida/atualizada
    for (const comp of competencies) {
      if (comp.id) {
        await fetch(`${BASE_URL}/competencies/${comp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...comp,
            user_id: userId
          })
        });
      } else {
        await fetch(`${BASE_URL}/interview_types/${typeId}/competencies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...comp,
            user_id: userId
          })
        });
      }
    }

    navigate("/settings/interview_types");
  }

  async function handleGenerateCompetency(index) {
    const userId = localStorage.getItem("userId");
    const competency = competencies[index];

    if (!competency?.name) {
      alert("Informe o nome da competência antes de gerar.");
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
            interview_type_name: name,
            category,
            competency_name: competency.name
          })
        }
      );

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
            onChange={e => setCategory(e.target.value)}
          >
            <option value="cultura">Cultura</option>
            <option value="tecnica">Técnica</option>
            <option value="gestor_lider">Gestor / Liderança</option>
          </select>
        </div>
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
                        onChange={e => {
                          const updated = [...competencies];
                          updated[index].name = e.target.value;
                          setCompetencies(updated);
                        }}
                      />
                      <button
                        onClick={() => handleGenerateCompetency(index)}
                        disabled={
                          generatingIndex === index || !comp.name?.trim()
                        }
                        style={{ minWidth: 160 }}
                      >
                        {generatingIndex === index ? "Gerando..." : "Gerar descrição"}
                      </button>
                    </div>
                  </td>

                  <td><textarea
                      type="text"
                      value={comp.description}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].description = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td><textarea
                      type="text"
                      value={comp.insuficiente}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].insuficiente = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td><textarea
                      type="text"
                      value={comp.abaixo_do_esperado}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].abaixo_do_esperado = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td><textarea
                      type="text"
                      value={comp.dentro_expectativas}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].dentro_expectativas = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

                  <td><textarea
                      type="text"
                      value={comp.excepcional}
                      onChange={(e) => {
                      const arr = [...competencies];
                      arr[index].excepcional = e.target.value;
                      setCompetencies(arr);
                      }}
                      className="input_text"
                  /></td>

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

          {/* ✅ Mostrar aviso se não houver competências */}
          {competencies.length === 0 && (
          <div className="card" style={{ color: "var(--muted)", marginBottom: 32 }}>
              Nenhuma competência adicionada.
          </div>
          )}    

          <button onClick={handleAddCompetency}>
              + Adicionar Competência
          </button>
        </div>
      </div>      


      <div style={{ marginTop: 24 }}>
        <button onClick={handleSave}>
          Salvar Tipo
        </button>
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

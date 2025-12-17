// front/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoMind from "../assets/logo_mind.png";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setErro(null);

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data?.error || "Erro ao fazer login");
        return;
      }

      // Salva o userId no localStorage
      localStorage.setItem("userId", data.userId);
      navigate("/"); // Redireciona para página principal

    } catch (err) {
      console.error("Erro ao logar:", err);
      setErro("Erro interno ao fazer login");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
        <img
          src={logoMind}
          alt="Logo"
          style={{ height: 32, marginBottom: 20 }}
        />
        <h2>Login</h2>
        <h3>Transcrição e parecer de entrevistas</h3>

        {erro && <p style={{ color: "red" }}>{erro}</p>}

        <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
            <label>Usuário</label>
            <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            />
        </div>

        <div style={{ marginBottom: 12 }}>
            <label>Senha</label>
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            />
        </div>

        <button type="submit" style={{ padding: "10px 16px" }}>
            Entrar
        </button>
        </form>
    </div>
  );
}

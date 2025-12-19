import { useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL;

/*
Objetivo:
Chat analítico baseado nas entrevistas da vaga (RAG via backend).
- Histórico apenas no frontend
- Cada pergunta é independente
*/

export default function JobChat({ jobId }) {
  const userId = localStorage.getItem("userId");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Olá! O que você quer saber sobre as entrevistas dessa vaga?"
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function sendQuestion() {
    if (!input.trim() || loading) return;

    const question = input.trim();

    setMessages(prev => [
      ...prev,
      { role: "user", content: question }
    ]);

    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/jobs/${jobId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          question
        })
      });

      if (!res.ok) {
        throw new Error("Erro ao consultar o chat");
      }

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.answer }
      ]);
    } catch (err) {
      console.error(err);
      setError("Erro ao obter resposta do assistente.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3>Assistente da Vaga</h3>

      {/* HISTÓRICO */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: 12,
          height: 280,
          overflowY: "auto",
          marginBottom: 12,
          background: "#0d1117"
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 12,
              whiteSpace: "pre-wrap",
              color: m.role === "assistant" ? "#c9d1d9" : "#ffffff"
            }}
          >
            <span style={{fontSize:14, color:"#862a86ff"}}><strong>
              {m.role === "assistant" ? "Assistente" : "Você"}:
            </strong></span>
            <div>{m.content}</div>
          </div>
        ))}

        {loading && (
          <p style={{ color: "var(--muted)" }}>
            Analisando...
          </p>
        )}
      </div>

      {/* INPUT */}
      <textarea
        className="input_text"
        placeholder="Digite sua pergunta..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        disabled={loading}
      />

      {error && (
        <p style={{ color: "red", marginTop: 8 }}>
          {error}
        </p>
      )}

      <button
        onClick={sendQuestion}
        disabled={loading || !input.trim()}
        style={{ marginTop: 8 }}
      >
        Enviar
      </button>
    </div>
  );
}

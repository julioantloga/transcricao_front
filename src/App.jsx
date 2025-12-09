import { useState } from "react";
import AudioRecorder from "./components/AudioRecorder";
import { transcreverAudio } from "./services/api";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [resultado, setResultado] = useState(() => {
    const textoSalvo = localStorage.getItem("transcricao");
    return textoSalvo ? { text: textoSalvo } : null;
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [diarizacao, setDiarizacao] = useState(false);
  const [statusTexto, setStatusTexto] = useState(null);
  
  const [metrics, setMetrics] = useState(null);

  const [form, setForm] = useState({
    job_description: "",
    notes: "",
    interview_roadmap: "",
    job_responsabilities: "",
    company_values: ""
  });

  const [parecer, setParecer] = useState(null);
  const [loadingParecer, setLoadingParecer] = useState(false);

  function formatTempo(segundos) {
    return segundos > 59
      ? `${(segundos / 60).toFixed(1)} min`
      : `${segundos.toFixed(1)}s`;
  }

  async function handleFinish({ file }) {
    setLoading(true);
    setErro(null);
    setResultado(null);
    setParecer(null);
    setMetrics(null);

    try {
      // 1. Envia o arquivo para o backend
      const form = new FormData();
      form.append("audio", file);
      form.append("diarizacao", diarizacao);

      const uploadRes = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: form,
      });

      const { id } = await uploadRes.json();

      if (!id) throw new Error("Erro ao iniciar transcrição");

      // 2. Inicia verificação periódica
      let intervalo;
      const checkStatus = async () => {
        const res = await fetch(`${BASE_URL}/status/${id}`);
        const status = await res.json();

        if (status.erro) {
          setErro(status.erro);
          clearInterval(intervalo);
          setLoading(false);
          return;
        }

        setStatusTexto(status.status); // <-- adicionar um state novo!

        if (status.pronto) {
          clearInterval(intervalo);
          setLoading(false);
          setResultado({ text: status.transcricao });
          setMetrics(status.metrics || null);
          localStorage.removeItem("transcricao");
        }
      };

      checkStatus(); // chamada inicial
      intervalo = setInterval(checkStatus, 3000); // a cada 3s
    } catch (err) {
      console.error("Erro na transcrição:", err);
      setErro("Erro ao transcrever áudio.");
      setLoading(false);
    }
  }


  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".wav")) {
      alert("Apenas arquivos .wav são suportados no upload.");
      return;
    }

    await handleFinish({ file });
  }

  async function handleSubmitParecer(e) {
    e.preventDefault();
    setLoadingParecer(true);
    setParecer(null);

    try {
      const res = await fetch(`${BASE_URL}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: resultado?.text,
          ...form
        })
      });

      const json = await res.json();
      setParecer(json.review);
    } catch (err) {
      console.error("Erro ao gerar parecer:", err);
      setParecer("❌ Erro ao gerar parecer.");
    } finally {
      setLoadingParecer(false);
    }
  }

  return (
    <>
      <div className="header">
        <h1>Entrevistas com IA</h1>
        <p style={{ color: "var(--muted)" }}>
          Gravação de áudio com transcrição automática e separação de falantes
        </p>
      </div>

      <div className="layout" style={{ padding: 16 }}>
        {/* LEFT */}
        <div className="card">
          <h2>Gravação</h2>

          <label style={{ display: "block", marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={diarizacao}
              onChange={(e) => setDiarizacao(e.target.checked)}
            />
            Identificar falantes
          </label>

          <AudioRecorder onFinish={handleFinish} />

          <div style={{ marginTop: 16 }}>
            <label style={{ fontWeight: 500 }}>
              Ou envie um arquivo WAV para transcrever:
            </label>
            <input
              type="file"
              accept=".wav"
              onChange={handleFileUpload}
              style={{ marginTop: 8 }}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="card scroll">
          <h2>Transcrição</h2>

          {loading && <p>{statusTexto || "Processando áudio..."}</p>}
          {erro && <p style={{ color: "red" }}>{erro}</p>}

          {!loading && !resultado && (
            <p style={{ color: "var(--muted)" }}>Nenhuma transcrição ainda.</p>
          )}

          {resultado?.error && (
            <p style={{ color: "red" }}>Erro da API: {resultado.error}</p>
          )}

          {metrics && (
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 16
              }}
            >
              {["audio", "converter", "transcription", "total"].map((key) => (
                <div
                  key={key}
                  className="card"
                  style={{
                    background: "#20262f",
                    padding: "8px 12px",
                    fontSize: 14,
                    color: "var(--text)"
                  }}
                >
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)}</strong>
                  <br />
                  {formatTempo(metrics[key])}
                </div>
              ))}

              <div
                className="card"
                style={{
                  background: metrics.eficacia < 0.5 ? "#f85149" : "#58a6ff",
                  color: "#000",
                  padding: "8px 12px",
                  fontSize: 14
                }}
              >
                <strong>Eficácia</strong>
                <br />
                { typeof metrics.eficacia === 'number' ? (metrics.eficacia * 100).toFixed(2) : "-" } %
              </div>
            </div>
          )}

          {/* Formulário com transcrição + inputs */}
          <form onSubmit={handleSubmitParecer} style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Transcrição da Entrevista
              </label>
              <textarea
                value={resultado?.text || ""}
                placeholder="Cole aqui a transcrição ou grave um áudio para gerar automaticamente."
                style={{
                  width: "100%",
                  height: 150,
                  resize: "vertical",
                  padding: 8,
                  background: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 6
                }}
                onChange={(e) => {
                  const texto = e.target.value;
                  setResultado((prev) => ({ ...prev, text: texto }));
                  localStorage.setItem("transcricao", texto);
                }}
              />
            </div>

            {[
              { label: "Descrição da Vaga", key: "job_description" },
              { label: "Anotações", key: "notes" },
              { label: "Roteiro da Entrevista", key: "interview_roadmap" },
              { label: "Atividades da Vaga", key: "job_responsabilities" },
              { label: "Valores da empresa", key: "company_values" }
            ].map(({ label, key }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6 }}>
                  {label}
                </label>
                <textarea
                  required
                  style={{
                    width: "100%",
                    height: 150,
                    resize: "vertical",
                    padding: 8,
                    background: "var(--bg)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: 6
                  }}
                  value={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.value })
                  }
                />
              </div>
            ))}

            <button type="submit" disabled={loadingParecer}>
              {loadingParecer ? "Gerando parecer..." : "Gerar Parecer"}
            </button>
          </form>

          {parecer && (
            <div style={{ marginTop: 24 }}>
              <h3>Parecer Final</h3>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "#0d1117",
                  padding: 12,
                  borderRadius: 6,
                  border: "1px solid var(--border)"
                }}
              >
                {parecer}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

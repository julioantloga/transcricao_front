// front/src/pages/InterviewTranscription.jsx
// Objetivo: Página de transcrição com mesmo layout/estilo do App.jsx original
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AudioRecorder from "../components/AudioRecorder";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function InterviewTranscription() {
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");
  const isNewInterview = !id;

  useEffect(() => {
  if (!id) {
    alert("Nenhuma entrevista selecionada. Crie uma nova entrevista para continuar.");
    navigate("/");
  }
}, [id, navigate]);

  const [resultado, setResultado] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [erro, setErro] = useState(null);
  const [statusTexto, setStatusTexto] = useState(null);
  const [loading, setLoading] = useState(false);

  const [loadingParecer, setLoadingParecer] = useState(false);
  const [parecer, setParecer] = useState(null);
  const [parecerEditando, setParecerEditando] = useState(false);
  const [parecerEditado, setParecerEditado] = useState("");
  const [feedbackDado, setFeedbackDado] = useState(null);
  const [interviewTypes, setInterviewTypes] = useState([]);
  const [interviewTypeId, setInterviewTypeId] = useState("none");

  const [jobTouched, setJobTouched] = useState(false);
  const [scriptTouched, setScriptTouched] = useState(false);

  const [diarizacao, setDiarizacao] = useState(false);

  const [form, setForm] = useState({
    job_title: "",
    job_description: "",
    notes: "",
    interview_roadmap: "",
    job_responsibilities: "",
    company_values: ""
  });

  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const [transcriptionId, setTranscriptionId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [scripts, setScripts] = useState([]);

  const [jobId, setJobId] = useState("none");

  const [candidates, setCandidates] = useState([]);
  const [candidateId, setCandidateId] = useState("none");
  const [candidateName, setCandidateName] = useState("");

  const [reviewFormat, setReviewFormat] = useState("completo");

  // ---------------------------------------------------------------------------
  // Carrega dados caso tenha ID na URL
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // Candidatos
    fetch(`${BASE_URL}/candidates?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setCandidates(data.candidates || []))
      .catch(err => console.error("Erro ao carregar candidatos", err));

    // Vagas
    fetch(`${BASE_URL}/jobs?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setJobs(data.jobs || []))
      .catch(err => console.error("Erro ao carregar vagas", err));
  }, []);

  // ---------------------------------------------------------------------------
  // Carrega dados da entrevista
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId || !id) return;

    fetch(`${BASE_URL}/interviews/${id}?user_id=${userId}`)
      .then(res => {
        if (!res.ok) throw new Error("Entrevista não encontrada");
        return res.json();
      })
      .then(data => {
        if (!data?.interview) return;

        const item = data.interview;

        // Formulário
        setForm({
          job_title: item.job_title || "",
          job_description: item.job_description || "",
          notes: item.recruiter_notes || "",
          interview_roadmap: item.interview_roadmap || "",
          job_responsibilities: item.job_responsibilities || "",
          company_values: item.company_values || ""
        });

        // Transcrição e métricas
        setResultado({ text: item.transcript || "" });
        setMetrics(item.metrics || null);

        // Parecer
        const parecerFinal = item.manual_review?.trim()
          ? item.manual_review
          : item.final_review;

        setParecer(parecerFinal || null);
        setParecerEditado(parecerFinal || "");
        setFeedbackDado(item.review_feedback || null);

        // Preenche selects SOMENTE se houver vínculo salvo
        if (item.job_id) setJobId(item.job_id);
        if (item.candidate_id) {
          setCandidateId(item.candidate_id);
          setCandidateName(item.candidate_name || "");
        }
        if (item.interview_type_id) {
          setInterviewTypeId(item.interview_type_id);
        }

        // Áudio
        if (item.audio_path) {
          setAudioUrl(`${BASE_URL}/uploads/${item.audio_path}`);
        }
      })
      .catch(err => {
        console.error(err);
        setErro("Entrevista não encontrada");
      });
  }, [id]);

  // ---------------------------------------------------------------------------
  // Carrega tipos de entrevista vinculados à vaga selecionada
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // Se não houver vaga selecionada, limpa apenas o que depende dela
    if (!jobId || jobId === "none") {
      setInterviewTypes([]);
      setInterviewTypeId("none");
      return;
    }

    fetch(`${BASE_URL}/jobs/${jobId}/interview_types?user_id=${userId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Erro ao buscar tipos da vaga");
        }
        return res.json();
      })
      .then(data => {
        setInterviewTypes(data.types || []);
      })
      .catch(err => {
        console.error("Erro ao carregar tipos da vaga:", err);
        setInterviewTypes([]);
      });
  }, [jobId]);

  // ---------------------------------------------------------------------------
  // Ao selecionar uma vaga, preencher dados da vaga no formulário
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!jobId || jobId === "none") return;

    const selectedJob = jobs.find(j => String(j.id) === String(jobId));
    if (!selectedJob) return;

    setForm(prev => ({
      ...prev,
      job_title: selectedJob.name || prev.job_title,
      job_description: jobTouched
        ? prev.job_description
        : selectedJob.job_description || "",
      job_responsibilities: jobTouched
        ? prev.job_responsibilities
        : selectedJob.job_responsibilities || ""
    }));
  }, [jobId, jobs, jobTouched]);



  function handleCandidateChange(value) {
    setCandidateId(value);

    const selected = candidates.find(c => c.id === Number(value));
    if (!selected) return;

    setCandidateName(selected.name);
  }

  // Função utilitária para exibir tempos
  function formatTempoSeguro(valor) {
    return typeof valor === "number"
      ? valor > 59
        ? `${(valor / 60).toFixed(1)} min`
        : `${valor.toFixed(1)}s`
      : "-";
  }

  // Enviar feedback
  async function enviarFeedback(tipo) {
    try {
      await fetch(`${BASE_URL}/interviews/${id}/review_feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_feedback: tipo })
      });

      setFeedbackDado(tipo);
    } catch (err) {
      alert("Erro ao enviar feedback");
      console.error(err);
    }
  }

  function handleJobChange(value) {
    setJobId(value);

    // reset APENAS do que depende da vaga
    setInterviewTypeId("none");
    setInterviewTypes([]);
  }

  function handleScriptChange(value) {
    setScriptTouched(true);
    setInterviewScriptId(value);

    // Personalizado
    if (value === "custom") {
      setForm(prev => ({
        ...prev,
        interview_roadmap: ""
      }));
      return;
    }

    if (value === "none") return;

    const selectedScript = scripts.find(
      s => s.id === Number(value)
    );

    if (!selectedScript) return;

    setForm(prev => ({
      ...prev,
      interview_roadmap: selectedScript.interview_script || ""
    }));
  }

  // Processa gravação de áudio e transcrição
  async function handleTranscribe() {
    if (!audioFile) return;

    setLoading(true);
    setErro(null);
    setResultado(null);

    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("diarizacao", diarizacao);
    formData.append("interview_id", id);


    // 1️⃣ inicia processo
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (!data?.id || !data?.filename) {
      setErro("Erro ao iniciar transcrição");
      setLoading(false);
      return;
    }

    const transcriptionProcessId = data.id;
    setTranscriptionId(transcriptionProcessId);

    await fetch(`${BASE_URL}/interviews/${id}/audio_path`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_path: data.filename })
    });

    // 2️⃣ acompanha status
    const interval = setInterval(async () => {
      const statusRes = await fetch(`${BASE_URL}/status/${transcriptionProcessId}`);
      const status = await statusRes.json();

      setStatusTexto(status.status);

      if (status.erro) {
        clearInterval(interval);
        setErro(status.erro);
        setLoading(false);
      }

      if (status.pronto) {
        clearInterval(interval);
        setResultado({ text: status.transcricao });
        setMetrics(status.metrics || null);
        setLoading(false);
      }
    }, 3000);
  }

  async function handleFinish({ file }) {
    setLoading(true);
    setErro(null);
    setResultado(null);
    setParecer(null);
    setMetrics(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("diarizacao", diarizacao);
      formData.append("interview_id", id);


      const uploadRes = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const { id: transcriptionProcessId, filename } = await uploadRes.json();

      if (!transcriptionProcessId || !filename) {
        throw new Error("Erro ao iniciar transcrição");
      }

      await fetch(`${BASE_URL}/interviews/${id}/audio_path`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_path: filename })
      });

      let intervalo;

      const checkStatus = async () => {
        const res = await fetch(`${BASE_URL}/status/${transcriptionProcessId}`);
        const status = await res.json();

        if (status.erro) {
          setErro(status.erro);
          clearInterval(intervalo);
          setLoading(false);
          return;
        }

        setStatusTexto(status.status);

        if (status.pronto) {
          clearInterval(intervalo);
          setLoading(false);
          setResultado({ text: status.transcricao });
          setMetrics(status.metrics || null);
        }
      };

      checkStatus();
      intervalo = setInterval(checkStatus, 3000);
    } catch (err) {
      console.error("Erro na transcrição:", err);
      setErro("Erro ao transcrever áudio.");
      setLoading(false);
    }
  }

  // Upload de arquivo WAV
  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".wav")) {
      alert("Apenas arquivos .wav são suportados.");
      return;
    }

    await handleFinish({ file });
  }

// Submeter parecer (CHAMA /review)
async function handleSubmitParecer(e) {
  e.preventDefault();
  setLoadingParecer(true);
  setParecer(null);

  try {
    const res = await fetch(`${BASE_URL}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        transcript: resultado?.text || "",
        user_id: Number(localStorage.getItem("userId")),

        review_format: reviewFormat,

        interview_type_id:
          interviewTypeId === "none" ? null : Number(interviewTypeId),

        job_id:
          jobId === "none" ? null : Number(jobId),

        // 🔥 ROTEIRO FINAL (fonte única de verdade)
        interview_roadmap: form.interview_roadmap,

        job_title: form.job_title,
        job_description: form.job_description,
        job_responsibilities: form.job_responsibilities,
        company_values: form.company_values,
        notes: form.notes,

        metrics: metrics || null,
        audio_path: resultado?.audioPath || null,

        candidate_id:
          candidateId === "none" ? null : Number(candidateId),

        candidate_name: candidateName || null
      })
    });

    if (!res.ok) {
      throw new Error("Erro ao gerar parecer");
    }

    const json = await res.json();

    setParecer(json.review);
    setParecerEditado(json.review);
    setParecerEditando(false);
    setFeedbackDado(null);

  } catch (err) {
    console.error("Erro ao gerar parecer:", err);
    setParecer("❌ Erro ao gerar parecer.");
  } finally {
    setLoadingParecer(false);
  }
}

function handleInterviewTypeChange(value) {
  setInterviewTypeId(value);

  if (value === "none") {
    return;
  }

  const selectedType = interviewTypes.find(
    t => String(t.id) === String(value)
  );

  if (!selectedType) return;

  setForm(prev => ({
    ...prev,
    interview_roadmap: selectedType.interview_script || "",
    company_values: "" // regra existente mantida
  }));
}



  // ---------------------------------------------------------------------------
  // LAYOUT
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* HEADER PÁGINA */}
      <div
        className="header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10
        }}
      >
        <div style={{height: 120, marginTop: -25, marginLeft:20, color:"#fddf8d" }}>
          <h2 style={{ height: 15 }}>Instruções:</h2>
          <p style={{ height: 10 }}>
            1) Grave ou envie o áudio da entrevisa. Caso já tenha a transcrição, cole o texto no campo "Transcrição da Entrevista" e pule essa etapa de gravação e transcrição
          </p>
          <p style={{ height: 10 }}>
            2) Configure as informações da vaga
          </p>  
          <p style={{ height: 10 }}>
            3) Gere o parecer
          </p>  
          <p style={{ height: 10 }}>  
            4) Faça ajustes e deixe seu feedback
          </p>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="layout" style={{ padding: 16 }}>

        {/* LEFT CARD */}
        <div className="card">
          <h2>Gravador</h2>

          <label style={{ display: "none", marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={diarizacao}
              onChange={(e) => setDiarizacao(e.target.checked)}
            />
            Identificar falantes
          </label>

          <AudioRecorder
            onFinish={({ file, url }) => {
              setAudioFile(file);
              setAudioUrl(url);
            }}
          />

          <div style={{ marginTop: 40 }}>
            <h2>Enviar áudio</h2>
            <label style={{ fontWeight: 500 }}>
              Envie um arquivo WAV para transcrever:
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const url = URL.createObjectURL(file);
                setAudioFile(file);
                setAudioUrl(url);

              }}
            />
          </div>
          
          {/* PLAYER */}
          {audioUrl && (
            <div style={{ marginTop: 16 }}>
              <audio
                controls
                src={audioUrl}
                style={{ width: "100%" }}
              />
            
              {audioUrl && !resultado?.text && !loading && (
                <p style={{ marginTop: 8, color: "var(--muted)" }}>
                  ✅ Áudio pronto para transcrição
                </p>
              )}
              
              {/* BOTÃO INICIAR TRANSCRIÇÃO */}
              {audioUrl && (
                <button
                  style={{ marginTop: 12 }}
                  onClick={handleTranscribe}
                  disabled={loading}
                >
                  {loading ? "🎧 Transcrevendo..." : "🎧 Iniciar Transcrição"}
                </button>
              )}

            </div>
          )}


        </div>

        {/* RIGHT CARD */}
        <div className="card">
          
          {/* FORMULÁRIO DE DADOS + GERAÇÃO DE PARECER */}
          <form onSubmit={handleSubmitParecer} style={{ marginTop: 24 }}>

            <div className="card_session">

              <h2>Configurações</h2>
              {/* Candidato */}
              <label style={{ display: "block", marginBottom: 6 }}>
                  Candidato(a):
              </label>
              <div style={{ marginBottom: 16 }}>
                <select
                  className="input"
                  value={candidateId}
                  onChange={(e) => handleCandidateChange(e.target.value)}
                >
                  <option value="none">Selecione um candidato</option>

                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {/* Campo oculto: mantém compatibilidade com o backend */}
                <input
                  type="hidden"
                  name="candidate_name"
                  value={candidateName}
                />
              </div>
              {/* Vaga */}
              <label style={{ display: "block", marginBottom: 6 }}>
                  Vaga:
              </label>        
              <div style={{ marginBottom: 16 }}>
                <select
                  className="input"
                  value={jobId}
                  onChange={e => handleJobChange(e.target.value)}
                >
                  <option value="none">Selecionar..</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Tipo de Entrevista */}
              <label style={{ display: "block", marginBottom: 6 }}>
                Etapa:
              </label>
              <div style={{ marginBottom: 16 }}>  
                <select
                  className="input"
                  value={interviewTypeId}
                  disabled={!jobId || jobId === "none"}
                  onChange={(e) => handleInterviewTypeChange(e.target.value)}
                >
                  <option value="none">
                    {!jobId || jobId === "none"
                      ? "Selecione uma vaga primeiro"
                      : "Selecione um tipo de entrevista"}
                  </option>

                  {interviewTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome da Vaga */}
              <div style={{ visibility:"hidden", display:"none" }}>
                <input
                  type="text"
                  required
                  value={form.job_title}
                  onChange={(e) =>
                    setForm({ ...form, job_title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    background: "var(--bg)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: 6
                  }}
                />
              </div>
            </div>

            <div className="card_session" >
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", marginBottom: 6 }}>
                  Transcrição da Entrevista:
                </label>
                <textarea
                  value={resultado?.text || ""}
                  onChange={(e) => setResultado({ text: e.target.value })}
                  style={{
                    width: "100%",
                    marginBottom: 16,
                    height: 200,
                    resize: "vertical",
                    padding: 8,
                    background: "var(--bg)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: 6
                  }}
                />

                {/* Campos complementares */}
                {[
                  { label: "Descrição da Vaga", key: "job_description" },
                  { label: "Atividades da Vaga", key: "job_responsibilities" }
                ].map(({ label, key }) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", marginBottom: 6 }}>
                      {label}
                    </label>

                    <textarea
                      required
                      value={form[key]}
                      onChange={(e) => {
                        // Marca que o usuário editou manualmente
                        setJobTouched(true);

                        setForm(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }));
                      }}
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
                    />
                  </div>
                ))}


                {interviewTypeId === "none" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6 }}>
                    Descreva os critérios de avaliação
                  </label>
                  <textarea
                    className="input"
                    style={{ height: 150, width: "100%" }}
                    value={form.company_values}
                    onChange={(e) =>
                      setForm({ ...form, company_values: e.target.value })
                    }
                  />
                </div>

              )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6 }}>Roteiro da entrevista</label>
                  <textarea
                      className="input_text"
                      style={{ height: 150, width: "100%", marginTop: 8}}
                      value={form.interview_roadmap}
                      onChange={(e) =>
                        setForm({ ...form, interview_roadmap: e.target.value })
                      }
                  />
                </div>   

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, marginTop:12 }}>
                    Parecer da pessoa recrutadora 
                  </label>
                  <textarea
                    className="input_text"
                    style={{ height: 150, width: "100%" }}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
 
              </div>  
            </div>

            <div className="card_session" >

              <h2>3. Gerar parecer</h2>  

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
  
                <select
                  className="input"
                  value={reviewFormat}
                  onChange={(e) => setReviewFormat(e.target.value)}
                  style={{ width: 180 }}
                >
                  <option value="completo">Parecer Completo</option>
                  <option value="simplificado">Parecer Simplificado</option>
                </select>

                <button
                  type="submit"
                  disabled={loadingParecer}
                >
                  {loadingParecer
                    ? "Gerando parecer..."
                    : id
                    ? "Gerar novo parecer"
                    : "Gerar Parecer"}
                </button>

              </div>


            </div>  

          </form>

          <h3>Parecer da entrevista</h3>
          {loading && <p>{statusTexto || "Processando áudio..."}</p>}
          {erro && <p style={{ color: "red" }}>{erro}</p>}

          {!loading && !resultado && (
            <p style={{ color: "var(--muted)" }}>Parecer não gerado...</p>
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
              {["audio", "conversion", "transcription", "total"].map((key) => (
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
                  <strong>{key}</strong>
                  <br />
                  {formatTempoSeguro(metrics[key])}
                </div>
              ))}
            </div>
          )}

          {/* EXIBIÇÃO DO PARECER (FORA DO FORM) */}  
          {parecer && (
            <div style={{ marginTop: 24 }}>

              <textarea
                value={parecerEditado}
                onChange={(e) => setParecerEditado(e.target.value)}
                readOnly={!parecerEditando}
                style={{
                  width: "100%",
                  height: 600,
                  resize: "vertical",
                  padding: 8,
                  background: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  opacity: parecerEditando ? 1 : 0.7,
                  cursor: parecerEditando ? "text" : "not-allowed"
                }}
              />

              {/* Ações de edição */}
              {!parecerEditando ? (
                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setParecerEditando(true)}
                  >
                    Editar parecer
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch(`${BASE_URL}/interviews/${id}/manual_review`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ manual_review: parecerEditado })
                        });
                        setParecer(parecerEditado);
                        setParecerEditando(false);
                      } catch (err) {
                        alert("Erro ao salvar edição do parecer.");
                        console.error(err);
                      }
                    }}
                  >
                    Salvar edição
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setParecerEditado(parecer);
                      setParecerEditando(false);
                    }}
                    style={{ background: "#f85149", color: "#fff" }}
                  >
                    Cancelar edição
                  </button>
                </div>
              )}

              {/* Feedback buttons */}
              {!feedbackDado && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ marginBottom: 6 }}>Você achou esse parecer útil?</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => enviarFeedback("positivo")}
                      style={{ backgroundColor: "#2ea043", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 6 }}
                    >
                      ✅ Gostei do parecer
                    </button>
                    <button
                      type="button"
                      onClick={() => enviarFeedback("negativo")}
                      style={{ backgroundColor: "#f85149", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 6 }}
                    >
                      ⚠ Pode melhorar
                    </button>
                  </div>
                </div>
              )}

              {feedbackDado && (
                <p style={{ color: "var(--muted)", marginTop: 12 }}>
                  Obrigado pelo feedback: <strong>{feedbackDado}</strong>
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

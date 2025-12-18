import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function JobProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const jobId = searchParams.get("id");
  const userId = localStorage.getItem("userId");

  const [job, setJob] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) {
      navigate("/settings/jobs");
      return;
    }

    if (!userId) {
      navigate("/login");
      return;
    }

    async function loadData() {
      try {
        setError(null);

        /* 1️⃣ Buscar dados da vaga */
        const jobRes = await fetch(`${BASE_URL}/jobs/${jobId}`);
        const jobJson = await jobRes.json();

        setJob(jobJson.job);

        /* 2️⃣ Buscar entrevistas da vaga */
        const intRes = await fetch(
          `${BASE_URL}/jobs/${jobId}/interviews?user_id=${userId}`
        );

        const intJson = await intRes.json();

        if (!intRes.ok) {
          throw new Error(intJson?.error || "Erro ao buscar entrevistas");
        }

        setInterviews(intJson.interviews);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar perfil da vaga");
      }
    }

    loadData();
  }, [jobId, userId, navigate]);

  return (
    <div className="layout" style={{ padding: 24 }}>

        {/* HEADER (mesmo padrão da Home) */}
        <div className="card">
        
            <div style={{ width:"100%", paddingLeft: 20, color: "#ffffffff" }}>
                <h2 style={{ paddingBottom: 16, borderBottom: "solid 1px var(--muted)" }}>
                    {job ? job.name : "Carregando..."}
                </h2>
            </div>
        
            <div style={{ width:"100%", paddingLeft: 20, color: "#ffffffff" }}>
                {!job && !error && (
                    <p style={{ color: "var(--muted)" }}>Carregando descrição...</p>
                )}
                {job && (
                <>
                <h3 style={{ marginTop: 18 }}>Descrição</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>
                    {job.job_description || "Sem descrições definidas"}
                </p>
                </>
                )}
            </div>

            <div style={{ width:"100%", paddingLeft: 20, color: "#ffffffff" }}>
                {!job && !error && (
                <p style={{ color: "var(--muted)" }}>Carregando atividades...</p>
                )}
                {job && (
                <>
                <h3 style={{ marginTop: 18 }}>Atividades</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>
                {job.job_responsibilities || "Sem atividades definidas"}
                </p>
                </> 
                )}
            </div>
        </div>

        {/* DIREITA – ENTREVISTAS */}
        <div className="card">
            
            <h2>Entrevistas</h2>

            {!error && interviews.length === 0 && (
            <p style={{ color: "var(--muted)" }}>
                Nenhuma entrevista vinculada a esta vaga.
            </p>
            )}

                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {interviews.map((i) => (
                    <li
                    key={i.id}
                    style={{
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: 16,
                        marginBottom: 12,
                        background: "var(--bg-alt)",
                        cursor: "pointer"
                    }}
                    onClick={() =>
                        navigate(`/interview_transcription?id=${i.id}`)
                    }
                    >
                    <strong>{i.job_title}</strong>

                    {i.interview_type_name && (
                        <>
                        <br />
                        <span style={{ fontSize: 13, color: "#8b949e" }}>
                            Tipo de análise: {i.interview_type_name}
                        </span>
                        </>
                    )}

                    <br />
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>
                        Criada em:{" "}
                        {new Date(i.created_at).toLocaleString("pt-BR")}
                    </span>
                    </li>
                ))}
                </ul>
        </div>

    </div>

  );
}
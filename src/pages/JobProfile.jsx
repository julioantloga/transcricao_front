import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import JobChat from "../components/JobChat";

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
      navigate("/jobs");
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
    
    async function handleDelete(jobId) {
        if (!jobId) {
        console.error("ID da vaga indefinido");
        return;
        }

        const confirmed = window.confirm(
        "Tem certeza que deseja excluir esta vaga?"
        );
        if (!confirmed) return;

        await fetch(`${BASE_URL}/jobs/${jobId}`, {
        method: "DELETE"
        });

        setJob(prev =>
            prev.filter(job => job.id !== jobId)
        );
    }

  return (
    <div className="layout" style={{ padding: 24 }}>

        {/* HEADER (mesmo padrão da Home) */}
        <div className="card">
        
            <div style={{ width:"100%",  color: "#ffffffff" }}>
                <h2 style={{ paddingBottom: 16, borderBottom: "solid 1px var(--muted)" }}>
                    {job ? job.name : "Carregando..."}
                </h2>
            </div>
            
            <div style={{ width:"100%", color: "#ffffffff" }}>
                {job && (
                    <JobChat jobId={jobId} />
                )}
            </div>

            <div style={{ width:"100%", marginTop:40, paddingLeft: 20, color: "#ffffffff" }}>
                <button
                    onClick={() => handleDelete(job.id)}
                    className="delete_button"
                > Remover vaga
                </button>

                <button
                    className="edit_button"
                    onClick={() =>
                    navigate(`/jobs/${job.id}`)
                    }
                >
                    Editar vaga
                </button>
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
                    className="interview_list"
                    onClick={() =>
                        navigate(`/interview_transcription?id=${i.id}`)
                    }
                    >
                        <p>
                            <strong>{i.candidate_name || "Candidato não identificado"}</strong> - {i.job_title}
                        </p>    
                        {i.interview_type_name && (

                            <span style={{ fontSize: 13, color: "#8b949e" }}>
                                Tipo de entrevista: {i.interview_type_name}
                            </span>
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
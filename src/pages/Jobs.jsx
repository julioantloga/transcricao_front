import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Jobs() {

    const [jobs, setJobs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        
        fetch(`${BASE_URL}/jobs?user_id=${userId}`)
        .then(res => res.json())
        .then(data => {
            setJobs(data.jobs || []);
        });
    }, []);

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

        setJobs(prev =>
        prev.filter(job => job.id !== jobId)
        );
    }

    return (
        <div className="layout" style={{ padding: 24 }}>
        <div className="card">
            <h1>Vagas</h1>
            <button
            onClick={() => navigate("/settings/jobs/new")}
            style={{ marginBottom: 16 }}
            >
            + Nova Vaga
            </button>
        </div>

        <div className="card">
            <h2>Suas vagas:</h2>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
                {jobs.map(job => (
                <tr key={job.id}>
                    <td style={{ padding: "8px 0" }}>
                    {job.name}
                    </td>

                    <td style={{ width: 230 }}>
                         <button
                            className="interview_button"
                            onClick={() => navigate(`/job_profile?id=${job.id}`)}
                            style={{ marginRight: 8 }}
                            >
                            Entrevistas
                        </button>
                        <button
                            onClick={() =>
                            navigate(`/settings/jobs/${job.id}`)
                            }
                        >
                            Editar
                        </button>

                        <button
                            onClick={() => handleDelete(job.id)}
                            style={{
                            marginLeft: 8,
                            background: "#f85149",
                            color: "#fff"
                            }}
                        >X
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>

            {jobs.length === 0 && (
            <p style={{ color: "var(--muted)" }}>
                Nenhuma vaga cadastrada.
            </p>
            )}
        </div>
        </div>
    );
}
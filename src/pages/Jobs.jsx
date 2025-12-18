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

    return (
        <div className="layout" style={{ padding: 24 }}>
        <div className="card">
            <h1>Vagas</h1>
            <button
            onClick={() => navigate("/jobs/new")}
            style={{ marginBottom: 16 }}
            >
            + Nova Vaga
            </button>
        </div>

        <div className="card">
            <h2>Suas vagas:</h2>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                {jobs.map(job => (
                <tr 
                    key={job.id}
                    onClick={() => navigate(`/job_profile?id=${job.id}`)}
                    className="line_click"
                >
                    <td>
                        <div className="line_title">{job.name}</div>
                    </td>

                </tr>
                ))}
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
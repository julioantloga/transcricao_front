import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;


export default function Home() {
  const [interviews, setInterviews] = useState([]);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();
  
  function handleLogout() {
    localStorage.removeItem("userId");
    navigate("/login");
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const userId = localStorage.getItem("userId");
        const res = await fetch(`${BASE_URL}/interviews?user_id=${userId}`);
        const json = await res.json();
        setInterviews(json.interviews || []);
      } catch (err) {
        console.error("Erro ao buscar entrevistas:", err);
        setErro("Erro ao buscar entrevistas");
      }
    }

    fetchData();
  }, []);

  return (

    <div className="layout" style={{ padding: 24 }}>

      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between"
        }}>
          
        <div style={{height: 130, marginLeft:20, color:"#ffffffff" }}>
          <h2 style={{ height: 50 }}>Transcrição e Parecer de Entrevistas:</h2>
          <p style={{ height: 10 }}>
            Selecione uma entrevista para visualizar ou editar o parecer ou inicie uma nova transcrição
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Suas entrevistas:</h2>
        {erro && <p style={{ color: "red" }}>{erro}</p>}

        {!erro && interviews.length === 0 && (
          <p style={{ color: "var(--muted)" }}>Nenhuma entrevista encontrada.</p>
        )}

        <ul style={{ paddingLeft: 0, listStyle: "none" }}>
          {interviews.map((i) => (
            <li
              key={i.id}
                style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 16,
                marginBottom: 12,
                background: "var(--bg-alt)",
                transition: "background 0.2s, transform 0.2s",
                cursor: "pointer"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "#2a2f3a"; // mais escuro no hover
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-alt)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
            >
              <a
                href={`/interview_transcription?id=${i.id}`}
                style={{
                  color: "var(--text)",
                  textDecoration: "none"
                }}
              >
                <strong>{i.job_title || "Vaga sem nome"}</strong>
                <br />
                {i.interview_type_name && (
                  <>
                    <br />
                    <span style={{ fontSize: 13, color: "#8b949e" }}>
                      Tipo de análise: {i.interview_type_name}
                    </span>
                    <br></br>
                  </>
                ) }                
                <span style={{ color: "var(--muted)", fontSize: 14 }}>
                  Criada em: {new Date(i.created_at).toLocaleString("pt-BR")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

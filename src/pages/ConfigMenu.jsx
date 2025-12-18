// Objetivo: Página intermediária de Configurações
// Exibe cards de navegação para os módulos configuráveis do sistema
// Estilo baseado em Home.jsx e InterviewTypes.jsx

import { useNavigate } from "react-router-dom";

export default function ConfigMenu() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 280px)",
          gap: 24
        }}
      >
        {/* CARD: TIPOS DE ENTREVISTA */}
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

        {/* CARD: VAGAS */}
        <div
          className="card"
          style={{ cursor: "pointer", textAlign: "center" }}
          onClick={() => navigate("/settings/jobs")}
        >
          <h2>Vagas</h2>
          <p style={{ color: "var(--muted)" }}>
            Gerencie descrições e atividades das vagas
          </p>
        </div>

        {/* CARD: ROTEIROS */}
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

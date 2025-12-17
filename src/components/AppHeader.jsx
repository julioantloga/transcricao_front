import { useNavigate, useLocation } from "react-router-dom";
import { createInterview } from "../services/api";


export default function AppHeader() {
    const navigate = useNavigate();
    const location = useLocation();

    const isHome = location.pathname === "/";
    const userName = localStorage.getItem("userName");

    function handleLogout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    navigate("/login");
    }

    async function handleNewInterview() {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            navigate("/login");
            return;
        }

        try {
            const { id } = await createInterview(userId);
            navigate(`/interview_transcription?id=${id}`);
        } catch (err) {
            alert(err.message);
            console.error("Erro ao criar entrevista:", err);
        }
        }

    return (
    <header
        style={{
        position: "fixed",
        top: 0,
        width: "100%",
        background: "#161b22",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        zIndex: 1000,
        }}
    >
        {/* LOGO + USER */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
            src="./src/assets/logo_mind.png" // ajuste o caminho conforme o seu
            alt="Logo"
            style={{ height: 32 }}
        />
        <span style={{ fontWeight: 600 }}>{userName}</span>
        </div>

        {/* BOTÕES */}
        <div style={{ display: "flex", gap: 12 }}>
        {!isHome && (
            <button
            onClick={() => navigate("/")}
            style={{
                background: "#fff",
                color: "#000",
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 6,
                cursor: "pointer"
            }}
            >
            ← Voltar
            </button>
        )}

        <button
            onClick={handleNewInterview}
        >
            + Nova Entrevista
        </button>

        <button
            onClick={() => navigate("/settings/interview_types")}
        >
            Configurações
        </button>

        <button
            onClick={handleLogout}
            style={{
            background: "#f85149",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 6,
            cursor: "pointer"
            }}
        >
            Sair
        </button>
        </div>
    </header>
    );
    }


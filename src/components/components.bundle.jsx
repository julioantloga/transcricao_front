/* =============================================================================
   FILE: components/AppHeader.jsx
   RESPONSABILIDADE: Header fixo da aplicação + navegação principal
   ============================================================================= */

import { useNavigate, useLocation } from "react-router-dom";
import { createInterview } from "../services/api";
import logoMind from "../assets/logo_mind.png";

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
          src={logoMind}
          alt="Logo"
          style={{ height: 32, cursor: "pointer" }}
          onClick={() => navigate("/")}
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
              cursor: "pointer",
            }}
          >
            ← Voltar
          </button>
        )}

        <button onClick={() => navigate("/candidates/new")}>
          + Novo Candidato
        </button>

        <button onClick={handleNewInterview}>
          + Nova Entrevista
        </button>

        <button onClick={() => navigate("/settings")}>
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
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>
    </header>
  );
}


/* =============================================================================
   FILE: components/AudioRecorder.jsx
   RESPONSABILIDADE: Gravação de áudio (microfone, aba ou mix)
   ============================================================================= */

import { useState, useRef } from "react";

export default function AudioRecorder({ onFinish }) {
  const [mode, setMode] = useState("mixed");
  const [status, setStatus] = useState("aguardando...");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("instrucoes");

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStreamRef = useRef(null);
  const auxStreamsRef = useRef([]);
  const audioContextRef = useRef(null);

  async function getMicStream() {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  async function getTabStream() {
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
  }

  async function getMixedStream() {
    const micStream = await getMicStream();
    const tabStream = await getTabStream();

    if (!tabStream.getAudioTracks().length) {
      tabStream.getTracks().forEach(t => t.stop());
      throw new Error("⚠️ O áudio da aba não foi compartilhado.");
    }

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const micSource = audioContext.createMediaStreamSource(micStream);
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    const destination = audioContext.createMediaStreamDestination();

    const merger = audioContext.createChannelMerger(2);
    micSource.connect(merger, 0, 0);
    tabSource.connect(merger, 0, 1);
    merger.connect(destination);

    auxStreamsRef.current = [micStream, tabStream];
    return destination.stream;
  }

  function pickMimeType() {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "audio/webm;codecs=opus",
      "audio/webm",
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return { mimeType: type };
    }
    return {};
  }

  async function startRecording() {
    try {
      setStatus("selecionando fonte...");
      setAudioUrl(null);
      chunksRef.current = [];

      let stream;

      if (mode === "mixed") {
        try {
          stream = await getMixedStream();
        } catch {
          setShowModal(true);
          setModalType("erro");
          setStatus("Erro: áudio da aba não foi compartilhado");
          return;
        }
      } else if (mode === "tab") {
        stream = await getTabStream();
        auxStreamsRef.current = [stream];
      } else {
        stream = await getMicStream();
        auxStreamsRef.current = [stream];
      }

      recordStreamRef.current = stream;

      const options = pickMimeType();
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      recorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus("gravado");

        if (onFinish) {
          const file = new File([blob], `audio-${Date.now()}.webm`, {
            type: blob.type,
          });
          onFinish({ file, blob, url });
        }

        auxStreamsRef.current.forEach(s =>
          s.getTracks().forEach(t => t.stop())
        );
        auxStreamsRef.current = [];

        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      setStatus("gravando...");
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Erro ao iniciar gravação");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setStatus("parando...");
  }

  return (
    <div>
      <p>Status: {status}</p>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={startRecording} disabled={isRecording}>
          🎙 Iniciar
        </button>

        <button
          onClick={stopRecording}
          disabled={!isRecording}
          style={{ backgroundColor: "#f85149", color: "#fff" }}
        >
          ⏹ Parar
        </button>
      </div>
    </div>
  );
}


/* =============================================================================
   FILE: components/JobChat.jsx
   RESPONSABILIDADE: Chat analítico da vaga (RAG)
   ============================================================================= */

import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function JobChat({ jobId }) {
  const userId = localStorage.getItem("userId");

  const defaultWelcome = {
    role: "assistant",
    content: "Olá! O que você quer saber sobre as entrevistas dessa vaga?",
  };

  const [messages, setMessages] = useState([defaultWelcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      if (!jobId || !userId) return;

      setLoadingHistory(true);
      setError(null);

      try {
        const res = await fetch(
          `${BASE_URL}/jobs/${jobId}/chat/messages?user_id=${userId}&limit=50`
        );

        if (!res.ok) throw new Error("Erro ao carregar histórico");

        const data = await res.json();
        const serverMessages = Array.isArray(data.messages)
          ? data.messages
          : [];

        setMessages(
          serverMessages.length ? serverMessages : [defaultWelcome]
        );
      } catch {
        setMessages([defaultWelcome]);
        setError("Erro ao carregar histórico do chat.");
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, [jobId]);

  async function sendQuestion() {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/jobs/${jobId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, question }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      setError("Erro ao obter resposta do assistente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>Assistente da Vaga</h3>

      <div style={{ height: 280, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.role}:</strong> {m.content}
          </p>
        ))}
      </div>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={loading}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={sendQuestion} disabled={loading}>
        Enviar
      </button>
    </div>
  );
}


/* =============================================================================
   FILE: components/ProtectedRoute.jsx
   RESPONSABILIDADE: Proteção de rotas autenticadas
   ============================================================================= */

import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

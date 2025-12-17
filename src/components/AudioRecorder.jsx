import { useState, useRef } from "react";

export default function AudioRecorder({ onFinish }) {
  const [mode, setMode] = useState("mixed"); // mic | tab | mixed
  const [status, setStatus] = useState("aguardando...");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("instrucoes"); // instrucoes | erro

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStreamRef = useRef(null);
  const auxStreamsRef = useRef([]);
  const audioContextRef = useRef(null);

  // ---------- FONTES DE ÁUDIO ----------

  async function getMicStream() {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  async function getTabStream() {
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
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

  // ---------- MIME TYPE ----------

  function pickMimeType() {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "audio/webm;codecs=opus",
      "audio/webm"
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return { mimeType: type };
    }
    return {};
  }

  // ---------- START ----------

  async function startRecording() {
    try {
      setStatus("selecionando fonte...");
      setAudioUrl(null);
      chunksRef.current = [];

      let stream;

      if (mode === "mixed") {
        try {
          stream = await getMixedStream();
        } catch (err) {
          console.warn("Erro ao capturar Mixed Stream:", err);
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
          type: recorder.mimeType || "audio/webm"
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

  // ---------- UI ----------

  return (
    <div>
      <div style={{ marginBottom: 0, display:"none", visibility:"hidden" }}>
        <label>
          <input
            type="radio"
            checked={mode === "mic"}
            onChange={() => setMode("mic")}
          />
          Microfone
        </label>

        <label style={{ marginLeft: 10 }}>
          <input
            type="radio"
            checked={mode === "tab"}
            onChange={() => setMode("tab")}
          />
          Aba / Reunião
        </label>

        <label style={{ marginLeft: 10 }}>
          <input
            type="radio"
            checked={mode === "mixed"}
            onChange={() => setMode("mixed")}
          />
          Microfone + Aba
        </label>
      </div>

      {mode === "mixed" && (
        <button
          onClick={() => {
            setModalType("instrucoes");
            setShowModal(true);
          }}
          style={{
            marginBottom: 10,
            backgroundColor: "#444c56",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          ❓ Como compartilhar áudio da aba
        </button>
      )}

      <p>Status: {status}</p>

      <div style={{ display: "flex", gap: "10px", marginTop: 8 }}>
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
      
      <p style={{
        color: "var(--muted)",
        fontSize: "0.8rem",
        marginTop: 8
      }}>
        ⚠ Não se esqueça de marcar "Compartilhar áudio da aba"
      </p>

      {/* MODAL */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999
        }}>
          <div style={{
            background: "#1e2228",
            padding: 24,
            borderRadius: 8,
            maxWidth: 500,
            width: "90%",
            textAlign: "center",
            color: modalType === "erro" ? "#f85149" : "#ffffff",
            border: modalType === "erro" ? "2px solid #f85149" : "none"
          }}>
            <h2 style={{
              color: modalType === "erro" ? "#f85149" : "#ffffff",
              marginBottom: 12
            }}>
              {modalType === "erro"
                ? "⚠️ Áudio da aba não detectado"
                : "Como compartilhar áudio da aba?"}
            </h2>

            <p style={{
              color: modalType === "erro" ? "#f85149" : "#ccc",
              margin: "16px 0"
            }}>
              {modalType === "erro"
                ? "Parece que você não marcou a opção 'Compartilhar áudio' na tela anterior. Isso é necessário para gravar corretamente."
                : "Na próxima etapa, ao escolher a aba ou tela, lembre-se de marcar a opção 'Compartilhar áudio' no rodapé da janela."}
            </p>

            <div style={{ margin: "16px 0" }}>
              <img
                src="/src/assets/instrucao.png"
                alt="Instruções para compartilhar áudio"
                style={{
                  maxWidth: "100%",
                  borderRadius: 4,
                  border: modalType === "erro" ? "2px solid #f85149" : "none"
                }}
              />
            </div>

            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: 16,
                backgroundColor: modalType === "erro" ? "#f85149" : "#58a6ff",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

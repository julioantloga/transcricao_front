import { useState, useRef } from "react";

export default function AudioRecorder({ onFinish }) {
  const [mode, setMode] = useState("mic"); // mic | tab | mixed
  const [status, setStatus] = useState("pronto");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const recordStreamRef = useRef(null);    // stream usado para gravar
  const auxStreamsRef = useRef([]);        // streams que devem ser encerrados
  const audioContextRef = useRef(null);    // só no modo mixed

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
    throw new Error("Marque 'Compartilhar áudio da aba'");
  }

  const audioContext = new AudioContext();
  audioContextRef.current = audioContext;

  const micSource = audioContext.createMediaStreamSource(micStream);
  const tabSource = audioContext.createMediaStreamSource(tabStream);
  const destination = audioContext.createMediaStreamDestination();

  // 🔀 Criando merger de 2 canais: esquerda (mic), direita (aba)
  const merger = audioContext.createChannelMerger(2);

  // 🎙 MIC → canal 0 (esquerda)
  micSource.connect(merger, 0, 0);

  // 🔊 ABA → canal 1 (direita)
  tabSource.connect(merger, 0, 1);

  // 🔁 Saída final estéreo
  merger.connect(destination);

  auxStreamsRef.current = [micStream, tabStream];
  return destination.stream;
}


  // ---------- MIME TYPE AUTO ----------

  function pickMimeType() {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "audio/webm;codecs=opus",
      "audio/webm"
    ];

    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return { mimeType: type };
      }
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

      if (mode === "mixed") stream = await getMixedStream();
      else if (mode === "tab") {
        stream = await getTabStream();
        auxStreamsRef.current = [stream];
      } 
      else {
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

  // ---------- STOP ----------

  function stopRecording() {
    recorderRef.current?.stop();
    setStatus("parando...");
  }

  // ---------- UI ----------

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
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


      {audioUrl && (
        <div style={{ marginTop: 12 }}>
          <video controls src={audioUrl} style={{ width: "100%" }} />
        </div>
      )}

      <p style={{
        color: "var(--muted)",
        fontSize: "0.8rem",
        marginTop: 8
      }}>
        ⚠ Em modo "Aba", marque "Compartilhar áudio da aba"
      </p>
    </div>
  );
}

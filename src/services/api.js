
const BASE_URL = import.meta.env.VITE_API_URL;

export async function transcreverAudio(file, diarizacao) {
  const form = new FormData();
  form.append("audio", file);
  form.append("diarizacao", diarizacao);

  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: form
  });

  let data;
  try {
    data = await response.json(); 
  } catch (err) {
    throw new Error("Resposta inválida do servidor.");
  }

  if (!response.ok) {
    throw new Error(data?.error || "Erro na transcrição");
  }

  return data;
}
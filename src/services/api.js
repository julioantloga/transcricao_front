
const BASE_URL = import.meta.env.VITE_API_URL;

export async function createInterview(userId) {
  if (!userId) {
    throw new Error("userId é obrigatório para criar entrevista");
  }

  const response = await fetch(`${BASE_URL}/interviews/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: Number(userId)
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Erro ao criar entrevista");
  }

  return data; // { id }
}

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
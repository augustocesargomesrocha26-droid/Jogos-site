const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { Accept: "application/json", ...options.headers },
    });
  } catch {
    throw new Error(`Não foi possível conectar à API em ${API_URL}. Confira se o backend está iniciado.`);
  }

  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; }
  catch { data = raw; }

  if (!response.ok) {
    const message = typeof data === "string"
      ? data
      : data?.erro || data?.message || `Erro HTTP ${response.status}`;
    if (response.status === 404) return [];
    throw new Error(message || "Falha ao consultar a API.");
  }
  return data;
}

// Endpoint público confirmado no backend: GET /Jogos
export async function getJogos() {
  const data = await request("/Jogos");
  if (Array.isArray(data)) return data;
  // A API responde texto quando não há registros.
  if (data == null || typeof data === "string") return [];
  if (Array.isArray(data.jogos)) return data.jogos;
  if (Array.isArray(data.data)) return data.data;
  throw new Error("A API respondeu, mas o formato da lista de jogos não é reconhecido.");
}

// Endpoint público confirmado no backend: GET /Jogos/:id
export async function getJogo(id) {
  return request(`/Jogos/${encodeURIComponent(id)}`);
}
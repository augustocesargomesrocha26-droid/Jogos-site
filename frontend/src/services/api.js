/**
 * Camada de acesso à API Express (repositório jogos4info3).
 *
 * Rotas usadas (todas confirmadas no backend):
 *   POST   /login            -> { token, mensagem }        (pública)
 *   POST   /Usuarios         -> body { usuario: {...} }    (pública)
 *   PUT    /Usuarios/:id     -> body { usuario: {...} }    (token + id do próprio usuário)
 *   DELETE /Usuarios/:id                                   (token + id do próprio usuário)
 *   GET    /Jogos                                          (pública)
 *   GET    /Jogos/:id                                      (pública)
 *   POST   /Jogos            -> body { jogo: {...} }       (token)
 *   PUT    /Jogos/:id        -> body { jogo: {...} }       (token)
 *   DELETE /Jogos/:id                                      (token)
 *
 * Observações sobre o backend atual:
 *  - O middleware `autenticarToken` lê o header `authorization` CRU (sem "Bearer ").
 *    Por isso o token é enviado puro. Se o backend passar a exigir "Bearer",
 *    troque a linha marcada em `montarHeaders`.
 *  - O login original devolve apenas { token }. O `id` do usuário é necessário para
 *    PUT/DELETE /Usuarios/:id, então esta camada aceita o id vindo de `id`, `_id`,
 *    `usuario._id` ou do payload do JWT (quando o backend for ajustado).
 */

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

export const TOKEN_KEY = "jogos4info3.token";
export const USER_KEY = "jogos4info3.usuario";

export { API_URL };

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/** Erros que significam "sessão inválida/expirada" (token ausente, inválido ou expirado). */
export function ehErroDeSessao(erro) {
  return erro instanceof ApiError && (erro.status === 401 || erro.status === 403);
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage indisponível: sessão só em memória */
  }
}

/** Decodifica o payload do JWT (sem validar assinatura — só para ler email/exp). */
export function decodeToken(token) {
  if (!token || typeof token !== "string" || token.split(".").length < 2) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** true quando o token existe e ainda não expirou (margem de 30s). */
export function tokenValido(token) {
  const payload = decodeToken(token);
  if (!payload) return false;
  if (!payload.exp) return true;
  return payload.exp * 1000 - 30_000 > Date.now();
}

function montarHeaders({ body, auth, token }) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const valor = token || getToken();
    if (!valor) throw new ApiError("Faça login para continuar.", 401);
    // O backend lê o header cru. Para usar "Bearer", troque por `Bearer ${valor}`.
    headers.Authorization = valor;
  }
  return headers;
}

function mensagemDeErro(data, status) {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    return data.erro || data.message || data.mensagem || `Erro HTTP ${status}`;
  }
  return `Erro HTTP ${status}`;
}

async function request(path, { method = "GET", body, auth = false, token, vazioSe404 = false } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: montarHeaders({ body, auth, token }),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      `Não foi possível conectar à API em ${API_URL}. Confira se o backend está iniciado (npm run dev) e se o CORS libera esta origem.`,
      0
    );
  }

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    // A API responde 404 com texto quando a coleção está vazia.
    if (response.status === 404 && vazioSe404) return [];
    throw new ApiError(mensagemDeErro(data, response.status), response.status, data);
  }
  return data;
}

/* ------------------------------------------------------------------ */
/* Autenticação                                                        */
/* ------------------------------------------------------------------ */

function normalizarSessao(data, emailInformado) {
  const token = data?.token;
  if (!token) {
    throw new ApiError("A API respondeu sem token. Verifique a rota POST /login.", 500, data);
  }
  const payload = decodeToken(token) || {};
  const origem = data?.usuario || data?.user || {};
  const idBruto = data?.id ?? data?._id ?? origem._id ?? origem.id ?? payload.id ?? payload._id ?? null;
  const email = data?.email ?? origem.email ?? payload.email ?? emailInformado ?? "";
  return {
    token,
    id: idBruto == null ? null : String(idBruto),
    email,
    expiraEm: payload.exp ? payload.exp * 1000 : null,
  };
}

export async function login(email, senha) {
  const data = await request("/login", {
    method: "POST",
    body: { email: String(email || "").trim(), senha },
  });
  return normalizarSessao(data, String(email || "").trim());
}

/** Cadastro público: o backend espera { usuario: { email, senha } }. */
export async function cadastrarUsuario(email, senha) {
  return request("/Usuarios", {
    method: "POST",
    body: { usuario: { email: String(email || "").trim(), senha } },
  });
}

/* ------------------------------------------------------------------ */
/* Usuários                                                            */
/* ------------------------------------------------------------------ */

export async function getUsuarios(token) {
  return request("/Usuarios", { auth: true, token, vazioSe404: true });
}

export async function getUsuario(id, token) {
  return request(`/Usuarios/${encodeURIComponent(id)}`, { auth: true, token });
}

/**
 * Atualiza os dados do próprio usuário.
 * Envie apenas os campos alterados: o backend faz merge com o documento atual
 * e remove o campo quando o valor enviado é string vazia.
 */
export async function atualizarUsuario(id, dados, token) {
  return request(`/Usuarios/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: true,
    token,
    body: { usuario: dados },
  });
}

export async function excluirUsuario(id, token) {
  return request(`/Usuarios/${encodeURIComponent(id)}`, { method: "DELETE", auth: true, token });
}

/* ------------------------------------------------------------------ */
/* Jogos                                                               */
/* ------------------------------------------------------------------ */

function comoLista(data) {
  if (Array.isArray(data)) return data;
  if (data == null || typeof data === "string") return [];
  if (Array.isArray(data.jogos)) return data.jogos;
  if (Array.isArray(data.data)) return data.data;
  throw new ApiError("A API respondeu, mas o formato da lista de jogos não é reconhecido.", 500, data);
}

export async function getJogos() {
  return comoLista(await request("/Jogos", { vazioSe404: true }));
}

export async function getJogo(id) {
  return request(`/Jogos/${encodeURIComponent(id)}`);
}

export async function criarJogo(jogo, token) {
  return request("/Jogos", { method: "POST", auth: true, token, body: { jogo } });
}

export async function atualizarJogo(id, jogo, token) {
  return request(`/Jogos/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: true,
    token,
    body: { jogo },
  });
}

export async function excluirJogo(id, token) {
  return request(`/Jogos/${encodeURIComponent(id)}`, { method: "DELETE", auth: true, token });
}

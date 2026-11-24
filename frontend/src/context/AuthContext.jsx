import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  USER_KEY,
  atualizarUsuario,
  cadastrarUsuario,
  decodeToken,
  ehErroDeSessao,
  login as loginApi,
  setToken,
  tokenValido,
} from "../services/api";

const AuthContext = createContext(null);

function lerSessaoSalva() {
  try {
    const token = localStorage.getItem("jogos4info3.token");
    const usuario = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    if (!token || !tokenValido(token)) return { token: null, usuario: null };
    return { token, usuario: usuario || null };
  } catch {
    return { token: null, usuario: null };
  }
}

function salvarUsuario(usuario) {
  try {
    if (usuario) localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignora */
  }
}

/**
 * Guarda token + dados do usuário logado.
 * `id` é obrigatório para PUT /Usuarios/:id (rota de edição de dados).
 */
export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessaoSalva);
  const [aviso, setAviso] = useState("");

  const sair = useCallback((mensagem = "") => {
    setToken(null);
    salvarUsuario(null);
    setSessao({ token: null, usuario: null });
    setAviso(mensagem);
  }, []);

  const entrar = useCallback(async (email, senha) => {
    const dados = await loginApi(email, senha);
    setToken(dados.token);
    const usuario = {
      id: dados.id,
      email: dados.email,
      expiraEm: dados.expiraEm,
      entrouEm: new Date().toISOString(),
    };
    salvarUsuario(usuario);
    setSessao({ token: dados.token, usuario });
    setAviso("");
    return usuario;
  }, []);

  const cadastrar = useCallback(async (email, senha) => cadastrarUsuario(email, senha), []);

  /** Envia só os campos alterados para PUT /Usuarios/:id. */
  const atualizarPerfil = useCallback(
    async (dados) => {
      if (!sessao.token) throw new Error("Faça login para editar seus dados.");
      if (!sessao.usuario?.id) {
        throw new Error(
          "A API não devolveu o id do usuário no login, e PUT /Usuarios/:id exige esse id. Ajuste o controller de login (veja o README)."
        );
      }
      const resposta = await atualizarUsuario(sessao.usuario.id, dados, sessao.token);
      const emailNovo = dados.email?.trim();
      if (emailNovo && emailNovo !== sessao.usuario.email) {
        // O token guarda o email: trocar o email invalida a sessão atual.
        sair("E-mail atualizado. Entre novamente com o novo e-mail.");
        return { resposta, precisaEntrarDeNovo: true };
      }
      const usuario = { ...sessao.usuario, email: emailNovo || sessao.usuario.email };
      salvarUsuario(usuario);
      setSessao((atual) => ({ ...atual, usuario }));
      return { resposta, precisaEntrarDeNovo: false };
    },
    [sair, sessao.token, sessao.usuario]
  );

  /** Centraliza o tratamento de 401/403: encerra a sessão e avisa o usuário. */
  const tratarErro = useCallback(
    (erro) => {
      if (ehErroDeSessao(erro)) {
        sair("Sua sessão expirou. Entre novamente para continuar.");
        return true;
      }
      return false;
    },
    [sair]
  );

  // Expira a sessão no cliente no horário do JWT.
  useEffect(() => {
    if (!sessao.token || !sessao.usuario?.expiraEm) return;
    const restante = sessao.usuario.expiraEm - Date.now();
    if (restante <= 0) {
      sair("Sua sessão expirou. Entre novamente para continuar.");
      return;
    }
    const timer = setTimeout(() => sair("Sua sessão expirou. Entre novamente para continuar."), restante);
    return () => clearTimeout(timer);
  }, [sair, sessao.token, sessao.usuario?.expiraEm]);

  const valor = useMemo(() => {
    const usuario = sessao.usuario;
    return {
      token: sessao.token,
      usuario,
      autenticado: Boolean(sessao.token && usuario),
      semId: Boolean(sessao.token && usuario && !usuario.id),
      iniciais: (usuario?.email || "?").slice(0, 2).toUpperCase(),
      aviso,
      limparAviso: () => setAviso(""),
      entrar,
      cadastrar,
      sair,
      atualizarPerfil,
      tratarErro,
    };
  }, [aviso, cadastrar, entrar, sair, sessao, atualizarPerfil, tratarErro]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return contexto;
}

export { decodeToken };

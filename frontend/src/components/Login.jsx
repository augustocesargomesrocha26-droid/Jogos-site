import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Modal de autenticação. Usa as rotas:
 *   POST /login     -> login
 *   POST /Usuarios  -> cadastro (público)
 */
export default function Login({ open, onClose, onSuccess, modoInicial = "entrar" }) {
  const { entrar, cadastrar } = useAuth();
  const [modo, setModo] = useState(modoInicial);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    if (open) {
      setModo(modoInicial);
      setErro("");
      setEnviando(false);
      setTimeout(() => emailRef.current?.focus(), 60);
    }
  }, [open, modoInicial]);

  useEffect(() => {
    if (!open) return;
    const aoTeclar = (evento) => {
      if (evento.key === "Escape" && !enviando) onClose?.();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [open, enviando, onClose]);

  if (!open) return null;

  const cadastrando = modo === "cadastrar";

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;
    setErro("");

    if (!EMAIL_RE.test(email.trim())) {
      setErro("Informe um e-mail válido (ex.: aluno@escola.com).");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (cadastrando && senha !== confirmacao) {
      setErro("As duas senhas precisam ser iguais.");
      return;
    }

    setEnviando(true);
    try {
      if (cadastrando) {
        await cadastrar(email.trim(), senha);
        await entrar(email.trim(), senha);
        onSuccess?.("Conta criada e login efetuado.");
      } else {
        await entrar(email.trim(), senha);
        onSuccess?.("Login efetuado com sucesso.");
      }
      setSenha("");
      setConfirmacao("");
      onClose?.();
    } catch (falha) {
      setErro(falha?.message || "Não foi possível concluir. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(evento) => evento.target === evento.currentTarget && !enviando && onClose?.()}
    >
      <section className="sheet auth-sheet" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <button className="sheet-close" onClick={() => !enviando && onClose?.()} aria-label="Fechar">
          <X size={18} />
        </button>

        <span className="eyebrow">
          <ShieldCheck size={14} /> ACESSO RESTRITO
        </span>
        <h2 id="login-title">{cadastrando ? "CRIAR CONTA" : "ENTRAR NO PORTAL"}</h2>
        <p className="sheet-sub">
          {cadastrando
            ? "O cadastro usa a rota pública POST /Usuarios. Depois de criada, a conta já entra automaticamente."
            : "Informe seu e-mail e senha para liberar a edição de dados e o cadastro de jogos."}
        </p>

        <div className="tabs" role="tablist" aria-label="Entrar ou criar conta">
          <button
            type="button"
            role="tab"
            aria-selected={!cadastrando}
            className={!cadastrando ? "ativo" : ""}
            onClick={() => {
              setModo("entrar");
              setErro("");
            }}
          >
            <LogIn size={13} /> ENTRAR
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={cadastrando}
            className={cadastrando ? "ativo" : ""}
            onClick={() => {
              setModo("cadastrar");
              setErro("");
            }}
          >
            <UserPlus size={13} /> CRIAR CONTA
          </button>
        </div>

        <form onSubmit={enviar} noValidate>
          <div className="field">
            <label htmlFor="login-email">E-MAIL</label>
            <div className="input-wrap">
              <Mail size={15} />
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                disabled={enviando}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="login-senha">SENHA</label>
            <div className="input-wrap">
              <Lock size={15} />
              <input
                id="login-senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete={cadastrando ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                disabled={enviando}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setMostrarSenha((valor) => !valor)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <span className="hint">Mínimo de 6 caracteres.</span>
          </div>

          {cadastrando && (
            <div className="field">
              <label htmlFor="login-confirmacao">CONFIRMAR SENHA</label>
              <div className="input-wrap">
                <Lock size={15} />
                <input
                  id="login-confirmacao"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmacao}
                  onChange={(evento) => setConfirmacao(evento.target.value)}
                  disabled={enviando}
                />
              </div>
            </div>
          )}

          {erro && (
            <div className="form-erro" role="alert">
              <AlertTriangle size={15} />
              <span>{erro}</span>
            </div>
          )}

          <div className="sheet-actions">
            <button type="submit" className="primary-button" disabled={enviando}>
              {enviando ? <Loader2 size={16} className="spin" /> : cadastrando ? <UserPlus size={16} /> : <LogIn size={16} />}
              {enviando ? "ENVIANDO..." : cadastrando ? "CRIAR CONTA E ENTRAR" : "ENTRAR"}
            </button>
          </div>
        </form>

        <p className="sheet-foot">
          O token fica salvo no navegador e expira em 1 hora (definido no backend).
        </p>
      </section>
    </div>
  );
}

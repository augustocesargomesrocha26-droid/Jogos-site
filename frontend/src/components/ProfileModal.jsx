import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { excluirUsuario } from "../services/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Edição dos dados do próprio usuário.
 * Usa PUT /Usuarios/:id enviando APENAS os campos alterados
 * (o controller faz merge com o documento atual e apaga o campo
 * quando o valor recebido é uma string vazia).
 */
export default function ProfileModal({ open, onClose, onSuccess }) {
  const { usuario, token, semId, atualizarPerfil, tratarErro, sair } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(usuario?.email || "");
      setSenha("");
      setConfirmacao("");
      setErro("");
      setSalvando(false);
      setExcluindo(false);
      setConfirmandoExclusao(false);
      setMostrarSenha(false);
    }
  }, [open, usuario?.email]);

  if (!open) return null;

  async function salvar(evento) {
    evento.preventDefault();
    if (salvando) return;
    setErro("");

    const emailLimpo = email.trim();
    const dados = {};

    if (emailLimpo !== (usuario?.email || "")) {
      if (!EMAIL_RE.test(emailLimpo)) {
        setErro("Informe um e-mail válido.");
        return;
      }
      dados.email = emailLimpo;
    }

    if (senha) {
      if (senha.length < 6) {
        setErro("A nova senha precisa ter pelo menos 6 caracteres.");
        return;
      }
      if (senha !== confirmacao) {
        setErro("A confirmação da senha não confere.");
        return;
      }
      dados.senha = senha;
    }

    if (Object.keys(dados).length === 0) {
      setErro("Nenhum campo foi alterado.");
      return;
    }

    setSalvando(true);
    try {
      const { precisaEntrarDeNovo } = await atualizarPerfil(dados);
      onClose?.();
      onSuccess?.(
        precisaEntrarDeNovo
          ? "E-mail atualizado. Entre novamente com o novo e-mail."
          : "Dados atualizados com sucesso."
      );
    } catch (falha) {
      if (!tratarErro(falha)) setErro(falha?.message || "Não foi possível salvar os dados.");
      else onClose?.();
    } finally {
      setSalvando(false);
    }
  }

  async function excluirConta() {
    if (!usuario?.id) return;
    setErro("");
    setExcluindo(true);
    try {
      await excluirUsuario(usuario.id, token);
      sair("Sua conta foi excluída do banco de dados.");
      onClose?.();
      onSuccess?.("Conta excluída. Você foi desconectado.");
    } catch (falha) {
      if (!tratarErro(falha)) setErro(falha?.message || "Não foi possível excluir a conta.");
    } finally {
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(evento) => evento.target === evento.currentTarget && !salvando && onClose?.()}
    >
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="perfil-title">
        <button className="sheet-close" onClick={() => !salvando && onClose?.()} aria-label="Fechar">
          <X size={18} />
        </button>

        <span className="eyebrow">
          <BadgeCheck size={14} /> MEUS DADOS
        </span>
        <h2 id="perfil-title">EDITAR PERFIL</h2>
        <p className="sheet-sub">
          As alterações são enviadas para <code>PUT /Usuarios/:id</code>. Só os campos modificados vão no corpo da
          requisição.
        </p>

        <div className="id-badge">
          <Fingerprint size={15} />
          <span>
            ID DO USUÁRIO
            <strong>{usuario?.id || "não informado pela API"}</strong>
          </span>
        </div>

        {semId && (
          <div className="form-erro">
            <AlertTriangle size={15} />
            <span>
              O login atual devolve apenas o token, então o frontend não conhece o <code>id</code> exigido por{" "}
              <code>PUT /Usuarios/:id</code>. Inclua o id na resposta do login (veja o README, seção
              &quot;Ajuste necessário na API&quot;) para habilitar a edição.
            </span>
          </div>
        )}

        <form onSubmit={salvar} noValidate>
          <div className="field">
            <label htmlFor="perfil-email">E-MAIL</label>
            <div className="input-wrap">
              <Mail size={15} />
              <input
                id="perfil-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                disabled={salvando || semId}
              />
            </div>
            <span className="hint">
              O token guarda o e-mail: ao trocar, a sessão atual é encerrada e você entra de novo.
            </span>
          </div>

          <div className="field">
            <label htmlFor="perfil-senha">NOVA SENHA</label>
            <div className="input-wrap">
              <Lock size={15} />
              <input
                id="perfil-senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="new-password"
                placeholder="deixe vazio para manter"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                disabled={salvando || semId}
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
          </div>

          {senha && (
            <div className="field">
              <label htmlFor="perfil-confirmacao">CONFIRMAR NOVA SENHA</label>
              <div className="input-wrap">
                <KeyRound size={15} />
                <input
                  id="perfil-confirmacao"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmacao}
                  onChange={(evento) => setConfirmacao(evento.target.value)}
                  disabled={salvando}
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
            <button type="submit" className="primary-button" disabled={salvando || semId}>
              {salvando ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {salvando ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
            </button>
            <button type="button" className="ghost-button" onClick={() => onClose?.()} disabled={salvando}>
              CANCELAR
            </button>
          </div>
        </form>

        <div className="sheet-divider" />

        <div className="conta-acoes">
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              sair("Você saiu da sua conta.");
              onClose?.();
              onSuccess?.("Sessão encerrada.");
            }}
          >
            <LogOut size={15} /> SAIR DA CONTA
          </button>

          {!confirmandoExclusao ? (
            <button
              type="button"
              className="danger-button"
              onClick={() => setConfirmandoExclusao(true)}
              disabled={semId || excluindo}
            >
              <Trash2 size={15} /> EXCLUIR CONTA
            </button>
          ) : (
            <div className="confirm-inline">
              <span>Excluir definitivamente?</span>
              <button type="button" className="danger-button" onClick={excluirConta} disabled={excluindo}>
                {excluindo ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />} SIM, EXCLUIR
              </button>
              <button type="button" className="ghost-button" onClick={() => setConfirmandoExclusao(false)}>
                NÃO
              </button>
            </div>
          )}
        </div>
        <p className="sheet-foot">
          Excluir usa <code>DELETE /Usuarios/:id</code> e remove o documento do MongoDB.
        </p>
      </section>
    </div>
  );
}

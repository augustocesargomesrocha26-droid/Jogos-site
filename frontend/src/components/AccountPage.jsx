import { BadgeCheck, Clock, Fingerprint, KeyRound, LogIn, LogOut, Mail, Settings2, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function formatarData(valor) {
  if (!valor) return "—";
  try {
    return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

/** Página "#/conta": resumo da sessão + atalho para editar os dados. */
export default function AccountPage({ onEditar, onLoginClick, onSair }) {
  const { autenticado, usuario, iniciais, semId } = useAuth();

  if (!autenticado) {
    return (
      <section className="catalog-section conta-section" id="conta">
        <div className="empty-state">
          <ShieldCheck size={42} />
          <h3>ÁREA RESTRITA</h3>
          <p>Entre na sua conta para ver e editar seus dados.</p>
          <button className="primary-button" style={{ marginTop: 18 }} onClick={onLoginClick}>
            <LogIn size={16} /> ENTRAR
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="catalog-section conta-section" id="conta">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <BadgeCheck size={15} /> MINHA CONTA
          </span>
          <h2>
            SEUS <span>DADOS</span>
          </h2>
          <p>Informações da sessão atual e edição do cadastro.</p>
        </div>
        <button className="refresh-button" onClick={onEditar}>
          <Settings2 size={16} /> EDITAR DADOS
        </button>
      </div>

      <div className="conta-grid">
        <div className="conta-card destaque">
          <span className="avatar grande">{iniciais}</span>
          <h3>{usuario?.email}</h3>
          <p>Usuário autenticado</p>
          <button className="primary-button" onClick={onEditar}>
            <Settings2 size={16} /> EDITAR MEUS DADOS
          </button>
          <button className="ghost-button" onClick={onSair}>
            <LogOut size={15} /> SAIR DA CONTA
          </button>
        </div>

        <div className="conta-card">
          <div className="conta-row">
            <span>
              <Fingerprint size={15} /> ID NO MONGO
            </span>
            <strong>{usuario?.id || "não retornado pela API"}</strong>
          </div>
          <div className="conta-row">
            <span>
              <Mail size={15} /> E-MAIL
            </span>
            <strong>{usuario?.email}</strong>
          </div>
          <div className="conta-row">
            <span>
              <Clock size={15} /> LOGIN EM
            </span>
            <strong>{formatarData(usuario?.entrouEm)}</strong>
          </div>
          <div className="conta-row">
            <span>
              <KeyRound size={15} /> TOKEN EXPIRA EM
            </span>
            <strong>{formatarData(usuario?.expiraEm)}</strong>
          </div>
          {semId && (
            <div className="form-erro" style={{ marginTop: 16 }}>
              <ShieldCheck size={15} />
              <span>
                Sem o <code>id</code> na resposta do login, a edição (<code>PUT /Usuarios/:id</code>) fica bloqueada.
                Ajuste o controller de login conforme o README.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

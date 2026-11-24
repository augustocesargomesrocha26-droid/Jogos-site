import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Gamepad2, Image, Link2, Loader2, Save, Tag, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { atualizarJogo, criarJogo } from "../services/api";

/**
 * Campos do formulário. Cada campo aceita apelidos porque o catálogo
 * pode ter sido cadastrado com nomes diferentes no MongoDB.
 */
const CAMPOS = [
  {
    id: "nome",
    rotulo: "NOME DO JOGO",
    aliases: ["nome", "titulo", "title", "name"],
    icone: Gamepad2,
    placeholder: "Ex.: Caça ao Tesouro Matemático",
    obrigatorio: true,
  },
  {
    id: "descricao",
    rotulo: "DESCRIÇÃO",
    aliases: ["descricao", "descrição", "description", "resumo"],
    placeholder: "Como o jogo funciona e o que ele ensina",
    texto: true,
  },
  {
    id: "categoria",
    rotulo: "CATEGORIA",
    aliases: ["categoria", "category", "tipo", "genero", "gênero"],
    icone: Tag,
    placeholder: "Ex.: Matemática",
  },
  {
    id: "imagem",
    rotulo: "URL DA CAPA",
    aliases: ["imagem", "image", "capa", "thumbnail", "urlImagem", "url_imagem"],
    icone: Image,
    placeholder: "https://.../capa.png",
  },
  {
    id: "link",
    rotulo: "LINK DO JOGO",
    aliases: ["link", "url", "href", "urlJogo", "jogoUrl"],
    icone: Link2,
    placeholder: "https://.../jogar",
  },
];

function valorDe(jogo, aliases) {
  if (!jogo) return "";
  for (const chave of aliases) {
    const valor = jogo[chave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") return String(valor);
  }
  return "";
}

function chaveDe(jogo, aliases, padrao) {
  if (!jogo) return padrao;
  const existente = aliases.find((chave) => Object.prototype.hasOwnProperty.call(jogo, chave));
  return existente || padrao;
}

/**
 * Cadastro/edição de jogos.
 *   criar  -> POST /Jogos   (token)
 *   editar -> PUT /Jogos/:id (token)
 */
export default function GameFormModal({ open, jogo, onClose, onSaved }) {
  const { token, tratarErro } = useAuth();
  const editando = Boolean(jogo);
  const [form, setForm] = useState({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const inicial = useMemo(() => {
    const valores = {};
    for (const campo of CAMPOS) valores[campo.id] = valorDe(jogo, campo.aliases);
    return valores;
  }, [jogo]);

  useEffect(() => {
    if (open) {
      setForm(inicial);
      setErro("");
      setSalvando(false);
    }
  }, [open, inicial]);

  if (!open) return null;

  function atualizarCampo(id, valor) {
    setForm((atual) => ({ ...atual, [id]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (salvando) return;
    setErro("");

    if (!String(form.nome || "").trim()) {
      setErro("O nome do jogo é obrigatório.");
      return;
    }

    // Monta o corpo respeitando a chave original do documento (quando existir).
    const corpo = {};
    for (const campo of CAMPOS) {
      const chave = chaveDe(jogo, campo.aliases, campo.id);
      const valorNovo = String(form[campo.id] ?? "").trim();
      const valorAntigo = String(inicial[campo.id] ?? "").trim();
      if (!editando) {
        if (valorNovo) corpo[chave] = valorNovo;
      } else if (valorNovo !== valorAntigo) {
        corpo[chave] = valorNovo; // string vazia remove o campo no backend
      }
    }

    if (editando && Object.keys(corpo).length === 0) {
      setErro("Nenhum campo foi alterado.");
      return;
    }

    setSalvando(true);
    try {
      if (editando) {
        const id = jogo._id || jogo.id;
        await atualizarJogo(id, corpo, token);
        onSaved?.(`Jogo "${corpo[chaveDe(jogo, ["nome", "titulo", "title", "name"], "nome")] || valorDe(jogo, ["nome"])}" atualizado.`);
      } else {
        await criarJogo(corpo, token);
        onSaved?.(`Jogo "${corpo.nome}" cadastrado.`);
      }
      onClose?.();
    } catch (falha) {
      if (!tratarErro(falha)) setErro(falha?.message || "Não foi possível salvar o jogo.");
      else onClose?.();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(evento) => evento.target === evento.currentTarget && !salvando && onClose?.()}
    >
      <section className="sheet wide" role="dialog" aria-modal="true" aria-labelledby="jogo-form-title">
        <button className="sheet-close" onClick={() => !salvando && onClose?.()} aria-label="Fechar">
          <X size={18} />
        </button>

        <span className="eyebrow">
          <Gamepad2 size={14} /> {editando ? "EDITAR JOGO" : "NOVO JOGO"}
        </span>
        <h2 id="jogo-form-title">{editando ? "ATUALIZAR FICHA" : "ADICIONAR AO CATÁLOGO"}</h2>
        <p className="sheet-sub">
          {editando ? (
            <>
              Envia apenas os campos alterados para <code>PUT /Jogos/:id</code>.
            </>
          ) : (
            <>
              Envia <code>{"{ jogo: {...} }"}</code> para <code>POST /Jogos</code>. O backend recusa nomes repetidos.
            </>
          )}
        </p>

        <form onSubmit={enviar} noValidate>
          {CAMPOS.map((campo) => {
            const Icone = campo.icone;
            return (
              <div className="field" key={campo.id}>
                <label htmlFor={`jogo-${campo.id}`}>
                  {campo.rotulo}
                  {campo.obrigatorio ? " *" : ""}
                </label>
                <div className={campo.texto ? "input-wrap area" : "input-wrap"}>
                  {Icone ? <Icone size={15} /> : null}
                  {campo.texto ? (
                    <textarea
                      id={`jogo-${campo.id}`}
                      rows={3}
                      placeholder={campo.placeholder}
                      value={form[campo.id] || ""}
                      onChange={(evento) => atualizarCampo(campo.id, evento.target.value)}
                      disabled={salvando}
                    />
                  ) : (
                    <input
                      id={`jogo-${campo.id}`}
                      type="text"
                      placeholder={campo.placeholder}
                      value={form[campo.id] || ""}
                      onChange={(evento) => atualizarCampo(campo.id, evento.target.value)}
                      disabled={salvando}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {erro && (
            <div className="form-erro" role="alert">
              <AlertTriangle size={15} />
              <span>{erro}</span>
            </div>
          )}

          <div className="sheet-actions">
            <button type="submit" className="primary-button" disabled={salvando}>
              {salvando ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {salvando ? "SALVANDO..." : editando ? "SALVAR JOGO" : "CADASTRAR JOGO"}
            </button>
            <button type="button" className="ghost-button" onClick={() => onClose?.()} disabled={salvando}>
              CANCELAR
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

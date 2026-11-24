import { BookOpen, ExternalLink, Gamepad2, Pencil, Tag, Trash2, X } from "lucide-react";

const HIDDEN = new Set(["_id", "id", "__v"]);

function labelize(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default function GameModal({ game, onClose, onEdit, onDelete, podeEditar }) {
  if (!game) return null;

  const title = game.nome || game.titulo || game.title || game.name || "Detalhes do jogo";
  const image = game.imagem || game.image || game.capa || game.thumbnail || game.urlImagem || game.url_imagem;
  const link = game.link || game.url || game.href || game.urlJogo || game.jogoUrl;
  const entries = Object.entries(game).filter(
    ([key, value]) =>
      !HIDDEN.has(key) &&
      value !== null &&
      value !== undefined &&
      typeof value !== "object" &&
      String(value).trim()
  );

  return (
    <div className="modal-backdrop" onMouseDown={(evento) => evento.target === evento.currentTarget && onClose()}>
      <section className="game-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X />
        </button>
        <div className="modal-art">
          {image ? <img src={image} alt={`Capa de ${title}`} /> : <Gamepad2 size={68} />}
          <div className="modal-art-shade" />
        </div>
        <div className="modal-content">
          <span className="eyebrow">
            <BookOpen size={14} /> FICHA DO JOGO
          </span>
          <h2 id="modal-title">{title}</h2>
          <div className="detail-list">
            {entries.map(([key, value]) => (
              <div className="detail-row" key={key}>
                <span>
                  <Tag size={14} /> {labelize(key)}
                </span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            {link && (
              <a className="primary-button" href={link} target="_blank" rel="noreferrer">
                ABRIR JOGO <ExternalLink size={15} />
              </a>
            )}
            {podeEditar && (
              <>
                <button className="ghost-button" onClick={() => onEdit?.(game)}>
                  <Pencil size={15} /> EDITAR
                </button>
                <button className="danger-button" onClick={() => onDelete?.(game)}>
                  <Trash2 size={15} /> EXCLUIR
                </button>
              </>
            )}
            <button className="ghost-button modal-done" onClick={onClose}>
              VOLTAR AO CATÁLOGO
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

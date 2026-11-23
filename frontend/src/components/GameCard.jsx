import { Gamepad2, ExternalLink, Info } from "lucide-react";

function firstValue(game, keys) {
  for (const key of keys) {
    const value = game?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

export default function GameCard({ game, onDetails }) {
  const title = firstValue(game, ["nome", "titulo", "title", "name"]) || "Jogo sem título";
  const description = firstValue(game, ["descricao", "descrição", "description", "resumo"]);
  const image = firstValue(game, ["imagem", "image", "capa", "thumbnail", "urlImagem", "url_imagem"]);
  const category = firstValue(game, ["categoria", "category", "tipo", "genero", "gênero"]);

  return (
    <article className="game-card">
      <button className="cover-button" onClick={onDetails} aria-label={`Ver detalhes de ${title}`}>
        {image ? (
          <img className="game-cover" src={image} alt={`Capa de ${title}`} loading="lazy"
            onError={(event) => { event.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="cover-placeholder"><Gamepad2 size={48} /><span>GAME LIBRARY</span></div>
        )}
        <span className="cover-overlay"><Info size={17} /> VER DETALHES</span>
      </button>
      <div className="game-info">
        <div className="game-tags">
          <span className="tag">{category || "JOGO"}</span>
          <span className="tag tag-live">DISPONÍVEL</span>
        </div>
        <h3>{title}</h3>
        <p>{description || "Explore este jogo da biblioteca Jogos 4INFO3."}</p>
        <button className="text-button" onClick={onDetails}>Explorar jogo <ExternalLink size={15} /></button>
      </div>
    </article>
  );
}
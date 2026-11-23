import { useEffect, useMemo, useState } from "react";
import { Search, Gamepad2, RefreshCw, Zap, LibraryBig, ChevronDown, AlertTriangle, Wifi, Menu, X } from "lucide-react";
import { getJogos } from "./services/api";
import GameCard from "./components/GameCard";
import GameModal from "./components/GameModal";

export default function App() {
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("TODOS");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function loadGames() {
    setLoading(true);
    setError("");
    try {
      const result = await getJogos();
      setGames(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || "Erro inesperado ao carregar os jogos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGames(); }, []);

  const categories = useMemo(() => {
    const values = games.map((game) => game.categoria || game.category || game.tipo || game.genero || game.gênero)
      .filter((value) => typeof value === "string" && value.trim());
    return ["TODOS", ...new Set(values.map((value) => value.toUpperCase()))];
  }, [games]);

  const filteredGames = useMemo(() => games.filter((game) => {
    const title = game.nome || game.titulo || game.title || game.name || "";
    const description = game.descricao || game["descrição"] || game.description || "";
    const textMatch = `${title} ${description}`.toLowerCase().includes(query.toLowerCase());
    const gameCategory = String(game.categoria || game.category || game.tipo || game.genero || game.gênero || "").toUpperCase();
    return textMatch && (category === "TODOS" || gameCategory === category);
  }), [games, query, category]);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Jogos 4INFO3 início">
          <span className="brand-mark"><Gamepad2 size={24} /></span>
          <span>JOGOS<span className="brand-accent">4INFO3</span><small>GAME PORTAL</small></span>
        </a>
        <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"}>
          <a className="nav-active" href="#home" onClick={() => setMobileMenu(false)}>INÍCIO</a>
          <a href="#catalogo" onClick={() => setMobileMenu(false)}>CATÁLOGO</a>
          <a href="#sobre" onClick={() => setMobileMenu(false)}>SOBRE</a>
        </nav>
        <div className="topbar-right">
          <span className="api-status"><span className="status-dot" /> API</span>
          <button className="mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menu">
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="hero-kicker"><Zap size={14} /> SUA PRÓXIMA FASE COMEÇA AQUI</div>
            <h1>JOGUE.<br /><span>DESCUBRA.</span><br />EVOLUA.</h1>
            <p>Uma biblioteca de experiências e jogos educacionais criada para a comunidade 4INFO3.</p>
            <a className="primary-button hero-button" href="#catalogo">EXPLORAR JOGOS <ChevronDown size={17} /></a>
            <div className="hero-stats">
              <div><strong>{games.length.toString().padStart(2, "0")}</strong><span>JOGOS NA BASE</span></div>
              <i />
              <div><strong>4INFO3</strong><span>COMUNIDADE</span></div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-ring ring-one" /><div className="hero-ring ring-two" />
            <div className="hero-console"><Gamepad2 size={130} strokeWidth={1.15} /></div>
            <span className="floating-chip chip-a">PLAYER 01</span>
            <span className="floating-chip chip-b">LEVEL UP +1</span>
            <span className="floating-cross cross-a">+</span><span className="floating-cross cross-b">✳</span>
          </div>
          <div className="hero-grid" />
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="section-heading">
            <div><span className="eyebrow"><LibraryBig size={15} /> GAME DATABASE</span><h2>EXPLORE O <span>CATÁLOGO</span></h2>
              <p>Encontre seu próximo desafio.</p></div>
            <button className="refresh-button" onClick={loadGames} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} /> ATUALIZAR</button>
          </div>

          <div className="catalog-toolbar">
            <label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou descrição..." /><kbd>⌕</kbd></label>
            <div className="category-list" aria-label="Filtrar por categoria">
              {categories.map((item) => <button key={item} className={category === item ? "category-pill selected" : "category-pill"} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
          </div>

          {error && <div className="error-panel"><AlertTriangle size={20} /><div><strong>Não foi possível carregar o catálogo</strong><p>{error}</p><button onClick={loadGames}>Tentar novamente</button></div></div>}
          {loading && <div className="loading-grid">{[1,2,3].map((n) => <div className="skeleton-card" key={n}><div /><span /><span /></div>)}</div>}
          {!loading && !error && filteredGames.length > 0 && (
            <div className="games-grid">{filteredGames.map((game, index) => (
              <GameCard key={game._id || game.id || index} game={game} onDetails={() => setSelected(game)} />
            ))}</div>
          )}
          {!loading && !error && games.length === 0 && <div className="empty-state"><Gamepad2 size={42} /><h3>NENHUM JOGO CADASTRADO</h3><p>Quando os jogos forem adicionados ao banco de dados, eles aparecerão aqui.</p></div>}
          {!loading && !error && games.length > 0 && filteredGames.length === 0 && <div className="empty-state"><Search size={38} /><h3>NENHUM RESULTADO</h3><p>Tente outro termo ou selecione outra categoria.</p><button className="text-button" onClick={() => {setQuery("");setCategory("TODOS");}}>Limpar filtros</button></div>}
          <div className="catalog-foot"><span><Wifi size={14} /> DADOS CARREGADOS DA API</span><span>{lastUpdate ? `ATUALIZADO ÀS ${lastUpdate.toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"})}` : "AGUARDANDO CONEXÃO"}</span></div>
        </section>

        <section className="bottom-banner" id="sobre"><div className="banner-icon"><Zap size={26} /></div><div><span className="eyebrow">READY PLAYER ONE?</span><h2>O CONHECIMENTO É SEU POWER-UP.</h2><p>Projeto educacional desenvolvido pela turma 4INFO3.</p></div><a href="#catalogo">VER JOGOS ↗</a></section>
      </main>
      <footer><span>© 2026 JOGOS 4INFO3</span><span>FEITO PARA QUEM GOSTA DE APRENDER JOGANDO <span className="brand-accent">◆</span></span></footer>
      <GameModal game={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
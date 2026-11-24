import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Gamepad2,
  LibraryBig,
  Lock,
  PencilRuler,
  Plus,
  RefreshCw,
  Search,
  Wifi,
  Zap,
} from "lucide-react";
import { getJogos, excluirJogo } from "./services/api";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import GameCard from "./components/GameCard";
import GameModal from "./components/GameModal";
import Login from "./components/Login";
import ProfileModal from "./components/ProfileModal";
import GameFormModal from "./components/GameFormModal";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";
import AccountPage from "./components/AccountPage";

/** Rota simples por hash: "#/conta" abre a área do usuário; qualquer outra coisa é o catálogo. */
function useRota() {
  const ler = () => (window.location.hash.replace(/^#\/?/, "").toLowerCase() === "conta" ? "conta" : "home");
  const [rota, setRota] = useState(ler);

  useEffect(() => {
    const aoMudar = () => {
      const nova = ler();
      setRota(nova);
      if (nova === "conta") window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);

  return rota;
}

export default function App() {
  const rota = useRota();
  const { autenticado, aviso, limparAviso, sair, tratarErro, token } = useAuth();

  const [games, setGames] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("TODOS");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Modais / fluxos de autenticação e edição
  const [loginOpen, setLoginOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [jogoEmEdicao, setJogoEmEdicao] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [toast, setToast] = useState(null);

  const avisar = useCallback((texto, tipo = "ok") => setToast({ texto, tipo }), []);

  const loadGames = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // Mensagens vindas do contexto de autenticação (sessão expirada, logout...)
  useEffect(() => {
    if (!aviso) return;
    setToast({ texto: aviso, tipo: "info" });
    limparAviso();
  }, [aviso, limparAviso]);

  // Fecha o painel de detalhes se o jogo exibido for removido
  useEffect(() => {
    if (!selected) return;
    const aindaExiste = games.some((item) => (item._id || item.id) === (selected._id || selected.id));
    if (!aindaExiste) setSelected(null);
  }, [games, selected]);

  const categories = useMemo(() => {
    const values = games
      .map((game) => game.categoria || game.category || game.tipo || game.genero || game.gênero)
      .filter((value) => typeof value === "string" && value.trim());
    return ["TODOS", ...new Set(values.map((value) => value.toUpperCase()))];
  }, [games]);

  const filteredGames = useMemo(
    () =>
      games.filter((game) => {
        const title = game.nome || game.titulo || game.title || game.name || "";
        const description = game.descricao || game["descrição"] || game.description || "";
        const textMatch = `${title} ${description}`.toLowerCase().includes(query.toLowerCase());
        const gameCategory = String(
          game.categoria || game.category || game.tipo || game.genero || game.gênero || ""
        ).toUpperCase();
        return textMatch && (category === "TODOS" || gameCategory === category);
      }),
    [games, query, category]
  );

  /* ---------------- ações de jogo ---------------- */

  function exigirLogin(acao) {
    if (!autenticado) {
      setLoginOpen(true);
      avisar("Entre na sua conta para editar o catálogo.", "info");
      return;
    }
    acao();
  }

  function abrirNovoJogo() {
    exigirLogin(() => {
      setJogoEmEdicao(null);
      setFormOpen(true);
    });
  }

  function abrirEdicao(jogo) {
    exigirLogin(() => {
      setJogoEmEdicao(jogo);
      setFormOpen(true);
      setSelected(null);
    });
  }

  function pedirExclusao(jogo) {
    exigirLogin(() => {
      const nome = jogo.nome || jogo.titulo || jogo.title || jogo.name || "este jogo";
      setConfirmacao({ jogo, mensagem: `O jogo "${nome}" será removido do MongoDB (DELETE /Jogos/:id). Essa ação não pode ser desfeita.` });
    });
  }

  async function confirmarExclusao() {
    if (!confirmacao?.jogo) return;
    setExcluindo(true);
    try {
      const id = confirmacao.jogo._id || confirmacao.jogo.id;
      await excluirJogo(id, token);
      setConfirmacao(null);
      avisar("Jogo excluído do catálogo.");
      await loadGames();
    } catch (falha) {
      if (!tratarErro(falha)) avisar(falha?.message || "Não foi possível excluir o jogo.", "erro");
      else setConfirmacao(null);
    } finally {
      setExcluindo(false);
    }
  }

  function sairDaConta() {
    sair("Você saiu da sua conta.");
    if (rota === "conta") window.location.hash = "#catalogo";
  }

  const conteudoConta = rota === "conta";

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <Navbar
        rota={rota}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        onLoginClick={() => setLoginOpen(true)}
        onAccountClick={(acao) => {
          if (acao === "editar") setPerfilOpen(true);
          else window.location.hash = "#/conta";
        }}
        onLogout={sairDaConta}
      />

      <main>
        {conteudoConta ? (
          <AccountPage
            onEditar={() => setPerfilOpen(true)}
            onLoginClick={() => setLoginOpen(true)}
            onSair={sairDaConta}
          />
        ) : (
          <>
            <section className="hero" id="home">
              <div className="hero-copy">
                <div className="hero-kicker">
                  <Zap size={14} /> SUA PRÓXIMA FASE COMEÇA AQUI
                </div>
                <h1>
                  JOGUE.
                  <br />
                  <span>DESCUBRA.</span>
                  <br />
                  EVOLUA.
                </h1>
                <p>Uma biblioteca de experiências e jogos educacionais criada para a comunidade 4INFO3.</p>
                <a className="primary-button hero-button" href="#catalogo">
                  EXPLORAR JOGOS <ChevronDown size={17} />
                </a>
                <div className="hero-stats">
                  <div>
                    <strong>{games.length.toString().padStart(2, "0")}</strong>
                    <span>JOGOS NA BASE</span>
                  </div>
                  <i />
                  <div>
                    <strong>4INFO3</strong>
                    <span>COMUNIDADE</span>
                  </div>
                </div>
              </div>
              <div className="hero-visual" aria-hidden="true">
                <div className="hero-ring ring-one" />
                <div className="hero-ring ring-two" />
                <div className="hero-console">
                  <Gamepad2 size={130} strokeWidth={1.15} />
                </div>
                <span className="floating-chip chip-a">PLAYER 01</span>
                <span className="floating-chip chip-b">LEVEL UP +1</span>
                <span className="floating-cross cross-a">+</span>
                <span className="floating-cross cross-b">✳</span>
              </div>
              <div className="hero-grid" />
            </section>

            <section className="catalog-section" id="catalogo">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    <LibraryBig size={15} /> GAME DATABASE
                  </span>
                  <h2>
                    EXPLORE O <span>CATÁLOGO</span>
                  </h2>
                  <p>Encontre seu próximo desafio.</p>
                </div>
                <div className="heading-actions">
                  {autenticado && (
                    <button className="primary-button compact" onClick={abrirNovoJogo}>
                      <Plus size={16} /> NOVO JOGO
                    </button>
                  )}
                  <button className="refresh-button" onClick={loadGames} disabled={loading}>
                    <RefreshCw size={16} className={loading ? "spin" : ""} /> ATUALIZAR
                  </button>
                </div>
              </div>

              {autenticado ? (
                <div className="editor-bar">
                  <span>
                    <PencilRuler size={15} /> MODO EDITOR ATIVO — você pode cadastrar, editar e excluir jogos.
                  </span>
                  <button className="text-button" onClick={() => setPerfilOpen(true)}>
                    meus dados
                  </button>
                </div>
              ) : (
                <div className="editor-bar bloqueado">
                  <span>
                    <Lock size={15} /> Catálogo em modo leitura. Entre para editar os dados.
                  </span>
                  <button className="text-button" onClick={() => setLoginOpen(true)}>
                    entrar
                  </button>
                </div>
              )}

              <div className="catalog-toolbar">
                <label className="search-box">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={(evento) => setQuery(evento.target.value)}
                    placeholder="Buscar por nome ou descrição..."
                  />
                  <kbd>⌕</kbd>
                </label>
                <div className="category-list" aria-label="Filtrar por categoria">
                  {categories.map((item) => (
                    <button
                      key={item}
                      className={category === item ? "category-pill selected" : "category-pill"}
                      onClick={() => setCategory(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="error-panel">
                  <AlertTriangle size={20} />
                  <div>
                    <strong>Não foi possível carregar o catálogo</strong>
                    <p>{error}</p>
                    <button onClick={loadGames}>Tentar novamente</button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="loading-grid">
                  {[1, 2, 3].map((n) => (
                    <div className="skeleton-card" key={n}>
                      <div />
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              )}

              {!loading && !error && filteredGames.length > 0 && (
                <div className="games-grid">
                  {filteredGames.map((game, index) => (
                    <GameCard
                      key={game._id || game.id || index}
                      game={game}
                      onDetails={() => setSelected(game)}
                      onEdit={() => abrirEdicao(game)}
                      onDelete={() => pedirExclusao(game)}
                      podeEditar={autenticado}
                    />
                  ))}
                </div>
              )}

              {!loading && !error && games.length === 0 && (
                <div className="empty-state">
                  <Gamepad2 size={42} />
                  <h3>NENHUM JOGO CADASTRADO</h3>
                  <p>Quando os jogos forem adicionados ao banco de dados, eles aparecerão aqui.</p>
                  {autenticado && (
                    <button className="primary-button" style={{ marginTop: 18 }} onClick={abrirNovoJogo}>
                      <Plus size={16} /> CADASTRAR O PRIMEIRO JOGO
                    </button>
                  )}
                </div>
              )}

              {!loading && !error && games.length > 0 && filteredGames.length === 0 && (
                <div className="empty-state">
                  <Search size={38} />
                  <h3>NENHUM RESULTADO</h3>
                  <p>Tente outro termo ou selecione outra categoria.</p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setQuery("");
                      setCategory("TODOS");
                    }}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}

              <div className="catalog-foot">
                <span>
                  <Wifi size={14} /> DADOS CARREGADOS DA API
                </span>
                <span>
                  {lastUpdate
                    ? `ATUALIZADO ÀS ${lastUpdate.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "AGUARDANDO CONEXÃO"}
                </span>
              </div>
            </section>

            <section className="bottom-banner" id="sobre">
              <div className="banner-icon">
                <Zap size={26} />
              </div>
              <div>
                <span className="eyebrow">READY PLAYER ONE?</span>
                <h2>O CONHECIMENTO É SEU POWER-UP.</h2>
                <p>Projeto educacional desenvolvido pela turma 4INFO3.</p>
              </div>
              <a href="#catalogo">VER JOGOS ↗</a>
            </section>
          </>
        )}
      </main>

      <footer>
        <span>© 2026 JOGOS 4INFO3</span>
        <span>
          FEITO PARA QUEM GOSTA DE APRENDER JOGANDO <span className="brand-accent">◆</span>
        </span>
      </footer>

      <GameModal
        game={selected}
        onClose={() => setSelected(null)}
        onEdit={abrirEdicao}
        onDelete={pedirExclusao}
        podeEditar={autenticado}
      />

      <Login
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={(mensagem) => avisar(mensagem)}
      />

      <ProfileModal
        open={perfilOpen}
        onClose={() => setPerfilOpen(false)}
        onSuccess={(mensagem) => avisar(mensagem)}
      />

      <GameFormModal
        open={formOpen}
        jogo={jogoEmEdicao}
        onClose={() => {
          setFormOpen(false);
          setJogoEmEdicao(null);
        }}
        onSaved={(mensagem) => {
          avisar(mensagem);
          loadGames();
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmacao)}
        titulo="EXCLUIR JOGO?"
        mensagem={confirmacao?.mensagem}
        confirmarTexto="SIM, EXCLUIR"
        processando={excluindo}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setConfirmacao(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Gamepad2, LogIn, LogOut, Menu, Settings2, UserRound, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Topbar do portal. Quando existe sessão, mostra o chip do usuário
 * com atalhos para "Minha conta" (edição de dados) e "Sair".
 */
export default function Navbar({ rota, mobileMenu, setMobileMenu, onLoginClick, onAccountClick, onLogout }) {
  const { autenticado, usuario, iniciais } = useAuth();
  const [aberto, setAberto] = useState(false);
  const areaRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (evento) => {
      if (!areaRef.current?.contains(evento.target)) setAberto(false);
    };
    const aoTeclar = (evento) => evento.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  useEffect(() => setAberto(false), [rota]);

  return (
    <header className="topbar">
      <a className="brand" href="#home" aria-label="Jogos 4INFO3 início">
        <span className="brand-mark">
          <Gamepad2 size={24} />
        </span>
        <span>
          JOGOS<span className="brand-accent">4INFO3</span>
          <small>GAME PORTAL</small>
        </span>
      </a>

      <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"}>
        <a className={rota === "home" ? "nav-active" : ""} href="#home" onClick={() => setMobileMenu(false)}>
          INÍCIO
        </a>
        <a href="#catalogo" onClick={() => setMobileMenu(false)}>
          CATÁLOGO
        </a>
        <a href="#sobre" onClick={() => setMobileMenu(false)}>
          SOBRE
        </a>
        {autenticado && (
          <a
            className={rota === "conta" ? "nav-active" : ""}
            href="#/conta"
            onClick={() => setMobileMenu(false)}
          >
            MINHA CONTA
          </a>
        )}
      </nav>

      <div className="topbar-right">
        <span className="api-status">
          <span className="status-dot" /> API
        </span>

        {autenticado ? (
          <div className="auth-area" ref={areaRef}>
            <button
              className={aberto ? "user-chip aberto" : "user-chip"}
              onClick={() => setAberto((valor) => !valor)}
              aria-haspopup="menu"
              aria-expanded={aberto}
            >
              <span className="avatar">{iniciais}</span>
              <span className="user-chip-texto">
                <strong>{usuario?.email}</strong>
                <small>CONECTADO</small>
              </span>
              <ChevronDown size={15} className={aberto ? "girado" : ""} />
            </button>

            {aberto && (
              <div className="user-dropdown" role="menu">
                <button role="menuitem" onClick={() => { setAberto(false); onAccountClick?.(); }}>
                  <UserRound size={15} /> MINHA CONTA
                </button>
                <button role="menuitem" onClick={() => { setAberto(false); onAccountClick?.("editar"); }}>
                  <Settings2 size={15} /> EDITAR MEUS DADOS
                </button>
                <button role="menuitem" className="perigo" onClick={() => { setAberto(false); onLogout?.(); }}>
                  <LogOut size={15} /> SAIR
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="login-button" onClick={onLoginClick}>
            <LogIn size={15} /> ENTRAR
          </button>
        )}

        <button className="mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menu">
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

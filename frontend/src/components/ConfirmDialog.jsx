import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

/** Confirmação genérica (usada antes de DELETE). */
export default function ConfirmDialog({
  open,
  titulo = "CONFIRMAR AÇÃO",
  mensagem,
  confirmarTexto = "CONFIRMAR",
  onConfirmar,
  onCancelar,
  processando = false,
}) {
  if (!open) return null;

  return (
    <div className="sheet-backdrop" onMouseDown={(evento) => evento.target === evento.currentTarget && !processando && onCancelar?.()}>
      <section className="sheet confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <span className="eyebrow perigo">
          <AlertTriangle size={14} /> ATENÇÃO
        </span>
        <h2 id="confirm-title">{titulo}</h2>
        <p className="sheet-sub">{mensagem}</p>
        <div className="sheet-actions">
          <button type="button" className="danger-button solido" onClick={onConfirmar} disabled={processando}>
            {processando ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
            {processando ? "PROCESSANDO..." : confirmarTexto}
          </button>
          <button type="button" className="ghost-button" onClick={onCancelar} disabled={processando}>
            CANCELAR
          </button>
        </div>
      </section>
    </div>
  );
}

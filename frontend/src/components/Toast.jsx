import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const ICONES = {
  ok: CheckCircle2,
  erro: AlertTriangle,
  info: Info,
};

/** Aviso flutuante de sucesso/erro. Fecha sozinho em 4,5s. */
export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => onClose?.(), 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const Icone = ICONES[toast.tipo] || Info;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      <div className={`toast ${toast.tipo || "info"}`}>
        <Icone size={17} />
        <span>{toast.texto}</span>
        <button onClick={() => onClose?.()} aria-label="Fechar aviso">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

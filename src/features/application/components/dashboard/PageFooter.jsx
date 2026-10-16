// [INTERFAZ: PIE DE PÁGINA] Cierre breve de la pantalla principal.
import { Sparkles } from 'lucide-react';
export default function PageFooter() {
  return (
    <footer className="page-footer">
      <span>
        <Sparkles size={13} />
        Lo compartido se siente más liviano.
      </span>
      <span>En Equipo · Hecho para convivir mejor</span>
    </footer>
  );
}

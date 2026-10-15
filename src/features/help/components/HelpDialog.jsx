import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleHelp, Plus, Sparkles, X } from 'lucide-react';

export default function HelpDialog({ open, onClose, onCreateTask, onAddMember, onManageHouseholds, canManageMembers, guest = false }) {
  const [activeTab, setActiveTab] = useState('guide');

  useEffect(() => {
    if (open) setActiveTab('guide');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const steps = [
    { title: 'Inviten a quienes comparten el hogar', detail: guest ? 'Creá una cuenta para armar tu hogar e invitar a las personas que viven con vos.' : canManageMembers ? 'Invitá una cuenta por correo o compartí el QR y el código corto para que cada persona se una.' : 'Cada persona se suma desde su cuenta con el QR o el código del hogar.', action: guest || canManageMembers ? onAddMember : onManageHouseholds, actionLabel: guest ? 'Crear una cuenta' : canManageMembers ? 'Invitar una cuenta' : 'Ver código del hogar', Icon: Plus },
    { title: 'Saquen pendientes de la cabeza', detail: 'Creen una tarea con su tipo, quién se ocupa y para cuándo. Los detalles ayudan a que nadie tenga que adivinar.', action: onCreateTask, actionLabel: guest ? 'Organizar tareas' : 'Crear una tarea', Icon: Sparkles },
    { title: 'Adapten las categorías', detail: 'El menú separa los temas del hogar. Quien administra puede renombrarlas, crear otras o borrarlas junto con sus tareas y borradores.' },
    { title: 'Cierren el ciclo', detail: 'Marquen una tarea como lista cuando esté resuelta. Si ya no hace falta, archívenla o mándenla a la papelera; también pueden recuperarla después.' },
  ];

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-dialog-title">
        <div className="help-dialog__top"><span className="help-dialog__mark"><CircleHelp size={19} /></span><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar ayuda"><X size={19} /></button></div>
        <span className="eyebrow">UN HOGAR MÁS LIVIANO</span>
        <h2 id="help-dialog-title">¿Cómo podemos ayudarte?</h2>
        <p className="task-dialog__intro">Una guía breve para empezar a organizarse entre todos.</p>
        <div className="help-tabs" role="tablist" aria-label="Ayuda de En Equipo">
          <button role="tab" aria-selected={activeTab === 'guide'} className={activeTab === 'guide' ? 'help-tab help-tab--active' : 'help-tab'} onClick={() => setActiveTab('guide')}>Guía rápida</button>
          <button role="tab" aria-selected={activeTab === 'faq'} className={activeTab === 'faq' ? 'help-tab help-tab--active' : 'help-tab'} onClick={() => setActiveTab('faq')}>Preguntas frecuentes</button>
        </div>

        {activeTab === 'guide' ? (
          <ol className="guide-list">
            {steps.map(({ title, detail, action, actionLabel, Icon }, index) => (
              <li className="guide-step" key={title}>
                <span className="guide-step__number">{index + 1}</span>
                <div className="guide-step__content"><h3>{title}</h3><p>{detail}</p>{action && <button className="text-link guide-step__action" onClick={() => { onClose(); action(); }}>{Icon && <Icon size={14} />}{actionLabel}<ArrowRight size={13} /></button>}</div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="faq-list">
            <details><summary>¿Se guardan los cambios que hago sin iniciar sesión?</summary><p>No. Podés probar la app con normalidad, pero esos cambios viven solo en esta sesión y se descartan al recargar. Iniciá sesión para guardar tu organización.</p></details>
            <details><summary>¿Cómo cambio la persona o la fecha de una tarea?</summary><p>En la fila de la tarea, tocá el ícono del lápiz. Podés cambiar el tipo, el responsable, la fecha y los detalles.</p></details>
            <details><summary>¿Qué pasa si cierro una tarea sin crearla?</summary><p>Lo que escribiste se guarda automáticamente como borrador en este dispositivo. Abrí “Borradores” para seguir completándola o eliminarla.</p></details>
            <details><summary>¿Puedo recuperar una tarea archivada o eliminada?</summary><p>Sí. En “Archivadas” o “Papelera” podés restaurarla. Para eliminarla definitivamente hay una confirmación final dentro de la papelera.</p></details>
            <details><summary>¿Qué muestra la campana?</summary><p>Las tareas vencidas y las que vencen dentro de los próximos siete días. Es un aviso dentro de la app, no una notificación push al teléfono.</p></details>
            <details><summary>¿Cómo se suma otra persona al hogar?</summary><p>Cada integrante necesita su propia cuenta. Desde el botón QR junto a “En casa” podés mostrar el código, compartir el enlace o preparar un SMS. Si están cerca, la otra persona puede escanear el QR con la cámara del teléfono. También se puede pedir acceso buscando el hogar por su nombre.</p></details>
            <details><summary>¿Puedo cambiar, crear o borrar categorías?</summary><p>Sí. En “Administrar categorías” podés cambiar el nombre y el ícono, sumar otras o borrar una. Al borrarla se eliminan definitivamente sus tareas y borradores; la app te muestra cuántos antes de confirmar.</p></details>
            <details><summary>¿Puedo participar en más de un hogar?</summary><p>Sí. Abrí el selector del hogar y elegí “Crear o unirme a otro hogar”. Después podés cambiar de hogar desde ese mismo selector.</p></details>
            <details><summary>¿Cómo se comparten los datos entre dispositivos?</summary><p>Las cuentas y los hogares funcionan en el servidor donde está instalada esta app. Para entrar desde otros dispositivos, hay que desplegarla en una dirección accesible con una base compartida.</p></details>
            <details><summary>¿Puedo usarla desde el teléfono?</summary><p>Sí. La interfaz se adapta a pantallas pequeñas y podés abrirla en el navegador del teléfono cuando la app esté publicada en una dirección accesible.</p></details>
            <details><summary>¿Cómo cambio el nombre, el apodo o lo que ven los demás?</summary><p>Tocá tu avatar. Podés editar nombre y apellido/s, elegir si mostrás el nombre, el nombre completo o un apodo, y cambiar foto, color y tema. El apellido queda privado si elegís solo el nombre o el apodo.</p></details>
            <details><summary>¿Qué hago si olvidé mi contraseña o mi correo?</summary><p>En el acceso, pedí un código por correo o por el teléfono que hayas verificado antes desde tu perfil. El código vence en 10 minutos. Confirmá “Sí, fui yo” para elegir una contraseña nueva o “No fui yo” para cancelar; si recibís un aviso que no pediste, no compartas el código.</p></details>
            <details><summary>¿Por qué no me llega el código?</summary><p>El servidor debe tener configurado el envío de correo o SMS. Si el medio no está configurado, la app te lo indica y no finge que envió el código.</p></details>
            <details><summary>¿Dónde queda guardada la información?</summary><p>En esta instalación queda en un archivo local del servidor. Reiniciar la app no borra las cuentas, los hogares ni las tareas.</p></details>
          </div>
        )}
        <div className="help-dialog__footer"><Check size={15} /><span>La idea no es hacerlo todo: es que nadie tenga que recordarlo todo.</span></div>
      </section>
    </div>
  );
}

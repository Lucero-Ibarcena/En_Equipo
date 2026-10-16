// [APLICACIÓN: TEXTO DE VISTAS] Centraliza títulos y descripciones de cada sección.
export function getViewCopy(view, categories) {
  const copyByView = {
    all: {
      title: 'El hogar, en equipo.',
      subtitle: 'Un espacio tranquilo para organizar lo que importa.',
      section: 'Lo que tenemos entre manos',
    },
    chores: {
      title: 'Tareas del hogar',
      subtitle: 'Las pequeñas cosas que hacen que la casa se sienta bien.',
      section: 'Tareas compartidas',
    },
    shopping: {
      title: 'Lista de compras',
      subtitle: 'Todo lo que hace falta, en un mismo lugar.',
      section: 'Pendiente para la próxima salida',
    },
    payments: {
      title: 'Pagos de la casa',
      subtitle: 'Fechas claras para que nada quede dando vueltas.',
      section: 'Próximos pagos',
    },
    repairs: {
      title: 'Arreglos y reparaciones',
      subtitle: 'Un lugar para registrar lo que la casa necesita.',
      section: 'Cosas para resolver',
    },
  };
  if (view === 'all') return copyByView.all;
  const category = categories[view];
  if (!category) return copyByView.all;
  const builtInCopy = copyByView[view];
  return builtInCopy
    ? {
        ...builtInCopy,
        title: category.label,
        section: category.label,
      }
    : {
        title: category.label,
        subtitle: `Un espacio compartido para ${category.label.toLocaleLowerCase('es-AR')}.`,
        section: category.label,
      };
}

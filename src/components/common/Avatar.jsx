// [INTERFAZ: AVATAR] Muestra la foto, las iniciales y el color de una persona.
export default function Avatar({ member, size = 'normal' }) {
  if (!member) return <span className={`avatar avatar--${size} avatar--empty`}>?</span>;
  return (
    <span
      className={`avatar avatar--${size} avatar--${member.color || 'sage'}`}
      title={member.name}
      aria-label={member.name}
    >
      {member.avatarData ? (
        <img src={member.avatarData} alt="" />
      ) : (
        member.initials || member.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

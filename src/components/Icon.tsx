interface IconProps {
  name: string;
  size?: number;
  spin?: boolean;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 20, spin, style }: IconProps) {
  return (
    <span
      className={spin ? "material-icons spin" : "material-icons"}
      aria-hidden="true"
      style={{ fontSize: size, lineHeight: 1, ...style }}
    >
      {name}
    </span>
  );
}

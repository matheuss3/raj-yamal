interface IconProps {
  name: string;
  size?: number;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 20, style }: IconProps) {
  return (
    <span className="material-icons" aria-hidden="true" style={{ fontSize: size, lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

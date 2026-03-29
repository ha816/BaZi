"use client";

interface Props {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: Props) {
  return (
    <span className="tooltip-trigger" tabIndex={0} role="button" aria-label={text}>
      {children}
      <span className="tooltip-content" role="tooltip">
        {text}
      </span>
    </span>
  );
}

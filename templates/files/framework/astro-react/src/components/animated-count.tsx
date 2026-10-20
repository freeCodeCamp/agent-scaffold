import type { CSSProperties, ReactNode } from 'react';

import './animated-count.css';

type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

type AnimatedCountProps = {
  n: number;
  size?: TextSize;
  children?: ReactNode;
};

export function AnimatedCount({ n, size, children }: AnimatedCountProps) {
  const style = {
    '--n': n,
    ...(size && { fontSize: `var(--text-size-${size})` }),
  } as CSSProperties;

  return (
    <span className="animated-count" style={style}>
      {children}
    </span>
  );
}

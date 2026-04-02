/**
 * Official Base chain logo — the same path used in NetworkSelector.
 * Renders as the blue "B" shape without any circle wrapper.
 */
interface BaseIconProps {
  size?: number;
  className?: string;
  /** 'mainnet' = #0052FF; 'testnet' = lighter #6b9fe4 */
  variant?: 'mainnet' | 'testnet';
}

export function BaseIcon({ size = 16, className = '', variant = 'mainnet' }: BaseIconProps) {
  const fill = variant === 'testnet' ? '#6b9fe4' : '#0052FF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 111 111"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`}
      aria-label={variant === 'testnet' ? 'Base Sepolia' : 'Base'}
    >
      <path
        d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z"
        fill={fill}
      />
    </svg>
  );
}

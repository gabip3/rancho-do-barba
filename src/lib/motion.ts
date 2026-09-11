/** Curvas e tempos compartilhados entre abertura e hero. */
export const ease = {
  /** saída longa e macia, o padrão da marca */
  pouso: [0.22, 1, 0.36, 1] as const,
  /** viagem do símbolo até o hero */
  viagem: [0.65, 0, 0.35, 1] as const,
  /** queda com gravidade */
  queda: [0.5, 0, 0.9, 0.55] as const,
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function canHover() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function isCompact() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

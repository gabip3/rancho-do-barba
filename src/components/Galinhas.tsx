import { useRef, type CSSProperties } from 'react'
import { useInView } from 'framer-motion'

/*
 * Galinhas do Rancho: traço de nanquim marrom + mancha de cor levemente fora de registro,
 * como impressão artesanal. A "barbicha" embaixo do bico é a ponte com o ovo de barba.
 * Cores iguais aos tokens de index.css (barba, casca, caramelo).
 */
const TINTA = '#391807'
const CASCA = '#EBA66A'
const CARAMELO = '#B8692F'

const traco = {
  fill: 'none',
  stroke: TINTA,
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

type CabecaProps = { cx: number; cy: number; r: number }

/** Cabeça: crista, bico, olho e barbicha. Desenhada virada para a direita. */
function Cabeca({ cx, cy, r }: CabecaProps) {
  const x = (dx: number) => cx + dx
  const y = (dy: number) => cy + dy
  return (
    <g className="galinha-cabeca">
      <path
        {...traco}
        fill={CARAMELO}
        d={`M${x(-10)} ${y(-9)} C${x(-12)} ${y(-17)} ${x(-5)} ${y(-20)} ${x(-3)} ${y(-14)}
            C${x(-3)} ${y(-22)} ${x(5)} ${y(-23)} ${x(5)} ${y(-15)}
            C${x(8)} ${y(-21)} ${x(15)} ${y(-19)} ${x(12)} ${y(-11)} Z`}
      />
      <circle {...traco} cx={cx} cy={cy} r={r} />
      <path {...traco} fill={CARAMELO} d={`M${x(12)} ${y(-3)} L${x(23)} ${y(1)} L${x(12)} ${y(5)} Z`} />
      <circle cx={x(5)} cy={y(-3)} r={1.9} fill={TINTA} />
      {/* barbicha: pendurada sob o bico, com duas pontinhas de pelo como a barba do logo */}
      <path
        fill={TINTA}
        d={`M${x(3)} ${y(9)} C${x(3)} ${y(18)} ${x(7)} ${y(25)} ${x(11)} ${y(27)}
            L${x(12.5)} ${y(24.5)} L${x(14.5)} ${y(28)}
            C${x(18)} ${y(24)} ${x(21)} ${y(16)} ${x(19)} ${y(6)}
            C${x(14)} ${y(9)} ${x(8)} ${y(10)} ${x(3)} ${y(9)} Z`}
      />
    </g>
  )
}

// ── Em pé ────────────────────────────────────────────────────────────
const EM_PE_CABECA = { cx: 136, cy: 41, r: 13 }
const EM_PE_CORPO =
  'M127.6 51 C112 76 88 84 68 78 C56 72 46 60 40 44 C30 68 34 104 58 122 C80 138 126 138 146 116 C158 102 156 72 144.4 51'

export function GalinhaEmPeSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 170" className={className} aria-hidden>
      <g fill={CASCA} opacity={0.72} transform="translate(5 4)">
        <path d={`${EM_PE_CORPO} Z`} />
        <circle cx={EM_PE_CABECA.cx} cy={EM_PE_CABECA.cy} r={EM_PE_CABECA.r} />
      </g>
      <path {...traco} d={EM_PE_CORPO} />
      <path {...traco} d="M50 60 C50 78 56 92 66 100 M43 76 C46 92 52 104 62 112" />
      <path {...traco} d="M84 103 C100 92 122 95 134 108 C120 118 99 119 84 103 Z" />
      {/* pernas separadas para o joguinho fazer a galinha correr */}
      <path {...traco} className="galinha-perna-a" d="M104 134 L102 156 M94 157 L102 156 L110 158" />
      <path {...traco} className="galinha-perna-b" d="M122 132 L124 156 M115 157 L124 156 L132 158" />
      <Cabeca {...EM_PE_CABECA} />
    </svg>
  )
}

// ── Chocando ─────────────────────────────────────────────────────────
const CHOCA_CABECA = { cx: 140, cy: 42, r: 12 }
const CHOCA_COSTAS = 'M48 128 C28 116 24 80 42 44 C58 44 64 64 88 69 C102 62 116 56 132.3 51.2'
const CHOCA_PEITO = 'M147.7 51.2 C162 64 172 92 170 128'

export function GalinhaChocandoSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 160" className={className} aria-hidden>
      <g fill={CASCA} opacity={0.72} transform="translate(5 4)">
        <path d={`${CHOCA_COSTAS} L147.7 51.2 C162 64 172 92 170 128 Z`} />
        <circle cx={CHOCA_CABECA.cx} cy={CHOCA_CABECA.cy} r={CHOCA_CABECA.r} />
      </g>
      <path {...traco} d={CHOCA_COSTAS} />
      <path {...traco} d={CHOCA_PEITO} />
      <path {...traco} d="M42 64 C48 74 57 80 69 82" />
      <path {...traco} d="M78 100 C96 88 124 90 142 104 M82 112 C100 104 122 104 138 112" />
      {/* os ovos coloridos, como os da bandeja */}
      <ellipse {...traco} fill="#CFCB9A" cx={86} cy={127} rx={10} ry={12} />
      <ellipse {...traco} fill="#F1C3A2" cx={109} cy={130} rx={10} ry={12} />
      <ellipse {...traco} fill="#DDE7E2" cx={132} cy={127} rx={10} ry={12} />
      {/* ninho: as mesmas hachuras da sombra do ovo */}
      <path
        {...traco}
        strokeWidth={1.8}
        strokeOpacity={0.55}
        d="M30 136 C70 131 150 131 192 136 M40 142 C80 138 140 138 182 143 M58 148 C92 145 128 145 162 148"
      />
      <Cabeca {...CHOCA_CABECA} />
    </svg>
  )
}

/** Galinha com espiada: vira a cabeça uma vez ao aparecer na tela e de novo no hover. */
export function Galinha({
  pose,
  className = '',
}: {
  pose: 'em-pe' | 'chocando'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const visto = useInView(ref, { once: true, amount: 0.6 })
  const pescoco = pose === 'em-pe' ? '140px 52px' : '144px 53px'
  const Desenho = pose === 'em-pe' ? GalinhaEmPeSvg : GalinhaChocandoSvg

  return (
    <div
      ref={ref}
      className={`galinha ${visto ? 'espiou' : ''} ${className}`}
      style={{ '--pescoco': pescoco } as CSSProperties}
    >
      <Desenho className="h-auto w-full overflow-visible" />
    </div>
  )
}

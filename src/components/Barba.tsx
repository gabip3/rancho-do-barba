import { useId } from 'react'

/*
 * O Barba: o dono do rancho em versão desenhada, no mesmo traço das galinhas.
 * A cabeça careca tem o formato e a cor do ovo do logo, com a barba por baixo.
 * Pernas e braços ficam em grupos separados para o joguinho animar a caminhada.
 */
const TINTA = '#391807'
const PELE = '#E9A56B'
const BARBA = '#3A1A0B'
const AVENTAL = '#3B2418'
const CALCA = '#4A3326'

const traco = {
  stroke: TINTA,
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Perna ou braço: um tubo com contorno (traço grosso de tinta + traço mais fino de cor por cima). */
function Tubo({ d, cor, largura }: { d: string; cor: string; largura: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={TINTA} strokeWidth={largura + 4.4} strokeLinecap="round" />
      <path d={d} fill="none" stroke={cor} strokeWidth={largura} strokeLinecap="round" />
    </>
  )
}

export function BarbaSvg({ className = '' }: { className?: string }) {
  const xadrez = `xadrez-${useId().replace(/:/g, '')}`
  const camisa = `url(#${xadrez})`

  return (
    <svg viewBox="0 0 120 196" className={className} aria-hidden>
      <defs>
        <pattern id={xadrez} width="9" height="9" patternUnits="userSpaceOnUse">
          <rect width="9" height="9" fill="#C9B38C" />
          <rect width="9" height="3.2" fill="#6E5A43" opacity="0.55" />
          <rect width="3.2" height="9" fill="#6E5A43" opacity="0.55" />
          <rect x="6" width="0.9" height="9" fill="#5F6B2C" opacity="0.8" />
          <rect y="6" width="9" height="0.9" fill="#5F6B2C" opacity="0.8" />
        </pattern>
      </defs>

      <g className="barba-perna-a">
        <Tubo d="M50 148 L48 180" cor={CALCA} largura={9} />
        <ellipse cx="45.5" cy="184" rx="8.5" ry="4.4" fill={TINTA} />
      </g>
      <g className="barba-perna-b">
        <Tubo d="M70 148 L72 180" cor={CALCA} largura={9} />
        <ellipse cx="74.5" cy="184" rx="8.5" ry="4.4" fill={TINTA} />
      </g>

      <g className="barba-corpo">
        <g className="barba-braco-a">
          <Tubo d="M36 100 C30 112 27 124 26 135" cor={camisa} largura={9.5} />
          <circle cx="26" cy="140" r="5.8" fill={PELE} {...traco} />
        </g>
        <g className="barba-braco-b">
          <Tubo d="M84 100 C90 112 93 124 94 135" cor={camisa} largura={9.5} />
          <circle cx="94" cy="140" r="5.8" fill={PELE} {...traco} />
        </g>

        {/* camisa xadrez e avental escuro, como na foto */}
        <path
          d="M34 98 C40 91 50 88 60 88 C70 88 80 91 86 98 L89 142 C89 148 85 152 79 152 L41 152 C35 152 31 148 31 142 Z"
          fill={camisa}
          {...traco}
        />
        <path d="M44 99 C50 97 70 97 76 99 L79 158 C72 161 48 161 41 158 Z" fill={AVENTAL} {...traco} />
        <path d="M44 99 L49 90 M76 99 L71 90" fill="none" {...traco} />
        <path d="M51 139 L69 139" stroke="#6B4A36" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="60" cy="122" rx="5" ry="6.4" fill="#EBA66A" />

        {/* cabeça: o ovo */}
        <g className="barba-cabeca">
          <path d="M34 44 C25 42 23 58 34 60 Z M86 44 C95 42 97 58 86 60 Z" fill={PELE} {...traco} />
          <path d="M60 8 C76 8 88 30 88 50 C88 66 76 78 60 78 C44 78 32 66 32 50 C32 30 44 8 60 8 Z" fill={PELE} {...traco} />
          <path d="M42 31 C43 23 48 17 54 15" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M45 37 C48 35 52 35 55 37 M65 37 C68 35 72 35 75 37" fill="none" {...traco} strokeWidth={2.4} />
          <circle cx="50" cy="44" r="2.5" fill={TINTA} />
          <circle cx="70" cy="44" r="2.5" fill={TINTA} />
          <path d="M58 49 C56 54 58 57 62 56" fill="none" {...traco} strokeWidth={2} />
          {/* barba cheia com bigode, com as pontinhas de pelo embaixo */}
          <path
            d="M32 46 C31 62 36 80 46 90 L49 87 L51 93 L54 89 L57 95 L60 90 L63 95 L66 89 L69 93 L71 87 L74 90
               C84 80 89 62 88 46 C85 54 80 60 74 62 C70 57 64 56 60 59 C56 56 50 57 46 62 C40 60 35 54 32 46 Z"
            fill={BARBA}
            {...traco}
            strokeWidth={1.6}
          />
          <path d="M51 69 C55 76 65 76 69 69 C63 71 57 71 51 69 Z" fill={PELE} />
        </g>
      </g>
    </svg>
  )
}

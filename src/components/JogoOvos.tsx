import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarbaSvg } from './Barba'
import { GalinhaEmPeSvg } from './Galinhas'
import { whatsappLink } from '../lib/contato'
import { canHover, ease } from '../lib/motion'

/*
 * Corre, Barba! O Barba corre atrás dos ovos; a galinha foge dele e, no susto, bota mais.
 * Posições vivem num objeto mutável (mundo) e são desenhadas direto no DOM a cada quadro;
 * o React só re-renderiza quando algo muda de verdade (ovo novo, ovo pego, placar, tempo).
 */
const DURACAO = 30
const VIDA_OVO = 4.2
const MAX_OVOS = 9
const CORES = ['#CFCB9A', '#DDE7E2', '#F1C3A2', '#C98B5E', '#B7C4A0', '#EFE6D6']
const DOURADO = '#E6B23A'
const CHAVE_RECORDE = 'rancho-do-barba:recorde-jogo'

type Fase = 'inicio' | 'jogando' | 'fim'
type Ovo = { id: number; x: number; cor: string; dourado: boolean; nasceu: number }
type Pop = { id: number; x: number; texto: string; dourado: boolean }

type Mundo = {
  W: number
  u: number
  t: number
  pontos: number
  id: number
  ovos: Ovo[]
  barba: { x: number; alvo: number | null; teclas: -1 | 0 | 1; dir: -1 | 1; andando: boolean }
  galinha: {
    x: number
    y: number
    dir: -1 | 1
    modo: 'passeio' | 'fuga' | 'arrancada'
    parada: boolean
    ate: number
    pulo: number
    proximoOvo: number
    proximaDecisao: number
    vel: number
  }
}

/** Escala dos personagens conforme a largura do campo. */
const escala = (W: number) => Math.min(1.25, Math.max(0.9, W / 420))

const medidas = (u: number) => {
  const barbaH = 118 * u
  const galH = 58 * u
  const ovoW = 21 * u
  return {
    barbaH,
    barbaW: (barbaH * 120) / 196,
    galH,
    galW: (galH * 200) / 170,
    ovoW,
    ovoH: ovoW * 1.25,
    chao: 24 * u,
  }
}

function criarMundo(W: number): Mundo {
  return {
    W,
    u: escala(W),
    t: 0,
    pontos: 0,
    id: 0,
    ovos: [],
    barba: { x: W * 0.28, alvo: null, teclas: 0, dir: 1, andando: false },
    galinha: {
      x: W * 0.72,
      y: 0,
      dir: -1,
      modo: 'passeio',
      parada: false,
      ate: 0,
      pulo: -9,
      proximoOvo: 0.8,
      proximaDecisao: 1.2,
      vel: 0,
    },
  }
}

function lerRecorde() {
  try {
    return Number(localStorage.getItem(CHAVE_RECORDE)) || 0
  } catch {
    return 0
  }
}

function salvarRecorde(n: number) {
  try {
    localStorage.setItem(CHAVE_RECORDE, String(n))
  } catch {
    // sem armazenamento: o recorde vale só para esta visita
  }
}

export default function JogoOvos() {
  const campoRef = useRef<HTMLDivElement>(null)
  const barbaEl = useRef<HTMLDivElement>(null)
  const galinhaEl = useRef<HTMLDivElement>(null)
  const galinhaVira = useRef<HTMLDivElement>(null)
  const mundo = useRef<Mundo>(criarMundo(360))

  const [fase, setFase] = useState<Fase>('inicio')
  const [W, setW] = useState(360)
  const [pontos, setPontos] = useState(0)
  const [tempo, setTempo] = useState(DURACAO)
  const [ovos, setOvos] = useState<Ovo[]>([])
  const [pops, setPops] = useState<Pop[]>([])
  const [recorde, setRecorde] = useState(0)
  const [novoRecorde, setNovoRecorde] = useState(false)
  const [temMouse, setTemMouse] = useState(false)

  useEffect(() => {
    setRecorde(lerRecorde())
    setTemMouse(canHover())
  }, [])

  const u = escala(W)
  const md = medidas(u)

  /** Posiciona os personagens direto no DOM, sem re-render a cada quadro. */
  const desenhar = () => {
    const mu = mundo.current
    const m = medidas(mu.u)
    const b = barbaEl.current
    const g = galinhaEl.current
    const gv = galinhaVira.current
    if (b) {
      const inclina = mu.barba.andando ? mu.barba.dir * 3 : 0
      b.style.transform = `translateX(${mu.barba.x - m.barbaW / 2}px) rotate(${inclina}deg)`
      b.classList.toggle('andando', mu.barba.andando)
    }
    if (g && gv) {
      const gl = mu.galinha
      g.style.transform = `translate(${gl.x - m.galW / 2}px, ${-gl.y}px)`
      gv.style.transform = `scaleX(${gl.dir})`
      g.classList.toggle('correndo', gl.vel > 0)
      g.style.setProperty('--passo', gl.modo === 'passeio' ? '0.3s' : '0.15s')
    }
  }

  // Acompanha a largura do campo (e reescala o mundo se a tela mudar no meio do jogo).
  useLayoutEffect(() => {
    const el = campoRef.current
    if (!el) return
    const ro = new ResizeObserver(([entrada]) => {
      const novo = entrada.contentRect.width
      const mu = mundo.current
      if (!novo || novo === mu.W) return
      const k = novo / mu.W
      mu.barba.x *= k
      if (mu.barba.alvo !== null) mu.barba.alvo *= k
      mu.galinha.x *= k
      mu.ovos.forEach((o) => (o.x *= k))
      mu.W = novo
      mu.u = escala(novo)
      setW(novo)
      setOvos([...mu.ovos])
      desenhar()
    })
    ro.observe(el)
    return () => ro.disconnect()
    // desenhar só lê refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    desenhar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, W])

  // ── Laço do jogo ──────────────────────────────────────────────────
  useEffect(() => {
    if (fase !== 'jogando') return
    const mu = mundo.current
    let raf = 0
    let ultimo = performance.now()
    let hud = 0

    const botarOvo = (x: number) => {
      const m = medidas(mu.u)
      mu.ovos.push({
        id: mu.id++,
        x: Math.min(mu.W - m.ovoW, Math.max(m.ovoW, x)),
        cor: CORES[Math.floor(Math.random() * CORES.length)],
        dourado: Math.random() < 0.1,
        nasceu: mu.t,
      })
      setOvos([...mu.ovos])
    }

    const quadro = (agora: number) => {
      // dt limitado: se a aba ficar escondida, o jogo simplesmente pausa
      const dt = Math.min(0.05, (agora - ultimo) / 1000)
      ultimo = agora
      mu.t += dt
      const m = medidas(mu.u)

      // Barba: vai até onde o dedo/mouse está, ou segue as setas
      const b = mu.barba
      let dir = 0
      if (b.teclas !== 0) {
        dir = b.teclas
        b.alvo = null
      } else if (b.alvo !== null && Math.abs(b.alvo - b.x) > 3) {
        dir = Math.sign(b.alvo - b.x)
      }
      if (dir !== 0) {
        let passo = dir * mu.W * 0.6 * dt
        if (b.alvo !== null && Math.abs(b.alvo - b.x) < Math.abs(passo)) passo = b.alvo - b.x
        b.x = Math.min(mu.W - m.barbaW / 2, Math.max(m.barbaW / 2, b.x + passo))
        b.dir = dir > 0 ? 1 : -1
      }
      b.andando = dir !== 0

      // Galinha: passeia, foge quando ele chega perto e, encurralada, pula por cima dele
      const g = mu.galinha
      const dist = g.x - b.x
      const margem = m.galW * 0.55
      const presaNaBorda = (d: -1 | 1) => (d === 1 && g.x >= mu.W - margem - 2) || (d === -1 && g.x <= margem + 2)
      const arrancar = (d: -1 | 1, duracao: number) => {
        g.modo = 'arrancada'
        g.dir = d
        g.ate = mu.t + duracao
        g.pulo = mu.t
      }
      if (g.modo === 'arrancada') {
        if (mu.t > g.ate) {
          g.modo = 'passeio'
          g.proximaDecisao = mu.t + 0.5
        }
      } else if (Math.abs(dist) < m.barbaW * 0.55) {
        const longe: -1 | 1 = dist >= 0 ? 1 : -1
        arrancar(presaNaBorda(longe) ? (-longe as -1 | 1) : longe, 0.8)
        g.proximoOvo = Math.min(g.proximoOvo, mu.t + 0.1)
      } else if (Math.abs(dist) < mu.W * 0.26) {
        if (g.modo !== 'fuga') g.proximoOvo = Math.min(g.proximoOvo, mu.t + 0.2)
        g.modo = 'fuga'
        g.dir = dist >= 0 ? 1 : -1
        if (presaNaBorda(g.dir)) arrancar(-g.dir as -1 | 1, 0.9)
      } else if (g.modo === 'fuga') {
        g.modo = 'passeio'
        g.proximaDecisao = mu.t + 0.6
      }
      if (g.modo === 'passeio' && mu.t > g.proximaDecisao) {
        g.parada = Math.random() < 0.3
        if (!g.parada) g.dir = Math.random() < 0.5 ? 1 : -1
        g.proximaDecisao = mu.t + 0.9 + Math.random() * 1.5
      }
      g.vel = g.modo === 'arrancada' ? mu.W * 0.75 : g.modo === 'fuga' ? mu.W * 0.42 : g.parada ? 0 : mu.W * 0.13
      g.x += g.dir * g.vel * dt
      if (g.x < margem) {
        g.x = margem
        if (g.modo === 'passeio') g.dir = 1
      }
      if (g.x > mu.W - margem) {
        g.x = mu.W - margem
        if (g.modo === 'passeio') g.dir = -1
      }
      const tp = mu.t - g.pulo
      g.y = tp >= 0 && tp < 0.55 ? Math.sin((tp / 0.55) * Math.PI) * m.barbaH * 0.95 : 0

      // Ovos: mais rápido quando ela está assustada
      if (mu.t > g.proximoOvo) {
        if (mu.ovos.length < MAX_OVOS && g.y === 0) botarOvo(g.x - g.dir * m.galW * 0.3)
        g.proximoOvo = mu.t + (g.modo === 'passeio' ? 1.2 + Math.random() : 0.45 + Math.random() * 0.4)
      }

      // Pegar ovos (depois que eles pousam)
      const alcance = m.barbaW * 0.42
      const pegos = mu.ovos.filter((o) => mu.t - o.nasceu > 0.25 && Math.abs(o.x - b.x) < alcance)
      if (pegos.length) {
        mu.ovos = mu.ovos.filter((o) => !pegos.includes(o))
        for (const o of pegos) {
          mu.pontos += o.dourado ? 3 : 1
          const pop: Pop = { id: o.id, x: o.x, texto: o.dourado ? '+3' : '+1', dourado: o.dourado }
          setPops((l) => [...l, pop])
          window.setTimeout(() => setPops((l) => l.filter((p) => p.id !== pop.id)), 800)
        }
        navigator.vibrate?.(10)
        setPontos(mu.pontos)
        setOvos([...mu.ovos])
      }
      const antes = mu.ovos.length
      mu.ovos = mu.ovos.filter((o) => mu.t - o.nasceu < VIDA_OVO)
      if (mu.ovos.length !== antes) setOvos([...mu.ovos])

      desenhar()
      if (agora - hud > 200) {
        hud = agora
        setTempo(Math.max(0, Math.ceil(DURACAO - mu.t)))
      }

      if (mu.t >= DURACAO) {
        b.andando = false
        g.vel = 0
        g.y = 0
        desenhar()
        setTempo(0)
        if (mu.pontos > lerRecorde()) {
          salvarRecorde(mu.pontos)
          setRecorde(mu.pontos)
          setNovoRecorde(true)
        }
        setFase('fim')
        return
      }
      raf = requestAnimationFrame(quadro)
    }
    raf = requestAnimationFrame(quadro)

    const tecla = (e: KeyboardEvent, apertou: boolean) => {
      const k = e.key.toLowerCase()
      const d = k === 'arrowleft' || k === 'a' ? -1 : k === 'arrowright' || k === 'd' ? 1 : 0
      if (!d) return
      e.preventDefault()
      if (apertou) mu.barba.teclas = d
      else if (mu.barba.teclas === d) mu.barba.teclas = 0
    }
    const desce = (e: KeyboardEvent) => tecla(e, true)
    const sobe = (e: KeyboardEvent) => tecla(e, false)
    window.addEventListener('keydown', desce)
    window.addEventListener('keyup', sobe)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', desce)
      window.removeEventListener('keyup', sobe)
    }
  }, [fase])

  const iniciar = () => {
    mundo.current = criarMundo(mundo.current.W)
    setPontos(0)
    setTempo(DURACAO)
    setOvos([])
    setPops([])
    setNovoRecorde(false)
    setFase('jogando')
  }

  const mirar = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mundo.current.barba.alvo = e.clientX - r.left
  }

  return (
    <section
      id="jogo"
      aria-labelledby="jogo-titulo"
      className="mx-auto w-full max-w-[1360px] scroll-mt-6 px-6 pb-28 md:px-10 lg:px-14 lg:pb-36"
    >
      <header className="max-w-[42rem]">
        <p className="rotulo text-caramelo text-[0.8rem] md:text-[0.88rem]">Joguinho</p>
        <h2
          id="jogo-titulo"
          className="display text-tinta mt-4 text-[clamp(2.1rem,8.4vw,3.3rem)] leading-[1.02] font-[500] lg:text-[clamp(3rem,4.2vw,4.4rem)]"
        >
          Corre, Barba!
          <br />
          <span className="display-italic text-caramelo font-[400]">A galinha foge, os ovos ficam.</span>
        </h2>
        <p className="text-terra mt-6 max-w-[31rem] text-[1.06rem] leading-[1.6] md:text-[1.15rem]">
          Ajude o Barba a pegar os ovos que a galinha deixa pelo caminho. São 30 segundos, e o ovo dourado vale 3.
        </p>
      </header>

      <div
        ref={campoRef}
        aria-label="Campo do joguinho: mova o Barba para pegar os ovos"
        className={`foto-recorte bg-palha/60 relative mt-10 h-[330px] overflow-hidden select-none [-webkit-touch-callout:none] md:mt-14 md:h-[380px] ${
          fase === 'jogando' ? 'cursor-pointer touch-none' : ''
        }`}
        style={{ '--chao': `${md.chao}px` } as CSSProperties}
        onPointerDown={(e) => {
          if (fase !== 'jogando') return
          e.currentTarget.setPointerCapture?.(e.pointerId)
          mirar(e)
        }}
        onPointerMove={(e) => {
          if (fase === 'jogando' && (e.pointerType === 'mouse' || e.buttons > 0)) mirar(e)
        }}
      >
        {/* chão de lápis, como a sombra do ovo */}
        <svg
          aria-hidden
          viewBox="0 0 400 34"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 w-full"
          style={{ height: md.chao + 10 }}
        >
          <path
            d="M0 10 C80 7 160 12 240 9 C300 7 360 10 400 9 M10 18 C90 15 180 20 260 17 C320 15 370 18 396 17 M30 26 C120 23 200 28 280 25 C330 23 370 26 390 25"
            fill="none"
            stroke="#391807"
            strokeOpacity="0.22"
            strokeWidth="1.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <AnimatePresence>
          {ovos.map((o) => (
            <OvoNoChao key={o.id} ovo={o} largura={md.ovoW} u={u} />
          ))}
        </AnimatePresence>

        <div
          ref={galinhaEl}
          className="absolute left-0 will-change-transform"
          style={{ bottom: md.chao - 2, width: md.galW, height: md.galH }}
        >
          <div ref={galinhaVira} className="h-full w-full">
            <div className="galinha-corpo h-full w-full">
              <GalinhaEmPeSvg className="h-full w-full overflow-visible" />
            </div>
          </div>
        </div>

        <div
          ref={barbaEl}
          className="absolute left-0 origin-bottom will-change-transform"
          style={{ bottom: md.chao - 4, width: md.barbaW, height: md.barbaH }}
        >
          <BarbaSvg className="h-full w-full overflow-visible" />
        </div>

        <AnimatePresence>
          {pops.map((p) => (
            <motion.span
              key={p.id}
              aria-hidden
              className="display pointer-events-none absolute font-[600]"
              style={{
                left: p.x,
                // nasce acima da cabeça do Barba (é ele quem acabou de pegar o ovo)
                bottom: md.chao + md.barbaH + 2,
                color: p.dourado ? '#A8781A' : 'var(--color-caramelo)',
                fontSize: 20 * u,
              }}
              initial={{ opacity: 0, y: 0, x: '-50%' }}
              animate={{ opacity: [0, 1, 1, 0], y: -36 * u }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {p.texto}
            </motion.span>
          ))}
        </AnimatePresence>

        {fase === 'jogando' && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 md:p-5">
            <p className="flex items-center gap-2" aria-label={`${pontos} ovos`}>
              <svg aria-hidden viewBox="0 0 40 50" className="h-6 w-auto md:h-7">
                <path
                  d="M20 2C30 2 37 18 37 30C37 41 29 48 20 48C11 48 3 41 3 30C3 18 10 2 20 2Z"
                  fill="#EBA66A"
                  stroke="#391807"
                  strokeWidth="2.6"
                />
              </svg>
              <span className="display text-tinta text-[1.6rem] leading-none font-[600] tabular-nums md:text-[1.9rem]">
                {pontos}
              </span>
            </p>
            <p className="rotulo text-terra text-[0.82rem] tabular-nums md:text-[0.9rem]">
              0:{String(tempo).padStart(2, '0')}
            </p>
          </div>
        )}

        <AnimatePresence>
          {fase === 'inicio' && (
            <Cartao key="inicio">
              <p className="text-terra text-[1.02rem] leading-[1.5] md:text-[1.1rem]">
                {temMouse ? 'Use as setas do teclado ou o mouse.' : 'Segure o dedo no campo onde o Barba deve ir.'}
              </p>
              <button
                type="button"
                onClick={iniciar}
                className="cta-artesanal mt-5 px-8 py-3 text-[1.02rem] font-[500] tracking-[0.01em]"
              >
                Jogar
              </button>
            </Cartao>
          )}
          {fase === 'fim' && (
            <Cartao key="fim" aoVivo>
              <p className="display text-tinta text-[1.7rem] leading-tight font-[500] md:text-[2.1rem]">
                Você pegou {pontos} {pontos === 1 ? 'ovo' : 'ovos'}!
              </p>
              <p className="rotulo text-caramelo mt-2 text-[0.8rem]">
                {novoRecorde ? 'Novo recorde!' : `Seu recorde: ${recorde}`}
              </p>
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
                <button
                  type="button"
                  onClick={iniciar}
                  className="cta-artesanal px-7 py-3 text-[1rem] font-[500] tracking-[0.01em]"
                >
                  Jogar de novo
                </button>
                <a
                  href={whatsappLink(
                    `Oi, Rancho do Barba! Peguei ${pontos} ${pontos === 1 ? 'ovo' : 'ovos'} no joguinho e agora quero ovos de verdade.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terra hover:text-tinta decoration-casca text-[0.98rem] font-[500] underline underline-offset-4 transition-colors"
                >
                  Quero ovos de verdade
                </a>
              </div>
            </Cartao>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

function Cartao({ children, aoVivo = false }: { children: ReactNode; aoVivo?: boolean }) {
  return (
    <motion.div
      role={aoVivo ? 'status' : undefined}
      aria-live={aoVivo ? 'polite' : undefined}
      className="foto-recorte bg-papel/95 absolute inset-x-4 top-4 mx-auto max-w-[26rem] p-6 text-center shadow-[0_10px_30px_-18px_rgba(45,19,6,0.5)] md:top-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, ease: ease.pouso }}
    >
      {children}
    </motion.div>
  )
}

/** Ovo que cai, quica, fica no chão e pisca antes de sumir. */
function OvoNoChao({ ovo, largura, u }: { ovo: Ovo; largura: number; u: number }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute"
      style={{ left: ovo.x - largura / 2, bottom: 'calc(var(--chao) - 2px)', width: largura }}
      initial={{ y: -30 * u, scale: 0.5, opacity: 0 }}
      animate={{ y: [-30 * u, 0, -7 * u, 0], scale: 1, opacity: 1 }}
      exit={{ opacity: 0, scale: 1.35, y: -8 * u, transition: { duration: 0.22 } }}
      transition={{
        y: { duration: 0.5, times: [0, 0.55, 0.78, 1] },
        scale: { duration: 0.25 },
        opacity: { duration: 0.15 },
      }}
    >
      <div className="ovo-somendo" style={{ animationDelay: `${VIDA_OVO - 1.3}s` }}>
        <svg viewBox="0 0 40 50" className="block h-auto w-full overflow-visible">
          <path
            d="M20 2C30 2 37 18 37 30C37 41 29 48 20 48C11 48 3 41 3 30C3 18 10 2 20 2Z"
            fill={ovo.dourado ? DOURADO : ovo.cor}
            stroke="#391807"
            strokeWidth="2.6"
          />
          <ellipse cx="13" cy="19" rx="3" ry="5.5" fill="#fff" opacity="0.6" transform="rotate(-18 13 19)" />
          {ovo.dourado && (
            <path
              d="M33 2 L35 7 L40 9 L35 11 L33 16 L31 11 L26 9 L31 7 Z"
              fill="#fff"
              stroke="#391807"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </motion.div>
  )
}

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarbaSvg } from './Barba'
import { GalinhaEmPeSvg } from './Galinhas'
import { whatsappLink } from '../lib/contato'
import { canHover, ease } from '../lib/motion'

/*
 * Corre, Barba! O Barba corre (e pula) atrás dos ovos; a galinha foge dele e, no susto, bota mais.
 *   ovo no chão = 1 · ovo pego no ar (a galinha solta quando pula) = 2 · ovo dourado flutuando = 3
 * Posições vivem num objeto mutável (mundo) e são desenhadas direto no DOM a cada quadro;
 * o React só re-renderiza quando algo muda de verdade (ovo novo, ovo pego, placar, tempo).
 */
const DURACAO = 30
const VIDA_OVO = 4.2
const VIDA_DOURADO = 5.5
const MAX_OVOS = 10
const CORES = ['#CFCB9A', '#DDE7E2', '#F1C3A2', '#C98B5E', '#B7C4A0', '#EFE6D6']
const DOURADO = '#E6B23A'
const CHAVE_RECORDE = 'rancho-do-barba:recorde-jogo'

type Fase = 'inicio' | 'jogando' | 'fim'
type TipoOvo = 'chao' | 'voando' | 'flutuando'
type Ovo = { id: number; x: number; alt: number; vy: number; tipo: TipoOvo; cor: string; nasceu: number }
type Pop = { id: number; x: number; alt: number; texto: string; dourado: boolean }
/** Um dedo na tela: toque rápido = pulo; segurar ou arrastar = andar. */
type Toque = { x: number; x0: number; y0: number; t0: number; arrastando: boolean }

const PONTOS: Record<TipoOvo, number> = { chao: 1, voando: 2, flutuando: 3 }

type Mundo = {
  W: number
  u: number
  t: number
  pontos: number
  id: number
  ovos: Ovo[]
  proximoDourado: number
  barba: {
    x: number
    y: number
    vy: number
    alvo: number | null
    teclas: -1 | 0 | 1
    dir: -1 | 1
    andando: boolean
    pedidoPulo: number
    pouso: number
  }
  galinha: {
    x: number
    y: number
    dir: -1 | 1
    modo: 'passeio' | 'fuga' | 'arrancada'
    parada: boolean
    ate: number
    pulo: number
    alturaPulo: number
    botouNoPulo: boolean
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
    proximoDourado: 3.5,
    barba: { x: W * 0.28, y: 0, vy: 0, alvo: null, teclas: 0, dir: 1, andando: false, pedidoPulo: -9, pouso: -9 },
    galinha: {
      x: W * 0.72,
      y: 0,
      dir: -1,
      modo: 'passeio',
      parada: false,
      ate: 0,
      pulo: -9,
      alturaPulo: 0,
      botouNoPulo: true,
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
  const toques = useRef(new Map<number, Toque>())

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

  /** Posiciona personagens e ovos direto no DOM, sem re-render a cada quadro. */
  const desenhar = () => {
    const mu = mundo.current
    const m = medidas(mu.u)
    const b = barbaEl.current
    const g = galinhaEl.current
    const gv = galinhaVira.current
    if (b) {
      const br = mu.barba
      const inclina = br.andando ? br.dir * 3 : 0
      const tl = mu.t - br.pouso
      const amassa = tl >= 0 && tl < 0.14 ? Math.sin((tl / 0.14) * Math.PI) * 0.08 : 0
      b.style.transform = `translate(${br.x - m.barbaW / 2}px, ${-br.y}px) rotate(${inclina}deg) scale(${1 + amassa / 2}, ${1 - amassa})`
      b.classList.toggle('pulando', br.y > 0)
      b.classList.toggle('andando', br.andando && br.y === 0)
    }
    if (g && gv) {
      const gl = mu.galinha
      g.style.transform = `translate(${gl.x - m.galW / 2}px, ${-gl.y}px)`
      gv.style.transform = `scaleX(${gl.dir})`
      g.classList.toggle('correndo', gl.vel > 0)
      g.style.setProperty('--passo', gl.modo === 'passeio' ? '0.3s' : '0.15s')
    }
    const campo = campoRef.current
    if (campo) {
      for (const o of mu.ovos) {
        const el = campo.querySelector<HTMLElement>(`[data-ovo="${o.id}"]`)
        if (el) el.style.transform = `translateY(${-o.alt}px)`
      }
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
      const ku = escala(novo) / mu.u
      mu.barba.x *= k
      if (mu.barba.alvo !== null) mu.barba.alvo *= k
      mu.barba.y *= ku
      mu.barba.vy *= ku
      mu.galinha.x *= k
      mu.ovos.forEach((o) => {
        o.x *= k
        o.alt *= ku
        o.vy *= ku
      })
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
  }, [fase, W, ovos])

  // ── Laço do jogo ──────────────────────────────────────────────────
  useEffect(() => {
    if (fase !== 'jogando') return
    const mu = mundo.current
    let raf = 0
    let ultimo = performance.now()
    let hud = 0

    const novoOvo = (tipo: TipoOvo, x: number, alt: number, vy: number) => {
      const m = medidas(mu.u)
      mu.ovos.push({
        id: mu.id++,
        x: Math.min(mu.W - m.ovoW, Math.max(m.ovoW, x)),
        alt,
        vy,
        tipo,
        cor: CORES[Math.floor(Math.random() * CORES.length)],
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
      const b = mu.barba

      // Dedo parado por um instante também anda (sem precisar arrastar)
      for (const tq of toques.current.values()) {
        if (!tq.arrastando && agora - tq.t0 > 160) {
          tq.arrastando = true
          b.alvo = tq.x
        }
      }

      // Barba, na horizontal: vai até onde o dedo/mouse está, ou segue as setas
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

      // Barba, na vertical: pulo com gravidade (pedido guardado por um instante, para não "perder" o toque)
      const gravidade = 17.7 * m.barbaH
      if (mu.t - b.pedidoPulo < 0.12 && b.y === 0 && b.vy === 0) {
        b.vy = 5.5 * m.barbaH
        b.pedidoPulo = -9
      }
      if (b.y > 0 || b.vy > 0) {
        b.vy -= gravidade * dt
        b.y += b.vy * dt
        if (b.y <= 0) {
          b.y = 0
          b.vy = 0
          b.pouso = mu.t
        }
      }

      // Galinha: passeia, foge quando ele chega perto, pula de susto e, encurralada, pula por cima dele
      const g = mu.galinha
      const dist = g.x - b.x
      const margem = m.galW * 0.55
      const tp = mu.t - g.pulo
      const presaNaBorda = (d: -1 | 1) => (d === 1 && g.x >= mu.W - margem - 2) || (d === -1 && g.x <= margem + 2)
      const pular = (altura: number) => {
        g.pulo = mu.t
        g.alturaPulo = altura
        g.botouNoPulo = false
      }
      const arrancar = (d: -1 | 1, duracao: number) => {
        g.modo = 'arrancada'
        g.dir = d
        g.ate = mu.t + duracao
        pular(m.barbaH * 0.95)
      }
      if (g.modo === 'arrancada') {
        if (mu.t > g.ate) {
          g.modo = 'passeio'
          g.proximaDecisao = mu.t + 0.5
        }
      } else if (Math.abs(dist) < m.barbaW * 0.55 && b.y < m.barbaH * 0.3) {
        const longe: -1 | 1 = dist >= 0 ? 1 : -1
        arrancar(presaNaBorda(longe) ? (-longe as -1 | 1) : longe, 0.8)
        g.proximoOvo = Math.min(g.proximoOvo, mu.t + 0.1)
      } else if (Math.abs(dist) < mu.W * 0.26) {
        if (g.modo !== 'fuga') g.proximoOvo = Math.min(g.proximoOvo, mu.t + 0.2)
        g.modo = 'fuga'
        g.dir = dist >= 0 ? 1 : -1
        if (presaNaBorda(g.dir)) arrancar(-g.dir as -1 | 1, 0.9)
        else if (tp > 0.9 && Math.random() < dt * 0.8) pular(m.barbaH * 0.6)
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
      const tp2 = mu.t - g.pulo
      g.y = tp2 >= 0 && tp2 < 0.55 ? Math.sin((tp2 / 0.55) * Math.PI) * g.alturaPulo : 0

      // Ovos: no chão (mais rápido quando assustada) e um solto no ar a cada pulo dela
      if (mu.t > g.proximoOvo) {
        if (mu.ovos.length < MAX_OVOS && g.y === 0) novoOvo('chao', g.x - g.dir * m.galW * 0.3, 0, 0)
        g.proximoOvo = mu.t + (g.modo === 'passeio' ? 1.2 + Math.random() : 0.45 + Math.random() * 0.4)
      }
      if (!g.botouNoPulo && tp2 > 0.2 && mu.ovos.length < MAX_OVOS) {
        novoOvo('voando', g.x, g.y + m.galH * 0.35, 1.2 * m.barbaH)
        g.botouNoPulo = true
      }

      // Dourado flutuando: só pulando para pegar
      if (mu.t > mu.proximoDourado) {
        if (!mu.ovos.some((o) => o.tipo === 'flutuando') && mu.ovos.length < MAX_OVOS) {
          let x = m.ovoW + Math.random() * (mu.W - 2 * m.ovoW)
          if (Math.abs(x - b.x) < mu.W * 0.2) x = (x + mu.W * 0.45) % mu.W
          novoOvo('flutuando', x, m.barbaH * (1.1 + Math.random() * 0.2), 0)
        }
        mu.proximoDourado = mu.t + 5 + Math.random() * 3
      }

      // Queda dos ovos soltos no ar (caem mais devagar que o Barba, para dar tempo de pegar)
      for (const o of mu.ovos) {
        if (o.tipo !== 'voando') continue
        o.vy -= 9 * m.barbaH * dt
        o.alt += o.vy * dt
        if (o.alt <= 0) {
          o.alt = 0
          o.vy = 0
          o.tipo = 'chao'
          o.nasceu = mu.t
        }
      }

      // Pegar ovos: no chão, só com os pés perto do chão; no ar, na altura do corpo (braços pra cima)
      const alcance = m.barbaW * 0.42
      const topo = b.y + m.barbaH * 1.15
      const pegos = mu.ovos.filter((o) => {
        if (Math.abs(o.x - b.x) > alcance * (o.tipo === 'chao' ? 1 : 1.15)) return false
        if (o.tipo === 'chao') return b.y < m.ovoH * 1.5 && mu.t - o.nasceu > 0.25
        const centro = o.alt + m.ovoH / 2
        return centro >= b.y - 4 && centro <= topo
      })
      if (pegos.length) {
        mu.ovos = mu.ovos.filter((o) => !pegos.includes(o))
        for (const o of pegos) {
          const valor = PONTOS[o.tipo]
          mu.pontos += valor
          const pop: Pop = { id: o.id, x: o.x, alt: o.alt, texto: `+${valor}`, dourado: o.tipo === 'flutuando' }
          setPops((l) => [...l, pop])
          window.setTimeout(() => setPops((l) => l.filter((p) => p.id !== pop.id)), 800)
        }
        navigator.vibrate?.(10)
        setPontos(mu.pontos)
        setOvos([...mu.ovos])
      }
      const antes = mu.ovos.length
      mu.ovos = mu.ovos.filter(
        (o) => o.tipo === 'voando' || mu.t - o.nasceu < (o.tipo === 'flutuando' ? VIDA_DOURADO : VIDA_OVO),
      )
      if (mu.ovos.length !== antes) setOvos([...mu.ovos])

      desenhar()
      if (agora - hud > 200) {
        hud = agora
        setTempo(Math.max(0, Math.ceil(DURACAO - mu.t)))
      }

      if (mu.t >= DURACAO) {
        b.andando = false
        b.y = 0
        b.vy = 0
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
      if (k === ' ' || k === 'arrowup' || k === 'w') {
        e.preventDefault()
        if (apertou && !e.repeat) mu.barba.pedidoPulo = mu.t
        return
      }
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
    toques.current.clear()
    setPontos(0)
    setTempo(DURACAO)
    setOvos([])
    setPops([])
    setNovoRecorde(false)
    setFase('jogando')
  }

  const pular = () => {
    mundo.current.barba.pedidoPulo = mundo.current.t
  }

  const xNoCampo = (e: React.PointerEvent<HTMLDivElement>) => e.clientX - e.currentTarget.getBoundingClientRect().left

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (fase !== 'jogando') return
    // mouse: o movimento já guia o Barba; o clique é o pulo
    if (e.pointerType === 'mouse') {
      if (e.button === 0) pular()
      return
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    toques.current.set(e.pointerId, { x: xNoCampo(e), x0: e.clientX, y0: e.clientY, t0: performance.now(), arrastando: false })
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (fase !== 'jogando') return
    if (e.pointerType === 'mouse') {
      mundo.current.barba.alvo = xNoCampo(e)
      return
    }
    const tq = toques.current.get(e.pointerId)
    if (!tq) return
    tq.x = xNoCampo(e)
    if (!tq.arrastando && Math.hypot(e.clientX - tq.x0, e.clientY - tq.y0) > 10) tq.arrastando = true
    if (tq.arrastando) mundo.current.barba.alvo = tq.x
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const tq = toques.current.get(e.pointerId)
    toques.current.delete(e.pointerId)
    if (fase === 'jogando' && tq && !tq.arrastando && performance.now() - tq.t0 < 250) pular()
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
        <p className="text-terra mt-6 max-w-[32rem] text-[1.06rem] leading-[1.6] md:text-[1.15rem]">
          Ajude o Barba a pegar os ovos que a galinha deixa pelo caminho. Ovo no chão vale 1, ovo pego no ar vale 2 e
          o dourado, lá em cima, vale 3. São 30 segundos.
        </p>
      </header>

      <div
        ref={campoRef}
        aria-label="Campo do joguinho: mova e faça o Barba pular para pegar os ovos"
        className={`foto-recorte bg-palha/60 relative mt-10 h-[330px] overflow-hidden select-none [-webkit-touch-callout:none] md:mt-14 md:h-[380px] ${
          fase === 'jogando' ? 'cursor-pointer touch-none' : ''
        }`}
        style={{ '--chao': `${md.chao}px` } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
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
            <OvoNoCampo key={o.id} ovo={o} largura={md.ovoW} u={u} />
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
                // nasce onde o ovo foi pego: acima da cabeça (chão) ou na altura do ovo (no ar)
                bottom: md.chao + Math.max(p.alt + md.ovoH, md.barbaH) + 2,
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
            <p className="flex items-center gap-2" aria-label={`${pontos} pontos`}>
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
                {temMouse ? (
                  <>
                    Mouse ou setas para andar.
                    <br />
                    Clique ou espaço para pular.
                  </>
                ) : (
                  <>
                    Arraste para andar.
                    <br />
                    Toque para pular.
                  </>
                )}
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
                Você fez {pontos} {pontos === 1 ? 'ponto' : 'pontos'}!
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
                    `Oi, Rancho do Barba! Fiz ${pontos} ${pontos === 1 ? 'ponto' : 'pontos'} no joguinho e agora quero ovos de verdade.`,
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

/**
 * Ovo no campo. A altura (alt) é aplicada direto no DOM pelo laço do jogo; aqui só a entrada,
 * a saída e o pisca-pisca do fim da vida. O dourado flutua balançando.
 */
function OvoNoCampo({ ovo, largura, u }: { ovo: Ovo; largura: number; u: number }) {
  const noChao = ovo.tipo === 'chao'
  const dourado = ovo.tipo === 'flutuando'
  // o que cai do alto só começa a "contar a vida" ao pousar (~0,8 s depois)
  const vida = dourado ? VIDA_DOURADO : VIDA_OVO + (ovo.tipo === 'voando' ? 0.8 : 0)
  return (
    <div
      data-ovo={ovo.id}
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: ovo.x - largura / 2,
        bottom: 'calc(var(--chao) - 2px)',
        width: largura,
        transform: `translateY(${-ovo.alt}px)`,
      }}
    >
      <motion.div
        initial={noChao ? { y: -30 * u, scale: 0.5, opacity: 0 } : { scale: 0.4, opacity: 0 }}
        animate={noChao ? { y: [-30 * u, 0, -7 * u, 0], scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
        exit={{ opacity: 0, scale: 1.35, transition: { duration: 0.22 } }}
        transition={{
          y: { duration: 0.5, times: [0, 0.55, 0.78, 1] },
          scale: { duration: 0.25 },
          opacity: { duration: 0.15 },
        }}
      >
        <div className={dourado ? 'ovo-flutua' : undefined}>
          <div className="ovo-somendo" style={{ animationDelay: `${vida - 1.3}s` }}>
            <svg viewBox="0 0 40 50" className="block h-auto w-full overflow-visible">
              <path
                d="M20 2C30 2 37 18 37 30C37 41 29 48 20 48C11 48 3 41 3 30C3 18 10 2 20 2Z"
                fill={dourado ? DOURADO : ovo.cor}
                stroke="#391807"
                strokeWidth="2.6"
              />
              <ellipse cx="13" cy="19" rx="3" ry="5.5" fill="#fff" opacity="0.6" transform="rotate(-18 13 19)" />
              {dourado && (
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
        </div>
      </motion.div>
    </div>
  )
}

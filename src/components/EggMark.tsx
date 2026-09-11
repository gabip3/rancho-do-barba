import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  type AnimationPlaybackControls,
} from 'framer-motion'
import { canHover, ease, isCompact, prefersReducedMotion } from '../lib/motion'
import { asset } from '../lib/asset'

/** Proporção do quadro recortado em scripts/prepare-assets.mjs (918 × 1144). */
const RATIO = '918 / 1144'
/** Altura (fração do quadro) onde a barba "pendura": linha do bigode/costeletas. */
const BEARD_PIVOT_Y = 0.47

type Props = {
  /** true = tocar a abertura (ovo nasce no centro da tela e viaja até aqui). */
  playIntro: boolean
  /** O símbolo começou a viajar para o lugar: hora de revelar o texto. */
  onReveal: () => void
  /** Abertura terminou por completo. */
  onComplete: () => void
  className?: string
  children?: ReactNode
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function EggMark({ playIntro, onReveal, onComplete, className = '', children }: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const eggImg = useRef<HTMLImageElement>(null)
  const beardImg = useRef<HTMLImageElement>(null)
  const introRunning = useRef(playIntro)
  /** Trava curta durante o pulinho, por relógio, não por promessa (animações interrompidas não resolvem). */
  const lockedUntil = useRef(0)
  const isLocked = () => introRunning.current || performance.now() < lockedUntil.current

  // Camada 1: viagem (centro da tela → lugar no hero)
  const travelX = useMotionValue(0)
  const travelY = useMotionValue(0)
  const travelScale = useMotionValue(1)
  const opacity = useMotionValue(playIntro ? 0 : 1)

  // Camada 2: inclinação do hover (gira sobre a base, como um ovo de verdade)
  const tiltTarget = useMotionValue(0)
  const tilt = useSpring(tiltTarget, { stiffness: 170, damping: 13, mass: 0.9 })

  // Camada 3: corpo: queda, amassadinho, pulinho
  const bodyY = useMotionValue(0)
  const bodySX = useMotionValue(1)
  const bodySY = useMotionValue(1)
  const bodyRot = useMotionValue(0)

  // Camada 4: barba (sempre escala ≥ 1 para cobrir a barba do desenho base)
  const beardSX = useMotionValue(1)
  const beardSY = useMotionValue(1)
  const beardRot = useMotionValue(0)

  // Sombra riscada no chão
  const shadowSX = useMotionValue(1)
  const shadowOpacity = useMotionValue(playIntro ? 0 : 1)

  const running = useRef<AnimationPlaybackControls[]>([])
  /** Guarda as animações da abertura para pará-las se o componente desmontar no meio. */
  const run = (c: AnimationPlaybackControls) => {
    if (introRunning.current) running.current.push(c)
    return c
  }

  /** Pouso: o ovo amassa um tiquinho, a barba chega um instante depois (inércia dos pelos). */
  const land = (strength = 1) => {
    const s = strength
    const t = [0, 0.18, 0.5, 0.78, 1]
    return Promise.all([
      run(animate(bodySY, [1, 1 - 0.09 * s, 1 + 0.035 * s, 0.995, 1], { duration: 0.5, times: t, ease: 'easeOut' })),
      run(animate(bodySX, [1, 1 + 0.07 * s, 1 - 0.025 * s, 1.004, 1], { duration: 0.5, times: t, ease: 'easeOut' })),
      run(animate(bodyRot, [0, -2.6 * s, 1.6 * s, -0.5 * s, 0], { duration: 0.56, times: t, ease: 'easeInOut' })),
      run(animate(shadowSX, [1, 1.14, 0.97, 1], { duration: 0.5, times: [0, 0.2, 0.6, 1], ease: 'easeOut' })),
      run(
        animate(beardSY, [1, 1 + 0.075 * s, 1, 1 + 0.025 * s, 1], {
          duration: 0.62,
          delay: 0.045,
          times: [0, 0.28, 0.55, 0.78, 1],
          ease: 'easeOut',
        }),
      ),
      run(
        animate(beardSX, [1, 1 + 0.022 * s, 1, 1.006, 1], {
          duration: 0.62,
          delay: 0.045,
          times: [0, 0.28, 0.55, 0.78, 1],
          ease: 'easeOut',
        }),
      ),
    ])
  }

  // ── Abertura ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!playIntro) return
    const slot = slotRef.current
    if (!slot) return

    let cancelled = false
    const compact = isCompact()
    const r = slot.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const introWidth = Math.min(Math.max(vw * 0.28, 112), 164)
    const s0 = introWidth / r.width

    // Começa no centro exato da tela, pequeno e invisível.
    travelX.set(vw / 2 - (r.left + r.width / 2))
    travelY.set(vh / 2 - (r.top + r.height / 2))
    travelScale.set(s0 * 0.58)
    opacity.set(0)
    shadowOpacity.set(0)
    shadowSX.set(0.4)
    bodyY.set(compact ? -22 : -34)

    // Se a largura mudar no meio (ex.: girar o celular), o trajeto medido perde o sentido:
    // pula direto para o estado final. Só largura, porque a barra do navegador mexe na altura.
    const finish = () => {
      if (cancelled) return
      cancelled = true
      running.current.forEach((c) => c.stop())
      running.current = []
      travelX.set(0)
      travelY.set(0)
      travelScale.set(1)
      opacity.set(1)
      shadowOpacity.set(1)
      shadowSX.set(1)
      bodyY.set(0)
      bodySX.set(1)
      bodySY.set(1)
      bodyRot.set(0)
      beardSX.set(1)
      beardSY.set(1)
      introRunning.current = false
      onReveal()
      onComplete()
    }
    const onResize = () => {
      if (Math.abs(window.innerWidth - vw) > 1) finish()
    }
    window.addEventListener('resize', onResize)

    const decoded = (img: HTMLImageElement | null) =>
      img ? img.decode().catch(() => undefined) : Promise.resolve()

    ;(async () => {
      // Espera o PNG estar pronto (no máximo 700 ms) para o ovo não nascer "vazio".
      await Promise.race([Promise.all([decoded(eggImg.current), decoded(beardImg.current)]), wait(700)])
      if (cancelled) return

      // 1 e 2. aparece pequeno e cresce enquanto desce
      run(animate(opacity, 1, { duration: 0.28, ease: 'easeOut' }))
      run(animate(shadowOpacity, 1, { duration: 0.4, ease: 'easeOut' }))
      run(animate(shadowSX, 1, { duration: 0.44, ease: ease.queda }))
      run(animate(travelScale, s0, { duration: 0.44, ease: ease.pouso }))
      await run(animate(bodyY, 0, { duration: 0.44, ease: ease.queda }))
      if (cancelled) return

      // 3 e 4. pousa; a barba quica
      land(compact ? 0.7 : 1)
      await wait(200)
      if (cancelled) return

      // 5. sobe até o lugar e revela o hero
      onReveal()
      const trip = { duration: compact ? 0.56 : 0.62, ease: ease.viagem }
      await Promise.all([
        run(animate(travelX, 0, trip)),
        run(animate(travelY, 0, trip)),
        run(animate(travelScale, 1, trip)),
      ])
      if (cancelled) return
      window.removeEventListener('resize', onResize)
      introRunning.current = false
      running.current = []
      onComplete()
      window.setTimeout(() => cutucar(), 1500)
    })()

    return () => {
      window.removeEventListener('resize', onResize)
      cancelled = true
      running.current.forEach((c) => c.stop())
      running.current = []
    }
    // A abertura roda uma única vez, com as medidas do primeiro layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Microinterações ───────────────────────────────────────────────
  const hover = useRef(false)

  const wiggleBeard = () => {
    // Escala sobe junto com a rotação para a barba de baixo nunca aparecer.
    const t = [0, 0.25, 0.55, 0.8, 1]
    run(animate(beardRot, [0, 1.3, -1, 0.4, 0], { duration: 0.75, times: t, ease: 'easeInOut' }))
    run(animate(beardSX, [1, 1.03, 1.028, 1.01, 1], { duration: 0.75, times: t, ease: 'easeInOut' }))
    run(animate(beardSY, [1, 1.035, 1.03, 1.012, 1], { duration: 0.75, times: t, ease: 'easeInOut' }))
  }

  /** Uma cutucada logo depois da abertura, para mostrar que o ovo reage ao toque. */
  const cutucar = () => {
    if (hover.current || isLocked()) return
    animate(bodyRot, [0, -4, 3.2, -1.4, 0], { duration: 0.8, ease: 'easeInOut' })
    wiggleBeard()
  }

  const onPointerEnter = () => {
    if (introRunning.current || !canHover()) return
    hover.current = true
    if (!isLocked()) wiggleBeard()
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (introRunning.current || !hover.current) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    tiltTarget.set(Math.max(-1, Math.min(1, dx)) * 4.5)
  }

  const onPointerLeave = () => {
    hover.current = false
    tiltTarget.set(0)
  }

  const [ovinhos, setOvinhos] = useState<Ovinho[]>([])
  const botados = useRef(0)
  const ultimoOvinho = useRef(0)

  /** Cada toque "bota" um ovinho colorido que pula de trás do ovo, gira e cai de lado no chão. */
  const botarOvinho = () => {
    const agora = performance.now()
    if (agora - ultimoOvinho.current < 180) return
    ultimoOvinho.current = agora
    const n = botados.current++
    const lado = n % 2 === 0 ? 1 : -1
    const novo: Ovinho = {
      id: n,
      cor: CORES_OVINHOS[n % CORES_OVINHOS.length],
      lado,
      distancia: 3.3 + Math.random() * 1.3,
      giro: (450 + (Math.random() * 30 - 15)) * lado,
    }
    setOvinhos((lista) => [...lista.slice(-6), novo])
    window.setTimeout(() => setOvinhos((lista) => lista.filter((o) => o.id !== n)), 3400)
  }

  /** Toque/clique: pulinho, barba balançando e um ovinho novo. É o "hover" de quem está no celular. */
  const hop = () => {
    if (introRunning.current || prefersReducedMotion()) return
    navigator.vibrate?.(12)
    botarOvinho()
    if (isLocked()) return
    const up = isCompact() ? -22 : -26
    const air = 0.44 // sobe + desce, em segundos
    lockedUntil.current = performance.now() + air * 1000 + 560
    animate(bodyY, [0, up, 0], { duration: air, times: [0, 0.5, 1], ease: ['easeOut', 'easeIn'] })
    animate(bodySY, [1, 1.045, 1], { duration: air, times: [0, 0.4, 1] })
    animate(shadowSX, [1, 0.72, 1], { duration: air, times: [0, 0.5, 1], ease: ['easeOut', 'easeIn'] })
    window.setTimeout(() => land(1), air * 1000)
  }

  return (
    <div ref={slotRef} className={`relative ${className}`} style={{ aspectRatio: RATIO }}>
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ x: travelX, y: travelY, scale: travelScale }}
      >
        <HatchShadow scaleX={shadowSX} opacity={shadowOpacity} />

        {/* atrás do ovo grande, para parecerem sair dele */}
        <AnimatePresence>
          {ovinhos.map((o) => (
            <OvinhoCaindo key={o.id} ovinho={o} />
          ))}
        </AnimatePresence>

        <motion.div
          role="img"
          aria-label="Símbolo do Rancho do Barba: um ovo com barba"
          className="absolute inset-0 cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
          style={{ rotate: tilt, originX: 0.5, originY: 0.97, opacity }}
          onPointerEnter={onPointerEnter}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onClick={hop}
        >
          <motion.div
            className="absolute inset-0"
            style={{ y: bodyY, scaleX: bodySX, scaleY: bodySY, rotate: bodyRot, originX: 0.5, originY: 0.97 }}
          >
            <img
              ref={eggImg}
              src={asset('images/ovo.webp')}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full"
              fetchPriority="high"
            />
            <motion.img
              ref={beardImg}
              src={asset('images/barba.webp')}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full"
              style={{ scaleX: beardSX, scaleY: beardSY, rotate: beardRot, originX: 0.5, originY: BEARD_PIVOT_Y }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {children}
    </div>
  )
}

type Ovinho = { id: number; cor: string; lado: 1 | -1; distancia: number; giro: number }

/** As cores da bandeja: verde-oliva, azulado, rosado, marrom, verde. */
const CORES_OVINHOS = ['#CFCB9A', '#DDE7E2', '#F1C3A2', '#C98B5E', '#B7C4A0']

/** Ovinho desenhado (mesmo traço das galinhas). Distâncias em % do próprio tamanho. */
function OvinhoCaindo({ ovinho: o }: { ovinho: Ovinho }) {
  const X = o.distancia * 100 * o.lado
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute bottom-[3.5%] left-[43.5%] w-[13%]"
      initial={{ x: '0%', y: '-190%', scale: 0.5, rotate: 0 }}
      animate={{
        x: ['0%', `${X * 0.45}%`, `${X}%`, `${X * 1.08}%`],
        y: ['-190%', '-330%', '0%', '-26%', '0%'],
        scale: [0.5, 1, 1, 1],
        rotate: [0, o.giro * 0.55, o.giro, o.giro + 8 * o.lado],
      }}
      exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.45 } }}
      transition={{
        x: { duration: 0.95, times: [0, 0.3, 0.7, 1], ease: 'easeOut' },
        y: { duration: 0.95, times: [0, 0.28, 0.66, 0.82, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'] },
        scale: { duration: 0.28, ease: 'easeOut' },
        rotate: { duration: 0.95, ease: 'easeOut' },
      }}
    >
      <svg viewBox="0 0 40 50" className="block h-auto w-full overflow-visible">
        <path
          d="M20 2C30 2 37 18 37 30C37 41 29 48 20 48C11 48 3 41 3 30C3 18 10 2 20 2Z"
          fill={o.cor}
          stroke="#391807"
          strokeWidth="2.4"
        />
        <ellipse cx="13" cy="19" rx="3" ry="5.5" fill="#fff" opacity="0.55" transform="rotate(-18 13 19)" />
      </svg>
    </motion.div>
  )
}

/** Sombra de lápis: umas poucas hachuras rápidas, como num rascunho. */
function HatchShadow({
  scaleX,
  opacity,
}: {
  scaleX: ReturnType<typeof useMotionValue<number>>
  opacity: ReturnType<typeof useMotionValue<number>>
}) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 200 26"
      preserveAspectRatio="none"
      className="absolute left-[16%] right-[16%] top-[95.5%] h-[5.5%] w-[68%] overflow-visible"
      style={{ scaleX, opacity, originX: 0.5 }}
    >
      <path
        d="M26 10.5 C 72 6.6, 134 6.2, 177 9.4
           C 132 10.6, 76 11.3, 31 13.9
           C 78 13.2, 128 13.4, 170 15
           C 126 16.6, 84 17.4, 50 18.8
           C 88 18.4, 120 18.9, 150 19.6"
        fill="none"
        stroke="var(--color-barba)"
        strokeOpacity="0.3"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  )
}

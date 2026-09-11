import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion'
import EggMark from './EggMark'
import { ease, prefersReducedMotion } from '../lib/motion'
import { whatsappLink } from '../lib/contato'
import { asset } from '../lib/asset'

const line: Variants = {
  hidden: { opacity: 0, y: '0.45em' },
  shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: ease.pouso } },
}

const soft: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ease.pouso } },
}

export default function Hero({ onSettled }: { onSettled?: () => void }) {
  // Decidido uma vez, antes do primeiro paint.
  const [playIntro] = useState(() => !prefersReducedMotion())
  const [revealed, setRevealed] = useState(!playIntro)
  const [settled, setSettled] = useState(!playIntro)
  const reduced = useReducedMotion()

  useEffect(() => {
    const root = document.documentElement
    if (!settled) {
      root.dataset.intro = 'playing'
    } else {
      delete root.dataset.intro
      onSettled?.()
    }
  }, [settled, onSettled])

  // Saída suave ao rolar: o texto some um pouco antes do ovo, sem parallax pesado.
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -56])
  const textOpacity = useTransform(scrollYProgress, [0.12, 0.62], [1, 0])
  const eggY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -96])
  const eggRotate = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 5])
  const eggOpacity = useTransform(scrollYProgress, [0.25, 0.85], [1, 0])

  return (
    <motion.section
      ref={sectionRef}
      aria-labelledby="hero-titulo"
      className="relative flex min-h-[100svh] flex-col overflow-x-clip"
      initial={false}
      animate={revealed ? 'shown' : 'hidden'}
      variants={{ shown: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* Topo: só a assinatura e o lugar. */}
      <motion.header
        variants={soft}
        className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-6 pt-5 md:px-10 md:pt-8 lg:px-14"
      >
        <a href={import.meta.env.BASE_URL} aria-label="Rancho do Barba, início" className="block rounded-md">
          <img src={asset('images/wordmark.webp')} alt="Rancho do Barba" className="h-[1.3rem] w-auto md:h-[1.6rem]" />
        </a>
        <p className="rotulo text-terra inline-flex items-center gap-[0.5em]">
          <svg aria-hidden viewBox="0 0 16 20" className="text-caramelo h-[1.45em] w-auto shrink-0">
            <path
              fill="currentColor"
              d="M8 19.5C8 19.5 1.5 12.6 1.5 7.8a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11.7-6.5 11.7Z"
            />
            <circle cx="8" cy="7.8" r="2.4" fill="var(--color-papel)" />
          </svg>
          <span>
            Guarulhos <span className="text-caramelo">·</span> SP
          </span>
        </p>
      </motion.header>

      <div className="mx-auto grid w-full max-w-[1360px] flex-1 grid-cols-1 content-center items-center gap-y-9 px-6 pb-12 pt-6 md:px-10 lg:grid-cols-12 lg:gap-x-8 lg:px-14 lg:pb-16 lg:pt-0">
        {/* Símbolo */}
        <motion.div
          className="relative flex justify-center lg:order-2 lg:col-span-5 lg:justify-start"
          style={{ y: eggY, rotate: eggRotate, opacity: eggOpacity }}
        >
          <EggMark
            playIntro={playIntro}
            onReveal={() => setRevealed(true)}
            onComplete={() => setSettled(true)}
            className="w-[min(52vw,30svh)] md:w-[min(40vw,36svh)] lg:w-[min(34vw,60svh,500px)]"
          />
        </motion.div>

        {/* Texto */}
        <motion.div
          className="text-center lg:order-1 lg:col-span-7 lg:text-left"
          style={{ y: textY, opacity: textOpacity }}
        >
          <h1
            id="hero-titulo"
            className="display text-tinta text-[clamp(2.35rem,10.2vw,3.9rem)] leading-[0.98] font-[520] lg:text-[clamp(3.7rem,5.5vw,6rem)]"
          >
            <motion.span variants={line} className="block">
              Ovos de verdade.
            </motion.span>
            <motion.span
              variants={line}
              className="display-italic text-caramelo mt-[0.08em] block font-[400] tracking-[-0.018em]"
            >
              Do jeito que <br />
              tem que ser.
            </motion.span>
          </h1>

          <motion.p
            variants={soft}
            className="text-terra mx-auto mt-6 max-w-[27rem] text-[1.06rem] leading-[1.55] font-[400] md:mt-8 md:text-[1.15rem] lg:mx-0 lg:max-w-[31rem] lg:text-[1.2rem]"
          >
            <strong className="text-tinta font-[600]">Ovos caipiras</strong>,{' '}
            <strong className="text-tinta font-[600]">ovos de codorna em conserva</strong> e{' '}
            <strong className="text-tinta font-[600]">frango caipira</strong>. Tudo natural,{' '}
            <strong className="text-tinta font-[600]">sem conservantes</strong>, direto do Rancho do Barba, em
            Guarulhos.
          </motion.p>

          <motion.div
            variants={soft}
            className="mt-8 flex flex-col items-center gap-5 sm:flex-row sm:justify-center md:mt-10 lg:justify-start lg:gap-8"
          >
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-artesanal group inline-flex items-center gap-3 px-7 py-[0.95rem] text-[1.02rem] font-[500] tracking-[0.01em]"
            >
              Quero meus ovos
              <svg
                aria-hidden
                viewBox="0 0 22 12"
                className="h-3 w-[1.35rem] transition-transform duration-300 ease-(--ease-pouso) group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1.2 6.4 C 7 5.7, 13.5 5.9, 20.4 6" />
                <path d="M15.6 1.6 L 20.6 6 L 15.9 10.6" />
              </svg>
            </a>

            <a
              href="#rancho"
              className="group text-terra hover:text-tinta relative inline-flex items-center gap-1.5 py-1 text-[0.95rem] font-[450] transition-colors"
            >
              Conheça o Rancho
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 ease-(--ease-pouso) group-hover:translate-y-[3px]"
              >
                ↓
              </span>
              <svg
                aria-hidden
                viewBox="0 0 140 6"
                preserveAspectRatio="none"
                className="text-casca absolute -bottom-0.5 left-0 h-[5px] w-full transition-colors group-hover:text-caramelo"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M1.5 3.6 C 30 2.2, 70 4.4, 108 2.8 C 120 2.4, 131 3, 138.5 3.4" />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}

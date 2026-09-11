import { useEffect, useRef } from 'react'
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion'
import { ease } from '../lib/motion'
import { Galinha } from './Galinhas'
import { asset } from '../lib/asset'

type Foto = {
  arquivo: string
  /** larguras geradas por scripts/prepare-photos.mjs: [menor, original do corte] */
  larguras: [number, number]
  proporcao: string
  alt: string
  rotulo: string
  legenda: string
}

type Video = {
  /** public/videos/<arquivo>.mp4 e <arquivo>-capa.webp (trechos curtos, sem áudio) */
  arquivo: string
  proporcao: string
  alt: string
  rotulo: string
  legenda: string
}

const FOTOS = {
  bandeja: {
    arquivo: 'bandeja-colorida',
    larguras: [720, 1180],
    proporcao: '4 / 3',
    alt: 'Bandeja com ovos caipiras de várias cores: verdes, azulados, rosados e marrons',
    rotulo: 'Ovos caipiras',
    legenda: 'Verde, azul, rosado, marrom: a cor da casca vem da raça da galinha.',
  },
  entrega: {
    arquivo: 'bandejas-entrega',
    larguras: [720, 1086],
    proporcao: '4 / 5',
    alt: 'Porta-malas de carro com várias bandejas de ovos caipiras embaladas',
    rotulo: 'Saindo do rancho',
    legenda: 'Bandejas embaladas, prontas para sair.',
  },
  conserva: {
    arquivo: 'codorna-conserva',
    larguras: [720, 810],
    proporcao: '8 / 5',
    alt: 'Potes de ovos de codorna em conserva, temperados com ervas e pimenta',
    rotulo: 'Ovos de codorna em conserva',
    legenda: 'Temperados com ervas e pimenta, sem conservantes.',
  },
  potes: {
    arquivo: 'codorna-potes',
    larguras: [720, 1060],
    proporcao: '4 / 5',
    alt: 'Pirâmide de potes de ovos de codorna em conserva, com rótulo artesanal',
    rotulo: 'Prontos pra levar',
    legenda: 'Potes fechados, direto para a sua mesa.',
  },
} satisfies Record<string, Foto>

const VIDEOS = {
  galinhas: {
    arquivo: 'galinhas-comedouro',
    proporcao: '474 / 700',
    alt: 'Galinhas caipiras comendo em volta dos comedouros do galinheiro',
    rotulo: 'As galinhas',
    legenda: 'Hora de comer no galinheiro.',
  },
  ninho: {
    arquivo: 'ninho-ovos-coloridos',
    proporcao: '474 / 700',
    alt: 'Ninho de palha com ovos azulados, verdes e marrons',
    rotulo: 'Direto do ninho',
    legenda: 'Ovos azuis, verdes e marrons, ainda na palha.',
  },
} satisfies Record<string, Video>

const surge: Variants = {
  hidden: { opacity: 0, y: 22 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.9, ease: ease.pouso } },
}

export default function RanchoFotos() {
  const reduced = useReducedMotion()

  return (
    <section
      id="rancho"
      aria-labelledby="rancho-titulo"
      className="mx-auto w-full max-w-[1360px] scroll-mt-6 px-6 pt-14 pb-28 md:px-10 md:pt-28 lg:px-14 lg:pt-32 lg:pb-40"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-10">
        <motion.header
          className="max-w-[42rem]"
          initial={reduced ? false : 'hidden'}
          whileInView="shown"
          viewport={{ once: true, amount: 0.5 }}
          variants={{ shown: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.p variants={surge} className="rotulo text-caramelo text-[0.8rem] md:text-[0.88rem]">
            O Rancho
          </motion.p>
          <motion.h2
            id="rancho-titulo"
            variants={surge}
            className="display text-tinta mt-4 text-[clamp(2.1rem,8.4vw,3.3rem)] leading-[1.02] font-[500] lg:text-[clamp(3rem,4.2vw,4.4rem)]"
          >
            Sabor de verdade,
            <br />
            <span className="display-italic text-caramelo font-[400]">em todas as cores.</span>
          </motion.h2>
          <motion.p
            variants={surge}
            className="text-terra mt-6 max-w-[31rem] text-[1.06rem] leading-[1.6] md:text-[1.15rem]"
          >
            Cada galinha bota de uma cor. A gente recolhe, embala e separa pra você: tudo natural, sem conservantes.
          </motion.p>
        </motion.header>

        {/* celular: em pé em cima da primeira foto (no desktop ela fica em cima da foto do porta-malas) */}
        <Galinha pose="em-pe" className="relative z-10 -mb-[6px] mr-5 w-24 shrink-0 -scale-x-100 self-end md:hidden" />
      </div>

      {/*
        Mobile: grade de 2 colunas na ordem da história; fotos ocupam a largura toda,
        os dois vídeos ficam lado a lado.
        Desktop: duas colunas desencontradas (as wrappers deixam de ser "contents").
      */}
      <div className="mt-0 grid grid-cols-2 gap-x-4 gap-y-12 md:mt-20 md:grid-cols-12 md:gap-x-10 md:gap-y-0">
        <div className="contents md:col-span-7 md:flex md:flex-col md:gap-20">
          <Figura foto={FOTOS.bandeja} reduced={reduced} sizes="(min-width: 768px) 58vw, 100vw" className="order-1 col-span-2" />
          <Clipe video={VIDEOS.galinhas} reduced={reduced} className="order-3 col-span-1 md:w-[62%]" />
          <Figura
            foto={FOTOS.conserva}
            reduced={reduced}
            sizes="(min-width: 768px) 46vw, 100vw"
            className="order-5 col-span-2 md:w-[80%] md:self-end"
          />
          <Galinha pose="chocando" className="order-7 col-span-2 w-44 justify-self-center md:w-[46%] md:self-center" />
        </div>
        <div className="contents md:col-span-5 md:flex md:flex-col md:gap-20 md:pt-36">
          <div className="relative order-2 col-span-2">
            {/* desktop: a galinha fica em pé na borda de cima desta foto, olhando para o conteúdo */}
            <Galinha
              pose="em-pe"
              className="absolute right-[14%] bottom-full z-10 -mb-[0.6rem] hidden w-40 -scale-x-100 md:block lg:-mb-[0.7rem] lg:w-48"
            />
            <Figura foto={FOTOS.entrega} reduced={reduced} sizes="(min-width: 768px) 42vw, 100vw" />
          </div>
          <Clipe video={VIDEOS.ninho} reduced={reduced} className="order-4 col-span-1 md:w-[86%] md:self-end" />
          <Figura foto={FOTOS.potes} reduced={reduced} sizes="(min-width: 768px) 42vw, 100vw" className="order-6 col-span-2" />
        </div>
      </div>
    </section>
  )
}

function Legenda({ rotulo, legenda }: { rotulo: string; legenda: string }) {
  return (
    <figcaption className="mt-4 max-w-[30rem] md:mt-5">
      <span className="rotulo text-caramelo block text-[0.8rem] md:text-[0.88rem]">{rotulo}</span>
      <span className="text-terra mt-2 block text-[1.08rem] leading-[1.45] md:text-[1.25rem]">{legenda}</span>
    </figcaption>
  )
}

function useSurgir(reduced: boolean | null) {
  return {
    initial: reduced ? false : { opacity: 0, y: 36 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 1, ease: ease.pouso },
  } as const
}

function Figura({
  foto,
  sizes,
  reduced,
  className = '',
}: {
  foto: Foto
  sizes: string
  reduced: boolean | null
  className?: string
}) {
  const [menor, maior] = foto.larguras
  const url = (w: number) => asset(`fotos/${foto.arquivo}-${w}.webp`)

  return (
    <motion.figure className={className} {...useSurgir(reduced)}>
      <div className="foto-recorte bg-palha overflow-hidden" style={{ aspectRatio: foto.proporcao }}>
        <img
          src={url(maior)}
          srcSet={`${url(menor)} ${menor}w, ${url(maior)} ${maior}w`}
          sizes={sizes}
          alt={foto.alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-[1400ms] ease-(--ease-pouso) hover:scale-[1.025]"
        />
      </div>
      <Legenda rotulo={foto.rotulo} legenda={foto.legenda} />
    </motion.figure>
  )
}

/** Vídeo curto em loop, sem som. Só roda enquanto está na tela; com "reduzir movimento", fica na capa. */
function Clipe({ video, reduced, className = '' }: { video: Video; reduced: boolean | null; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const naTela = useInView(ref, { amount: 0.25 })

  useEffect(() => {
    const v = ref.current
    if (!v || reduced) return
    if (naTela) v.play().catch(() => {})
    else v.pause()
  }, [naTela, reduced])

  return (
    <motion.figure className={className} {...useSurgir(reduced)}>
      <div className="foto-recorte bg-palha overflow-hidden" style={{ aspectRatio: video.proporcao }}>
        <video
          ref={ref}
          src={asset(`videos/${video.arquivo}.mp4`)}
          poster={asset(`videos/${video.arquivo}-capa.webp`)}
          aria-label={video.alt}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
      <Legenda rotulo={video.rotulo} legenda={video.legenda} />
    </motion.figure>
  )
}

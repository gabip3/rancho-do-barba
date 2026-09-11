/**
 * Recorta e otimiza as fotos do rancho (originais na raiz do projeto) para public/fotos.
 * Cada corte já sai na proporção usada na seção, então o CSS não recorta de novo.
 *
 *   node scripts/prepare-photos.mjs
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const OUT = 'public/fotos'

const FOTOS = [
  // 4:3, só a bandeja e um pouco da bancada
  { src: 'ovos2.png', nome: 'bandeja-colorida', crop: { left: 21, top: 200, width: 1180, height: 885 } },
  // 4:5, o porta-malas inteiro conta a história da entrega
  { src: 'ovos1.png', nome: 'bandejas-entrega', crop: { left: 0, top: 90, width: 1086, height: 1357 } },
  // 8:5, corte fechado nos potes para fugir da toalha estampada
  { src: 'ovos3.png', nome: 'codorna-conserva', crop: { left: 190, top: 540, width: 810, height: 506 } },
]

await mkdir(OUT, { recursive: true })

for (const f of FOTOS) {
  const base = sharp(f.src).extract(f.crop)
  for (const width of [720, f.crop.width]) {
    await base.clone().resize({ width }).webp({ quality: 82, effort: 6 }).toFile(`${OUT}/${f.nome}-${width}.webp`)
  }
  console.log(`${f.nome}: ${f.crop.width}×${f.crop.height} → ${OUT}/${f.nome}-{720,${f.crop.width}}.webp`)
}

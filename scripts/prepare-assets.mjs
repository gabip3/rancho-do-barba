/**
 * Gera os arquivos web a partir dos originais da marca (na raiz do projeto).
 * Nada é redesenhado: só recorte, separação de camadas e compressão.
 *
 *   public/images/ovo.webp        símbolo completo, recortado
 *   public/images/barba.webp      só a barba (mesmo quadro do ovo), para a microanimação
 *   public/images/wordmark.webp   "Rancho do Barba" do logo, com fundo transparente
 *   public/images/favicon.png
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const OUT = 'public/images'
const EGG_SRC = 'ovo no background.png'
const LOGO_SRC = 'logo ovo 1.png'

// Quadro do símbolo: bbox do alfa (166,74 → 1063,1197) com respiro.
const EGG_CROP = { left: 156, top: 64, width: 918, height: 1144 }

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b
const clamp01 = (v) => Math.min(1, Math.max(0, v))

await mkdir(OUT, { recursive: true })

// ── Ovo ──────────────────────────────────────────────────────────────
const egg = sharp(EGG_SRC).extract(EGG_CROP)
await egg.clone().webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`${OUT}/ovo.webp`)

// ── Barba: pixels escuros do símbolo, com borda suave ────────────────
{
  const { data, info } = await egg.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.from(data)
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4
      const t = clamp01((lum(data[i], data[i + 1], data[i + 2]) - 48) / 24)
      const a = Math.round(data[i + 3] * (1 - t))
      out[i + 3] = a
      if (a > 128) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  await sharp(out, { raw: info }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`${OUT}/barba.webp`)
  const f = (v, d) => (v / d).toFixed(3)
  console.log(
    `barba bbox (fração do quadro): x ${f(x0, info.width)} a ${f(x1, info.width)}, y ${f(y0, info.height)} a ${f(y1, info.height)}`,
  )
}

// ── Wordmark: só "Rancho do Barba", tinta sobre transparente ─────────
{
  const { data, info } = await sharp(LOGO_SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width, C = info.channels
  const dark = (x, y) => {
    const i = (y * W + x) * C
    return lum(data[i], data[i + 1], data[i + 2]) < 150
  }
  // Primeira linha do texto: tinta fora da faixa horizontal do símbolo.
  let top = 0
  outer: for (let y = 600; y < 900; y++) {
    for (let x = 140; x < W - 140; x++) {
      if ((x < 520 || x > 1010) && dark(x, y)) {
        top = y
        break outer
      }
    }
  }
  const crop = { left: 150, top: top - 8, width: 1240, height: 838 - (top - 8) }
  const { data: d, info: ci } = await sharp(LOGO_SRC).removeAlpha().extract(crop).raw().toBuffer({ resolveWithObject: true })
  const rgba = Buffer.alloc(ci.width * ci.height * 4)
  for (let p = 0; p < ci.width * ci.height; p++) {
    const l = lum(d[p * 3], d[p * 3 + 1], d[p * 3 + 2])
    rgba[p * 4] = 0x2d
    rgba[p * 4 + 1] = 0x13
    rgba[p * 4 + 2] = 0x06
    rgba[p * 4 + 3] = Math.round(255 * clamp01((238 - l) / 178))
  }
  // Limpa a pontinha da barba do símbolo que encosta no topo do "do".
  for (let y = 0; y < 34; y++) {
    for (let x = 510; x < 730; x++) rgba[(y * ci.width + x) * 4 + 3] = 0
  }
  await sharp(rgba, { raw: { width: ci.width, height: ci.height, channels: 4 } })
    .trim({ threshold: 1 })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(`${OUT}/wordmark.webp`)
  const meta = await sharp(`${OUT}/wordmark.webp`).metadata()
  console.log(`wordmark: topo do texto y=${top}, saída ${meta.width}×${meta.height}`)
}

// ── Favicon ──────────────────────────────────────────────────────────
await egg
  .clone()
  .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(`${OUT}/favicon.png`)

console.log('ok →', OUT)

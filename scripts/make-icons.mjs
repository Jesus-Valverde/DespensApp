// One-off: generate PWA icon variants from the brand logo SVG. Run: node scripts/make-icons.mjs
import sharp from 'sharp'

const SRC = 'C:/Users/jesus/OneDrive/Pictures/Logos/DespensApp Logo.svg'
const OUT = 'public'
const BRAND = '#2563EB' // blue-600
const RATIO = 1952 / 2200 // source aspect (w/h)

async function make(size, logoFactor, file) {
  const logoH = Math.round(size * logoFactor)
  const logoW = Math.round(logoH * RATIO)
  const logo = await sharp(SRC).resize(logoW, logoH).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BRAND } })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(`${OUT}/${file}`)
  console.log(`✓ ${file} (${size}x${size}, logo ${logoFactor * 100}%)`)
}

await make(512, 0.86, 'pwa-512.png')
await make(192, 0.86, 'pwa-192.png')
await make(512, 0.7, 'pwa-maskable-512.png') // content inside the 80% safe zone
await make(180, 0.86, 'apple-touch-icon.png')
await make(64, 0.86, 'favicon.png')
console.log('done')

// One-off: generate PWA icon variants from the brand logo SVG.
// Run: node scripts/make-icons.mjs [dark|white]  (white is the default glyph tone)
// Needs sharp: pnpm add -D sharp
import sharp from 'sharp'

const SRC = 'C:/Users/jesus/OneDrive/Pictures/Logos/DespensAppSolido negro.svg'
const OUT = 'public'
const BRAND = '#2563EB' // blue-600
const RATIO = 812 / 941 // source aspect (w/h)
const TONE = process.argv[2] === 'dark' ? null : '#ffffff'

async function make(size, logoFactor, file) {
  const logoH = Math.round(size * logoFactor)
  const logoW = Math.round(logoH * RATIO)
  // trim(): the export leaves the glyph offset in a larger canvas; crop to content first.
  let logo = await sharp(SRC).trim().resize(logoW, logoH).png().toBuffer()
  if (TONE) {
    // Flat silhouette: solid tone masked by the logo's alpha channel.
    logo = await sharp({ create: { width: logoW, height: logoH, channels: 4, background: TONE } })
      .composite([{ input: logo, blend: 'dest-in' }])
      .png()
      .toBuffer()
  }
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

// Transparent white silhouette for the app header (no background).
if (TONE) {
  const h = 256
  const w = Math.round(h * RATIO)
  const glyph = await sharp(SRC).trim().resize(w, h).png().toBuffer()
  await sharp({ create: { width: w, height: h, channels: 4, background: TONE } })
    .composite([{ input: glyph, blend: 'dest-in' }])
    .png()
    .toFile(`${OUT}/logo-white.png`)
  console.log(`✓ logo-white.png (${w}x${h}, transparent)`)
}
console.log('done')

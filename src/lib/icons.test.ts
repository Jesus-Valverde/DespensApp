import { describe, it, expect } from 'vitest'
import { PRODUCT_ICONS, ICON_TONES, iconPath, toneClasses } from './icons'

describe('icons', () => {
  it('has unique icon keys with a label and path', () => {
    const keys = PRODUCT_ICONS.map((icon) => icon.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const icon of PRODUCT_ICONS) {
      expect(icon.label.trim()).not.toBe('')
      expect(icon.path.trim()).not.toBe('')
    }
  })

  it('covers the Stitch picker set (25 icons, 11 tones)', () => {
    expect(PRODUCT_ICONS).toHaveLength(25)
    expect(ICON_TONES).toHaveLength(11)
  })

  it('has unique tone keys with bg and fg classes', () => {
    const keys = ICON_TONES.map((tone) => tone.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const tone of ICON_TONES) {
      expect(tone.chip).toMatch(/^bg-/)
      expect(tone.fg).toMatch(/^text-/)
    }
  })

  it('resolves known keys and falls back for unknown ones', () => {
    expect(iconPath('lacteos')).toBe(PRODUCT_ICONS[0].path)
    expect(iconPath('no-existe')).toBe(iconPath('almacen'))
    expect(toneClasses('azul')).toBe(`${ICON_TONES[0].chip} ${ICON_TONES[0].fg}`)
    expect(toneClasses('no-existe')).toBe(toneClasses('azul'))
  })
})

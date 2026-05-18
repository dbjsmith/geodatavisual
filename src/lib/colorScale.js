/**
 * colorScale.js
 *
 * EHI (Ecological Health Index) is a 0–10 score. This module maps it to
 * the GDT brand colour palette so the same scale renders identically
 * across charts, map markers, and indicator grids.
 */

const GDT = {
  green:    '#2d6a4f',
  greenMid: '#40916c',
  greenLt:  '#74c69d',
  amber:    '#e9c46a',
  red:      '#e76f51',
  slateLt:  '#718096',
}

/**
 * Returns a hex colour for an EHI score (0–10).
 * Higher score → darker green. Lower → amber/red.
 */
export function ehiColor(score) {
  if (score == null || Number.isNaN(score)) return GDT.slateLt
  if (score >= 8)   return GDT.green
  if (score >= 6.5) return GDT.greenMid
  if (score >= 5)   return GDT.greenLt
  if (score >= 3.5) return GDT.amber
  return GDT.red
}

/**
 * Human-readable label for an EHI band.
 */
export function ehiLabel(score) {
  if (score == null || Number.isNaN(score)) return 'Unscored'
  if (score >= 8)   return 'Excellent'
  if (score >= 6.5) return 'Good'
  if (score >= 5)   return 'Moderate'
  if (score >= 3.5) return 'Poor'
  return 'Critical'
}

/**
 * Returns CSS-var-style band for use in Tailwind utilities (text-gdt-green etc).
 */
export function ehiTailwindClass(score) {
  if (score == null || Number.isNaN(score)) return 'text-gdt-slate-lt'
  if (score >= 8)   return 'text-gdt-green'
  if (score >= 6.5) return 'text-gdt-green-mid'
  if (score >= 5)   return 'text-gdt-green-lt'
  if (score >= 3.5) return 'text-gdt-amber'
  return 'text-gdt-red'
}

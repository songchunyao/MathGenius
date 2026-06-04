import { useMemo } from 'react'

/** 安全的 SVG 标签白名单 */
const SAFE_TAGS = new Set([
  'svg', 'g', 'line', 'circle', 'rect', 'text', 'path', 'polygon',
  'polyline', 'ellipse', 'defs', 'marker', 'linearGradient',
  'radialGradient', 'stop', 'tspan', 'textPath',
])

/** 安全的 SVG 属性白名单 */
const SAFE_ATTRS = new Set([
  'viewbox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'fill', 'stroke',
  'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'font-size', 'font-family', 'font-weight',
  'text-anchor', 'dominant-baseline', 'dx', 'dy',
  'transform', 'opacity',
  'xmlns', 'version',
])

function sanitizeSvg(xml: string): string {
  // 移除 XML 声明
  let cleaned = xml.replace(/<\?xml[^>]*\?>/gi, '')

  // 使用正则移除所有不安全的标签（保留白名单内的）
  // 先移除所有 script / iframe / object / embed 标签
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '')
  cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  cleaned = cleaned.replace(/<object[\s\S]*?<\/object>/gi, '')

  // 移除 onclick / onload / onerror / on* 事件属性
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')

  // 移除 href / xlink:href 属性（潜在 XSS 向量）
  cleaned = cleaned.replace(/\s+(href|xlink:href)\s*=\s*["'][^"']*["']/gi, '')

  return cleaned
}

interface FigureRendererProps {
  svg: string
}

export default function FigureRenderer({ svg }: FigureRendererProps) {
  const sanitized = useMemo(() => sanitizeSvg(svg), [svg])

  if (!svg || svg.trim() === '') return null

  return (
    <div
      className="my-4 flex justify-center"
      dangerouslySetInnerHTML={{ __html: sanitized }}
      style={{ maxWidth: '100%' }}
    />
  )
}

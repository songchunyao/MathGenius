import { useMemo } from 'react'
import katex from 'katex'

/** 将文本中的 LaTeX 标记（\(...\) 和 \[...\]）替换为 HTML 渲染结果 */
function renderLatex(text: string): string {
  // 先处理行间公式 \[...\]
  let result = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, latex) => {
    try {
      return katex.renderToString(latex.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return `<span class="text-rose-500">[公式解析错误]</span>`
    }
  })
  // 再处理行内公式 \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, latex) => {
    try {
      return katex.renderToString(latex.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `<span class="text-rose-500">[公式解析错误]</span>`
    }
  })
  return result
}

interface MathTextProps {
  children: string
  className?: string
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3'
}

export default function MathText({ children, className = '', as: Tag = 'p' }: MathTextProps) {
  const html = useMemo(() => renderLatex(children), [children])

  if (!children) return null

  // 如果没有任何 LaTeX，直接返回纯文本（避免不必要的 danger）
  if (!children.includes('\\(') && !children.includes('\\[')) {
    return <Tag className={className}>{children}</Tag>
  }

  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

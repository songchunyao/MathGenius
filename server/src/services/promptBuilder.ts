import type { Grade, Semester, Difficulty } from '../types.js'
import { getGradeKnowledge } from './grades.js'

function difficultyLabel(d: Difficulty): string {
  const map: Record<Difficulty, string> = {
    easy: '基础',
    medium: '中等',
    hard: '较难',
  }
  return map[d]
}

function difficultyInstructions(d: Difficulty): string {
  switch (d) {
    case 'easy':
      return '\n- 考查基础概念和简单计算，步骤不超过2步\n- 数字较小，运算简单\n- 选项区分度高'
    case 'medium':
      return '\n- 考查综合应用，需2-3步推理\n- 包含常见易错点\n- 选项有迷惑性'
    case 'hard':
      return '\n- 考查灵活运用和抽象思维，需多步推理\n- 设置易错陷阱\n- 选项高度迷惑，需要仔细计算才能区分'
  }
}

export function buildSystemPrompt(grade: Grade, semester: Semester, count: number, difficulty?: Difficulty): string {
  const dif = difficulty ?? 'medium'
  const diffLabel = difficultyLabel(dif)
  return `你是一位中国小学数学（人教版）的出题老师。你的任务是输出 JSON，不要输出任何其他内容。

请严格按照以下 JSON 数组格式输出 ${count} 道 ${grade} 年级 ${semester} 的数学选择题，难度等级为「${diffLabel}」，不要加任何 markdown、注释或说明文字：

[
  {
    "category": "所属单元名称",
    "title": "简短标题",
    "prompt": "题目正文",
    "options": ["A", "B", "C", "D"],
    "answer": "正确选项（必须与 options 中某一项完全一致）",
    "explanation": "解题步骤和解析",
    "tip": "解题小提示",
    "figure": "",
    "difficulty": "${dif}"
  }
]

要求：
1. 覆盖指定的${diffLabel}难度要求${difficultyInstructions(dif)}
2. 符合${grade}年级学生认知水平
3. 答案必须精确匹配选项文字（包括单位、符号）
4. 选项设计要有区分度，错误选项要有迷惑性

配图要求（仅当题目需要配图时才输出 figure，否则留空字符串）：
- 几何图形（三角形、长方形、圆、数轴、时钟、对称轴等）必须输出 SVG 字符串到 figure 字段
- SVG 使用 viewBox，宽高不超过 300×200
- 只使用基础元素：<line>, <circle>, <rect>, <text>, <path>, <polygon>, <g>
- 线条用 stroke="#333" stroke-width="2"，标签用 fill="#333" font-size="14" text-anchor="middle"
- 节点标签用 <text> 标注字母或数值
- 不需要 xmlns 或 namespace 声明
- 不需要配图时 figure 设为空字符串 ""`
}

export function buildUserMessage(grade: Grade, semester: Semester, count: number, difficulty?: Difficulty, units?: string[]): string {
  const knowledge = getGradeKnowledge(grade, semester)
  const dif = difficulty ?? 'medium'
  const diffLabel = difficultyLabel(dif)
  let msg = `请为${grade}年级${semester}生成${count}道${diffLabel}难度的数学选择题。`

  if (knowledge) {
    msg += `\n\n本学期主要知识点包括：\n${knowledge.units.map(u => `- ${u}`).join('\n')}\n\n学期概述：${knowledge.summary}`

    if (units && units.length > 0) {
      msg += `\n\n请重点出以下单元的题目：\n${units.map(u => `- ${u}`).join('\n')}`
    }
  }

  msg += '\n\n请只输出 JSON 数组，不要包含任何其他文字或格式标记。'
  return msg
}

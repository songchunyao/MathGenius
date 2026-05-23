import type { Grade, Semester } from '../types'
import { getGradeKnowledge } from '../config/grades'

export function buildSystemPrompt(grade: Grade, semester: Semester, count: number): string {
  return `你是一位中国小学数学（人教版）的出题老师。你的任务是输出 JSON，不要输出任何其他内容。

请严格按照以下 JSON 数组格式输出 ${count} 道 ${grade} 年级 ${semester} 的数学选择题，不要加任何 markdown、注释或说明文字：

[
  {
    "category": "所属单元名称",
    "title": "简短标题",
    "prompt": "题目正文",
    "options": ["A", "B", "C", "D"],
    "answer": "正确选项（必须与 options 中某一项完全一致）",
    "explanation": "解题步骤和解析",
    "tip": "解题小提示"
  }
]

要求：
1. 覆盖该学期多个单元
2. 符合${grade}年级学生认知水平
3. 答案必须精确匹配选项文字（包括单位、符号）
4. 选项设计要有区分度，错误选项要有迷惑性`
}

export function buildUserMessage(grade: Grade, semester: Semester, count: number): string {
  const knowledge = getGradeKnowledge(grade, semester)
  let msg = `请为${grade}年级${semester}生成${count}道数学选择题。`

  if (knowledge) {
    msg += `\n\n本学期主要知识点包括：\n${knowledge.units.map(u => `- ${u}`).join('\n')}\n\n学期概述：${knowledge.summary}`
  }

  msg += '\n\n请只输出 JSON 数组，不要包含任何其他文字或格式标记。'
  return msg
}

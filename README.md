# MathGenius — 小学数学智能出题系统

基于 AI API 动态生成小学数学题目的交互式 Web 应用，支持 1-9 年级上下学期选择，题目由 AI 实时生成。

![首页截图](screenshots/题目练习界面.png)
*配置面板首页 — 选择年级、学期、题目数量和 AI 提供商*

## 功能

- **年级/学期选择** — 覆盖人教版 1-9 年级（小学 + 初中），上下学期自由切换
- **AI 动态出题** — 通过 DeepSeek 或智谱 GLM 的 API 实时生成数学选择题
- **自定义题量** — 每套练习可生成 1-50 道题
- **即时反馈** — 选择答案后立即显示对错、解析和解题提示
- **得分与连击** — 答对累积连击，激励持续专注
- **进度追踪** — 动态进度条和阶段激励
- **API 密钥本地保存** — 密钥仅存在浏览器中，每次使用无需重复输入

## 技术栈

| 技术 | 用途 |
|------|------|
| React 19 | UI 框架 |
| TypeScript ~6.0 | 类型安全 |
| Vite 8 | 构建工具 |
| Tailwind CSS v4 | 样式 |
| Framer Motion | 交互动画 |
| Lucide React | 图标 |
| DeepSeek / 智谱 GLM API | AI 题目生成 |

## 项目结构

```
src/
├── api/
│   └── provider.ts      # API 调用、JSON 解析、验证
├── components/
│   ├── ConfigPanel.tsx   # 配置面板（年级/学期/题量/API 设置）
│   └── LoadingView.tsx   # 加载状态（进度动画 + 错误处理）
├── config/
│   ├── constants.ts      # API 提供商配置和常量
│   └── grades.ts         # 1-9 年级知识点映射
├── data/
│   └── questions.ts      # 静态题库（备选/默认）
├── prompts/
│   └── templates.ts      # AI prompt 模板
├── types/
│   └── index.ts          # 共享类型定义
├── utils/
│   └── storage.ts        # localStorage 持久化
├── App.tsx               # 主组件（三阶段状态机）
├── main.tsx              # 入口
└── index.css             # 全局样式
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

## 使用说明

1. 打开应用后进入配置面板
2. 选择 **年级**（1-9）和 **学期**（上册/下册）
3. 拖动滑块调整 **题目数量**
4. 选择 **AI 提供商**（DeepSeek / 智谱 GLM）和对应模型
5. 输入 API 密钥（仅保存在本地浏览器）
6. 点击「开始生成」等待 AI 出题
7. 进入答题界面，选择答案后查看解析
8. 可随时「重新选题」切换配置

## AI API 配置

支持以下 AI 提供商：

- **DeepSeek** — 端点 `https://api.deepseek.com/chat/completions`
- **智谱 GLM** — 端点 `https://open.bigmodel.cn/api/paas/v4/chat/completions`

API 密钥需要从对应平台获取，应用仅在前端调用 API，密钥不会上传到其他服务器。

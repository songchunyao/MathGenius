# MathGenius — 中小学数学智能出题系统

基于 AI API 动态生成数学题目的交互式 Web 应用，支持 1-9 年级上下学期，涵盖知识点选择、难度调节、闯关地图与错题本等完整学习流程。

| 配置面板 | 闯关地图 | 答题界面 |
|---------|---------|---------|
| ![配置页](screenshots/00-config.png) | ![闯关地图](screenshots/02-stage-map.png) | ![答题界面](screenshots/01-quiz.png) |

## 功能

- **年级/学期选择** — 覆盖人教版 1-9 年级（小学 + 初中），上下学期自由切换
- **知识点筛选** — 按单元知识点精确选择练习范围
- **难度调节** — 支持基础/中等/较难三档难度，AI 按难度调整题目深度
- **AI 动态出题** — 通过 DeepSeek 或智谱 GLM 的 API 实时生成数学选择题，支持 SVG 几何配图
- **闯关地图** — 按知识点分组闯关，完成后一关才解锁下一关
- **即时反馈** — 选择答案后立即显示对错、解析、解题提示，支持 LaTeX 公式渲染（KaTeX）
- **生命值 + 连击系统** — 答错扣心、答对累积连击获得额外经验
- **闯关结果** — 成功/失败弹窗，带音效反馈和五彩纸屑
- **错题本** — 自动记录错题，支持重新作答和复习标记
- **管理员后台** — 题库管理、AI 追加生成、手动增删改题目

## 技术栈

| 层 | 技术 | 用途 |
|---|------|------|
| 前端 | React 19 + TypeScript ~6.0 | UI 框架 |
| 构建 | Vite 8 + Tailwind CSS v4 | 构建工具与样式 |
| 动画 | Framer Motion | 交互动画 |
| 图标 | Lucide React | 图标库 |
| 公式 | KaTeX | LaTeX 数学公式渲染 |
| 后端 | Express 5 | API 服务器 |
| 存储 | JSON 文件（sql.js） | 题目与用户数据持久化 |
| AI | DeepSeek / 智谱 GLM API | AI 题目生成 |

## 项目结构

```
math_test/
├── src/                        # 前端源码
│   ├── api/client.ts           # API 调用
│   ├── components/
│   │   ├── LoginPage.tsx       # 配置面板（年级/学期/难度/知识点）
│   │   ├── StageMap.tsx        # 闯关地图
│   │   ├── QuizView.tsx        # 答题界面
│   │   ├── StageResult.tsx     # 闯关结果弹窗
│   │   ├── CompletionScreen.tsx# 全部完成界面
│   │   ├── FigureRenderer.tsx  # SVG 配图渲染
│   │   ├── MathText.tsx        # LaTeX 公式渲染
│   │   ├── AuthPage.tsx        # 登录/注册
│   │   ├── UserDashboard.tsx   # 用户首页
│   │   ├── MistakeBook.tsx     # 错题本
│   │   ├── AdminDashboard.tsx  # 管理员后台
│   │   └── LoadingView.tsx     # 加载状态
│   ├── types/index.ts          # 共享类型定义
│   ├── App.tsx                 # 主组件（状态机）
│   └── main.tsx                # 入口
├── server/                     # 后端源码
│   └── src/
│       ├── index.ts            # 服务入口
│       ├── config.ts           # 环境配置
│       ├── db/index.ts         # JSON 存储层
│       ├── routes/             # API 路由
│       ├── middleware/         # 认证与缓存中间件
│       └── services/           # 业务逻辑
│           ├── generator.ts    # AI 生成引擎
│           ├── promptBuilder.ts# AI prompt 构建
│           ├── questionStore.ts# 题目管理
│           └── grades.ts       # 1-9 年级知识点映射
└── dist/                      # 构建产物
```

## 本地开发

### 前置要求

- Node.js ≥ 22
- npm

### 安装与运行

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 配置后端环境变量
cp server/src/services/.env.example server/src/services/.env
# 编辑 .env，填入 ADMIN_TOKEN 和 AI API 密钥

# 开发模式（后端）
cd server && npm run dev

# 开发模式（前端，新终端）
npm run dev
```

### 构建生产版本

```bash
npm run build            # 构建前端
cd server && npm run build  # 构建后端
```

## 使用说明

1. **登录/注册** — 首次使用需注册账号
2. **配置练习** — 选择年级、学期、难度和知识点范围
3. **闯关地图** — 按知识点分关，逐关攻克
4. **答题** — 选择答案，查看解析，答错扣心，答对连击
5. **闯关结算** — 成功获得金币并解锁下一关，失败可重试
6. **错题本** — 自动收录错题，支持复习巩固

## AI API 配置

在 `server/src/services/.env` 中配置：

```env
ADMIN_TOKEN=your_admin_password
AI_PROVIDER=deepseek      # 或 glm
DEEPSEEK_API_KEY=sk-xxx
# GLM_API_KEY=xxx         # 使用智谱时填写
```

## 部署

项目部署在阿里云 ECS（CentOS），使用 nginx 反向代理。

```bash
# 构建并部署
npm run build
scp -i your_key.pem dist/* root@server:/var/www/math-test/
# 重启后端
pm2 restart math-test-api
```

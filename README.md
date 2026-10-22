# Course Skill

这是一个高级课程产品制作 Skill。它旨在指导从 0 到 1 策划并制作高品质的各类课程与辅导材料（包括公开课、实战课、录播课、迷你课、晋升/面试辅导等），支持多版本管理与多视角评估。录播课:与三节课等平台合作的线上课,1–8 小时、8–20 分钟章节;course-skill 管到脚本层(选题/大纲/讲义/PPT文稿/录制脚本),视频录制/剪辑留给人。

## 目录结构

```text
.
├── .githooks/                # Git 钩子（post-commit 自动回填 revision）
├── AGENTS.md                 # 版本自检协议与维护约束（供 Codex / Trae / Cursor 等读取）
├── SKILL.md                  # Skill 的核心入口与主控逻辑（含启用前版本自检）
├── CHANGELOG.md              # 版本变更日志（版本号 → 变更映射）
├── README.md                 # 本文件
├── phases/                   # 6 大核心执行阶段
│   ├── phase-0-explore.md    # 探索与挑战（确认时长、规范、定位、演进位置；应用架构课需先探索代码架构）
│   ├── phase-1-spine.md      # 决定主心骨（主线结构、演进路线决策、附录思考题决策）
│   ├── phase-2-cases.md      # 构建证据系统（双轨+演进线+候选题，调研通道规范）
│   ├── phase-3-produce.md    # 资产生产（初稿撰写，含演进路线段+附录思考题写作规范）
│   ├── phase-4-sync.md       # 一致性对齐（L1-L4 分层同步）
│   └── phase-5-review.md     # 审查与审计（视角 A-I + 四专家，含应用架构课专项审查）
├── references/               # 规范与参考指南
│   ├── anti-patterns.md      # 反模式（绝对禁止的写法）
│   ├── architecture-case-writing.md # 架构案例分析书写作规范（李智慧风格基准，管结构）
│   ├── architecture-course.md # 实战课·应用架构专项方法论（含读者假设与叙述基调）
│   ├── architecture-narrative.md # 架构叙述方式规范（八大病灶，管句段级叙述质量）
│   ├── code-reference-feishu.md # 应用架构课代码引用规范（飞书兼容，双锚点法）
│   ├── core-principles.md    # 核心原则（含应用架构课专项原则）
│   ├── diagram-integration.md # 制图规范（v2svg 驱动）
│   ├── domain-adaptation.md  # 领域适配指南（新领域使用）
│   ├── evolution-roadmap.md  # 架构演进路线方法论（S0-S4 模型+工业案例规范）
│   ├── human-prose.md        # 活人感写作层（材料门/说话位置/动作级禁令/中文力学/改稿顺序）
│   ├── interview-questions.md # 附录深入思考题方法论（三质量维度+候选题路径+写作规范）
│   ├── multi-track-production.md # 多版本生产规范（教学代码生产级门禁）
│   ├── quality-guide.md      # 品质提升指南（去 AI 腔、三产物规范、小节标题命名）
│   └── templates.md          # 常用模板
├── examples/                 # 风格锚点样本（动笔前的质感对齐）
│   └── architecture-style-anchor.md # 李智慧式写作样本（开场/演进叙事/小结/语言质感）
└── subagents/                # 辅助子 Agent 设定
    ├── code-reviewer.md     # 代码审查专家（技术栈自适应）
    ├── expression-coach.md   # 表达教练（语调/张力/排版/制图(v2svg)/演进路线/思考题表达）
    ├── tech-evangelist.md   # 技术布道师（讲义技术准确性与代码一致性、关联阅读来源验证、应用架构课代码引用校验）
    └── 运营专员.md           # 运营专员（标题吸引力/痛点清晰度/转化钩子/物料可用性）
```

## 如何使用

在支持 Agent Skill 的 IDE（如 Trae）中，当用户意图涉及"写讲义"、"做大纲"、"课程策划"时，Agent 会自动触发此 Skill。

你也可以通过显式指令调用：
```text
Use Skill: course-skill 帮我为《XX实战课》写一份讲义
Use Skill: course-skill 帮我为《XX公开课》写一份课程大纲
```

### Skill 依赖
- **联网调研**：Phase 2 与候选题检索走零依赖通道（WebSearch 检索 + `r.jina.ai` 取正文），见 `references/evolution-roadmap.md` §3.4。
- **architecture-case-writing**：创作架构案例分析书等长文档时，遵循该 reference 的写作规范（风格基准为李智慧《大型网站技术架构》）。
- **architecture-narrative + architecture-style-anchor**：架构类长文档（应用架构课、架构书）的叙述质量配套——narrative 定八大病灶检查标准，anchor 给动笔前的质感参照样本。

### 架构案例分析书
从一组场景题/素材创作架构案例分析书时，触发 course-skill 并遵循 `references/architecture-case-writing.md` 的六步生产流程（场景拆解 → 案例调研 → 大纲设计 → 分章撰写 → 合并统稿 → 质量审查）。

## 贡献与维护

本 Skill 作为一个独立的 Git Submodule 维护。如需修改课程生产的底层逻辑、Prompt 或排版规范，请直接在此仓库中提交 PR。

### 维护脚本

| 脚本 | 用途 | 什么时候跑 |
|:--|:--|:--|
| `scripts/course-lint.mjs` | 产物红线闸门（scan / structure / kiss） | Phase 5 开审前 |
| `scripts/ownership-scan.mjs` | **规范自身**的跨文件近似重复扫描（判据「多安家」检测） | 新增或大改 reference / phase / subagent 之后 |

`ownership-scan` 的用法：`node scripts/ownership-scan.mjs [--min-sim 0.72] [--json]`，默认扫 `SKILL.md + references/ + phases/ + subagents/`。它只**发现**疑似重复，裁决仍靠人——`速查 + 指针` 是合理分工，报告模板的结构对称（各 subagent 填同样格式）也不是重复。命中区分为「跨文件（需裁决）/ 模板对称 / 同文件」三类，可据此快速筛掉噪声。

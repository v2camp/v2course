# Course Skill 仓库指南

本文件为 AI 编码工具（如 Codex、Trae、Cursor）提供操作指引，并承载本技能的版本状态、启用前自检协议与维护约束。

## 当前版本：v4.3.0

| 字段 | 值 |
|:---|:---|
| version | 4.3.0（以 `SKILL.md` frontmatter 为准） |
| revision | 02c9384 |
| 最近变更 | 见 `CHANGELOG.md` 最新条目 |

## 启用前自检协议

任何 agent 加载本技能、准备产出内容前，必须先执行版本自检：

1. 读取 `SKILL.md` frontmatter 的 `version` 字段；
2. 读取 `CHANGELOG.md` 最新一条目，摘出最近变更要点；
3. 读取本文件「当前版本」表的 `revision`；
4. 向用户汇报：`course-skill v<版本号>（revision <hash>）· 最近变更：<要点>`；
5. 若用户期望的版本与汇报不一致（如用户以为已升级、实际加载的是旧目录），停止产出并提示先同步技能目录。

## 维护约束（升级者必读）

每次升级技能必须三处同步，缺一不可：

1. `SKILL.md` frontmatter `version` 递增（semver：破坏性变更 → major，新增 → minor，修正 → patch）；
2. `CHANGELOG.md` 顶部新增条目（版本号 + 日期 + 变更要点；破坏性变更单列标注）；
3. 本文件「当前版本」段同步更新版本号与变更指引；`revision` 由 `.githooks/post-commit` 在升级提交后自动回填，无需人工操作。

升级完成后核对：三处版本号一致、`revision` 已自动回填、CHANGELOG 与 SKILL.md 变更一一对应。

### 钩子安装（新机器 / 新克隆执行一次）

```bash
git config core.hooksPath .githooks
```

钩子行为：提交触及 `SKILL.md` 或 `CHANGELOG.md`（视为技能升级）时，自动将 `AGENTS.md` 的 `revision` 更新为该提交 hash，并追加一个回填提交；其他提交不触发。回填提交经环境变量防递归，不产生回填套回填。

### revision 语义与版本核对

`revision` 指向最近一次升级（版本号递增）所在提交的 hash，回填提交在其后追加。核对技能目录是否已包含某次升级：

```bash
git merge-base --is-ancestor <revision> HEAD   # 退出码 0 = 已包含
```

## 目录结构

```text
course-skill/
├── AGENTS.md      # 本文件：版本自检协议与维护约束
├── SKILL.md       # 技能入口：主控逻辑 + 启用前版本自检
├── CHANGELOG.md   # 版本变更日志
├── phases/        # 6 大核心执行阶段
├── references/    # 规范与参考指南
├── examples/      # 风格锚点样本
└── subagents/     # 辅助子 Agent 设定
```

## 升级与发布

本技能为独立 git submodule，远程 `git@github.com:hl85/course-skill.git`。改动在子仓库内单独提交并推送；主仓库仅更新指针（见主仓库 AGENTS.md「任务生命周期」）。

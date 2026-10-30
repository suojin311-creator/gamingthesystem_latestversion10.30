# Gaming the System

这是你独立维护的游戏源码仓库。默认入口包含开头、Level 1–3、ending 和 Padlet Design Lab。

## 启动

安装 Node.js 22.18+（推荐 24 LTS），在本目录执行：

```bash
npm ci --ignore-scripts
npm run dev
```

打开终端显示的网址。首次启动会从仓库内的素材生成四段动画，耗时比后续启动长。游戏不需要账号密钥或 `.env`；Padlet 需要联网及看板本身的访问权限。

## 修改位置

| 内容 | 位置 |
| --- | --- |
| 完整游戏入口和关卡衔接 | `src/FullGame.tsx`、`src/Gameplay.tsx` |
| 开头动画、标题、玩家姓名 | `src/cinematics/opening/` |
| 三个关卡操作界面、规则和文案 | `src/levels/level1/`、`level2/`、`level3/` |
| 共用卡片、对话框、字体、颜色 | `src/shared/` |
| 关卡动画接入及与游戏状态的连接 | `src/cinematics/level1/`、`level2/`、`level3/` |
| 动画排版、字幕、节奏和转场适配 | `scripts/level1-settlement/`、`level2-animation/`、`level3-animation/` |
| ending 动画和文字时间线 | `scripts/ending-animation/` |
| 同伴动画的原始依赖和图片 | `scripts/level1-source/`、`level2-source/`、`level3-source/`、`ending-source/` |
| Padlet 链接及嵌入容器 | `src/design-lab/PadletLab.tsx` |
| 音效和可选音乐 | `src/audio/` |
| 补充的动画素材 | `revision-assets/` |

优先修改适配层，避免直接改动画原始依赖。`scripts/` 中部分历史审阅工具依赖原仓库环境，保留作参考；日常使用本页列出的 npm 命令。

## 检查与打包

```bash
npm run check
npm test
npm run build
```

- `npm run check`：TypeScript 检查。
- `npm test`：现有规则、文案和动画节奏检查。
- `npm run build`：生成完整游戏 `dist/index.html`。
- `npm run preview`：本地查看构建后的游戏。
- `npm run dev:level1` / `dev:level2` / `dev:level3`：单关开发。
- `npm run package:previews`：生成四个入口和六份 ZIP，在 `play/` 中。
- `npm run test:release`：打包后验证实际 ZIP，需要另装 Python Playwright 和 Chromium。

ZIP 打包另外需要 Python 3；普通开发启动不需要旧版 Design Lab 服务。

`node_modules/`、动画生成缓存、`dist*/`、`play/`、本地测试产物不提交到 Git。打包不等于上线；此仓库目前没有自动发布流程。当前完整试玩 ZIP 约 132 MiB，超过 GitHub 普通单文件提交上限，应通过 Release 附件或下载托管交付；后续网页发布还需要资源加载优化。

## 音乐与素材

同伴交接包没有包含 `src/audio/assets/gymnopedie-no1.mp3`。现在缺少该文件时仍可启动和打包：不播放背景音乐、不显示音乐按钮，原有音效保留。只有你在本地恢复有使用权限的同名录音后，音乐才会重新接入；不会自动下载或替换歌曲。

本次补回了 30 个交接包遗漏的图片文件，来自我们已有的动画源文件与旧正式版，来源版本和 SHA-256 见 [素材恢复记录](docs/RESTORED_ASSETS.json)。这些记录说明恢复来源，不代表完成版权核验；原交接中的素材说明保留在 [ASSET_REVIEW.md](ASSET_REVIEW.md)。

## 交接记录

- [本次目录整理和检查报告](docs/REPOSITORY_REVIEW.md)
- [同伴原始交接说明](docs/ORIGINAL_HANDOFF.md)
- `COPY_AUDIT.json`：同伴交接清单，原样保留，不作为整理后文件的实时清单。

整理前上传版本已保留在 Git 提交历史及 `backup/manual-upload-20261031` 标签中。

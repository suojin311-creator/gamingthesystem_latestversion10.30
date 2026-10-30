# 动画交接入口

当前任务按用户补充说明，以游戏实际使用的动画代码、素材和路径完整性为重点；不再扩大游戏流程、流畅度或产品验收检查。游戏部分的最新版由用户另行掌握。本次没有用旧版玩法代码覆盖新版本。

## 动画在哪里改

| 部分 | 编辑入口 | 原始素材/依赖 | 当前状态 |
| --- | --- | --- | --- |
| 开头、办公室与课堂、Alex 介绍 | `src/cinematics/opening/`（含 `Opening.tsx`、`ClassroomScene.tsx`、`AlexEncounter.tsx`） | 同目录 `assets/`；`revision-assets/references/alex/` | 源码可读取；集成构建成功；开发入口图片成功解码 |
| Level 1 六种 metric 结局 | `scripts/level1-settlement/`；接入在 `src/cinematics/level1/` | `scripts/level1-source/`；`revision-assets/level1/` | 源码、素材可读取；动画构建成功 |
| Level 2 三个/六个/100 metrics | `scripts/level2-animation/`；100 metrics 节奏在 `scripts/metric100-preview/pacing.mjs`；接入在 `src/cinematics/level2/` | `scripts/level2-source/`；`revision-assets/level2/` | 源码、素材可读取；动画构建成功 |
| Level 3A 按 metric 和 effort 配对的场景 | `scripts/level3-animation/`；游戏映射在 `src/cinematics/level3/mapping.mjs` | `scripts/level3-source/` | 源码、素材可读取；动画构建成功；不是 Level 3B |
| Ending、回忆、最后文案与 Padlet 按钮事件 | `scripts/ending-animation/Composition.jsx`、`timeline.mjs`、`film.css`、`preview-entry.jsx`；接入在 `src/cinematics/ending/` | `scripts/ending-source/`；部分 Level 3A 依赖 | 源码、素材可读取；动画构建成功 |
| 共同字幕色、身份、转场 | `src/shared/data/cinematicPalette.js`、`professorLabel.js`；`scripts/cinematic-dissolve.mjs` | 对应关卡适配层 | 路径已恢复 |

## 如何单独检查动画资源能否构建

```bash
npm ci --ignore-scripts
npm run cinematic:prepare
```

四段动画生成到 `node_modules/.cache/` 下的 `level1-cinematic/`、`level2-cinematic/`、`level3-cinematic/`、`ending-cinematic/`。首次运行从本仓库素材构建，后续会按源码哈希核对缓存；不需要同伴的电脑路径或外部私有仓库。开头是集成的 React 场景，不属于这四个内嵌 HTML。

## 完整性的边界

- 本次恢复目标是当前游戏使用的动画依赖，不是同伴所有未使用场景或完整历史制作工程。
- 已补回的 30 张图片来自我们保留的旧正式版/动画源文件。来源版本与哈希在 `RESTORED_ASSETS.json`，没有覆盖交接包中已经存在的图片。但交接包没有提供这些缺失图片的新版哈希，无法证明同伴最新版本没有改过它们；如同伴改过同名图片，需以他新提供的素材替换。
- 同伴明确排除的 MP3 是背景录音，不属于缺少动画画面；当前缺少该录音仍可生成动画和构建游戏。
- 构建通过证明当前依赖能够解析、生成，不代表逐帧审美或所有镜头已人工审核。
- 运行说明和历史检查结果已保留；后续不以额外试玩包或游戏全流程检查作为本次整理的交付要求。

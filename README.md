# AI-generated-recording-software

**大数据竞赛程序记录软件** —— 支持文字、图片、视频等多媒体内容导入与管理的记录工具，紫色霓虹流动波纹背景，支持自定义样式。

项目以**同一套代码运行两种形态**：

| 形态 | 说明 | 存储 |
|---|---|---|
| 🌐 **网页版** | Next.js 全栈应用（浏览器访问） | 项目目录 `uploads/`（API + 文件系统） |
| 🖥️ **桌面版（Windows）** | Tauri 2 桌面软件（.exe 安装包） | 应用数据目录 `uploads/`（Rust 直接读写文件） |

> 两形态通过 `src/lib/storage-client.ts` 适配层自动切换，前端代码共用。

---

## ✨ 功能特性

- 📝 **多媒体记录**：文字（富文本：字体/颜色/加粗/下划线/自定义字体导入）、图片、视频
- ✏️ **编辑与删除**：记录可随时修改（与添加共用同一富文本编辑器，格式不丢失）
- 📅 **日期筛选**：中文日历弹层，按天筛选记录；底部显示公历/农历日期
- 🔍 **标题搜索**：放大镜图标切换搜索栏
- 📊 **网格/列表双视图**：卡片紧凑布局切换
- 📤 **导出功能**：按天/周/月/年导出 zip（文字转 Word 且保留富文本格式，媒体原格式导出）
- 🎨 **样式定制**：预设主题（紫夜霓虹/极光幻境/赛博朋克/深海幽光/烈焰星辰）+ 自由取色 + 动画速度/透明度/模糊/字号/圆角调节
- ✨ **可编辑标题**：点击标题即可改名（持久化），颜色随主题色；副标题为霓虹渐变 + 鼠标闪光跟随
- 💾 **数据落盘**：所有记录以真实文件存储（images/videos/texts + index.json），可备份、可迁移

## 🚀 网页版开发

环境要求：Node.js 20+、pnpm 9+

```bash
pnpm install        # 安装依赖
pnpm dev            # 启动开发服务器（http://localhost:5000）
pnpm build          # 生产构建
pnpm start          # 启动生产服务器
```

网页版数据存储在项目根 `uploads/` 目录（已被 git 忽略）。

## 🖥️ 桌面版（Windows）构建

### 环境要求

- Rust 工具链（[rustup](https://rustup.rs)）
- Visual Studio Build Tools（勾选「C++ 桌面开发」，用于 Rust MSVC 链接）
- WebView2 Runtime（Win10/11 一般自带）
- Node.js 20+、pnpm 9+

### 构建安装包

```bash
pnpm install
pnpm tauri:build
```

产物位于：

```
src-tauri/target/release/bundle/nsis/大数据竞赛程序记录_1.0.0_x64-setup.exe   # 安装向导
```

### 桌面版数据位置

```
C:\Users\<用户名>\AppData\Roaming\com.bigdata.recorder\uploads\
├── images\   videos\   texts\   index.json
```

> 桌面版使用 Tauri 命令（Rust）直接读写本地文件，不依赖任何网络服务。

### 构建原理说明

- 前端使用 `output: 'export'` 静态导出（见 `next.config.tauri.ts`）
- 静态导出与 API 路由不兼容，构建脚本 `scripts/build-tauri.mjs` 会在构建期间临时隐藏 `src/app/api` 与 `src/app/uploads`，完成后自动恢复
- 桌面版存储能力由 Rust 后端提供（`src-tauri/src/main.rs` 中的 Tauri 命令）

## 📁 目录结构

```
├── src/
│   ├── app/                  # 页面（page.tsx 主页、api/ 存储接口）
│   ├── components/           # 组件（RichTextEditor 富文本、MediaImporter 导入、MediaCard 卡片等）
│   ├── lib/                  # 工具库（storage.ts 存储层、storage-client.ts 双环境适配、exportUtils 导出）
│   └── hooks/
├── scripts/
│   ├── dev.sh / build.sh     # 网页版脚本
│   └── build-tauri.mjs       # 桌面版前端导出脚本
├── src-tauri/                # Tauri 桌面壳（Rust）
│   ├── src/main.rs           # 存储命令：get_records / save_text / save_file / delete_record / update_record / save_title / read_file_bytes
│   ├── tauri.conf.json
│   └── capabilities/
└── uploads/                  # 运行时数据（git 忽略）
```

## 🛠️ 技术栈

- **框架**: Next.js 16 (App Router) / React 19 / TypeScript 5
- **桌面壳**: Tauri 2（Rust），插件：dialog / fs / protocol-asset
- **UI**: shadcn/ui + Tailwind CSS v4 + Lucide React
- **富文本**: contentEditable + execCommand（轻量自研）
- **导出**: docx / jszip / file-saver（桌面版走 Tauri 原生保存对话框）
- **农历**: lunar-javascript
- **包管理器**: pnpm 9+（强制）

## 📌 开发规范

1. **必须使用 pnpm**（`preinstall` 脚本强制）
2. **存储层改动**需同时考虑双环境：`src/lib/storage.ts`（网页 API）与 `src-tauri/src/main.rs`（桌面命令）保持接口一致
3. 前端数据读写统一走 `src/lib/storage-client.ts`，禁止直接 fetch /api（桌面版无服务器）
4. **类型检查**：`pnpm ts-check`；**桌面编译检查**：`cd src-tauri && cargo check`
5. 桌面版迭代在 `feat/tauri-desktop` 分支进行，稳定后合并回 `main`

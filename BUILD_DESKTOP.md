# Windows 桌面版构建指南

## 环境准备

### 1. 安装 Rust
从 https://rustup.rs 下载并运行安装程序，按默认选项安装即可。

安装完成后验证：
```bash
rustc --version
cargo --version
```

### 2. 安装 Node.js
从 https://nodejs.org 下载 LTS 版本（≥20）安装。

### 3. 安装 pnpm
```bash
npm install -g pnpm
```

### 4. 安装项目依赖
```bash
pnpm install
```

### 5. 安装 Tauri CLI
```bash
pnpm add -D @tauri-apps/cli
```

### 6. 安装 Visual Studio Build Tools（Windows 必需）
从 https://visualstudio.microsoft.com/visual-cpp-build-tools/ 下载，安装时勾选「C++ 桌面开发」。

## 构建

### 开发模式（热更新）
```bash
pnpm tauri:dev
```

### 生产构建（生成 .exe 安装包）
```bash
pnpm tauri:build
```

构建产物位于：
- `src-tauri/target/release/bundle/nsis/*.exe` — Windows 安装包
- `src-tauri/target/release/bundle/msi/*.msi` — MSI 安装包

## 注意事项

- 桌面版数据存储在应用数据目录（AppData/Roaming/com.bigdata.recorder/uploads），与网页版数据不互通
- 构建后的 .exe 约 5-10MB，远小于 Electron 方案
- 后续扩展 Mac 版只需在 Mac 上执行同样的构建命令

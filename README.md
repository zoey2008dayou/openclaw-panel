# OpenClaw Panel

面向非技术用户的 OpenClaw 桌面配置面板。

## 功能

- 🔍 **OpenClaw 安装检测** — 自动检测已安装的 OpenClaw 版本
- 🤖 **模型配置** — 支持 OpenAI、Anthropic、Qwen、本地模型
- 📱 **飞书通道** — 配置飞书机器人连接
- 🖥️ **Gateway 管理** — 一键启动/停止/重启 Gateway 服务

## 技术栈

- **前端**: React 19 + Tailwind CSS 4
- **后端**: Tauri 2.x (Rust)
- **打包**: 跨平台桌面应用

## 本地开发

### 前置条件

1. **Node.js** 22+
2. **pnpm** 10+
3. **Rust** (latest stable)
4. **系统依赖** (Linux):
   ```bash
   sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
   ```

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

### 构建

```bash
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`

## 多平台构建

### GitHub Actions 自动构建

1. **发布版本**: 推送 tag 触发
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. **手动构建**: 在 GitHub Actions 页面点击 "Run workflow"

### 构建产物

| 平台 | 格式 |
|------|------|
| Windows | `.msi`, `.exe` |
| macOS | `.dmg`, `.app` |
| Linux | `.deb`, `.rpm`, `.AppImage` |

## 项目结构

```
openclaw-panel/
├── src/                    # React 前端
│   ├── pages/              # 页面组件
│   ├── components/         # 通用组件
│   └── App.tsx
├── src-tauri/              # Tauri 后端
│   ├── src/commands/       # Tauri 命令
│   └── src/models/         # 数据模型
└── .github/workflows/      # CI/CD 配置
```

## License

MIT
/**
 * Tauri 桌面版专用前端构建脚本（跨平台，Node 实现）
 *
 * 背景：
 * 1. tauri.conf.json 的 frontendDist 指向 ../out（Next 静态导出产物）
 * 2. 静态导出模式（output: 'export'）与 API 路由不兼容，因此构建期间
 *    临时隐藏 src/app/api 与 src/app/uploads，构建完成后自动恢复
 * 3. 构建使用 next.config.tauri.ts（静态导出配置），结束后恢复 next.config.ts
 */
import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from 'fs';
import { execSync } from 'child_process';

const hiddenDirs = [];

function restore() {
  for (const d of hiddenDirs) {
    const target = `src/_tauri-hide/${d.replace('src/app/', '')}`;
    if (existsSync(target)) renameSync(target, d);
  }
  rmSync('src/_tauri-hide', { recursive: true, force: true });
  if (existsSync('next.config.ts.bak')) renameSync('next.config.ts.bak', 'next.config.ts');
}

process.on('exit', restore);
process.on('SIGINT', () => {
  restore();
  process.exit(130);
});

// 1. 临时隐藏 API 路由（静态导出不兼容）。
//    注意：必须移到 src/app 之外（如 src/_tauri-hide/），否则仍会被当作路由收集
mkdirSync('src/_tauri-hide', { recursive: true });
for (const d of ['src/app/api', 'src/app/uploads']) {
  if (existsSync(d)) {
    const target = `src/_tauri-hide/${d.replace('src/app/', '')}`;
    renameSync(d, target);
    hiddenDirs.push(d);
    console.log(`[build-tauri] temporarily hidden: ${d} -> ${target}`);
  }
}

// 2. 切换到 Tauri 静态导出配置
cpSync('next.config.ts', 'next.config.ts.bak');
cpSync('next.config.tauri.ts', 'next.config.ts');

// 3. 清理旧构建缓存（dev 模式生成的类型缓存会残留对 API 路由的引用）
rmSync('.next', { recursive: true, force: true });
console.log('[build-tauri] cleared .next cache');

// 4. 静态导出构建
console.log('[build-tauri] running next build (static export)...');
execSync('pnpm next build', { stdio: 'inherit' });

console.log('[build-tauri] frontend build completed: out/');

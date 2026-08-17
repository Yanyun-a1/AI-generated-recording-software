#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

/// 媒体记录（与网页版 src/lib/types.ts 的 MediaItem 对应）
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MediaItem {
    id: String,
    /// text | image | video
    #[serde(rename = "type")]
    kind: String,
    /// 文字：原文内容；图片/视频：相对路径 uploads/<dir>/<file>
    content: String,
    title: String,
    created_at: u64,
}

/// 样式配置（与网页版 StyleConfig 对应）
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct StyleConfig {
    primary_color: String,
    secondary_color: String,
    accent_color: String,
    animation_speed: f64,
    panel_opacity: f64,
    panel_blur: u32,
    font_size: u32,
    border_radius: u32,
}

impl Default for StyleConfig {
    fn default() -> Self {
        StyleConfig {
            primary_color: "#8b5cf6".into(),
            secondary_color: "#ec4899".into(),
            accent_color: "#06b6d4".into(),
            animation_speed: 1.0,
            panel_opacity: 0.12,
            panel_blur: 20,
            font_size: 14,
            border_radius: 16,
        }
    }
}

/// 存储数据（uploads/index.json，与网页版一致）
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct StoreData {
    items: Vec<MediaItem>,
    style: StyleConfig,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn uploads_root(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {e}"))?;
    Ok(dir.join("uploads"))
}

fn ensure_dirs(app: &AppHandle) -> Result<PathBuf, String> {
    let root = uploads_root(app)?;
    for sub in ["images", "videos", "texts"] {
        fs::create_dir_all(root.join(sub)).map_err(|e| format!("创建目录失败: {e}"))?;
    }
    Ok(root)
}

fn read_store(app: &AppHandle) -> Result<StoreData, String> {
    let root = ensure_dirs(app)?;
    let file = root.join("index.json");
    if !file.exists() {
        return Ok(StoreData {
            items: vec![],
            style: StyleConfig::default(),
        });
    }
    let raw = fs::read_to_string(&file).map_err(|e| format!("读取 index.json 失败: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("解析 index.json 失败: {e}"))
}

fn write_store(app: &AppHandle, data: &StoreData) -> Result<(), String> {
    let root = ensure_dirs(app)?;
    let json =
        serde_json::to_string_pretty(data).map_err(|e| format!("序列化失败: {e}"))?;
    fs::write(root.join("index.json"), json).map_err(|e| format!("写入 index.json 失败: {e}"))
}

/// 读取全部记录与样式
#[tauri::command]
fn get_records(app: AppHandle) -> Result<StoreData, String> {
    read_store(&app)
}

/// 保存样式
#[tauri::command]
fn save_style(app: AppHandle, style: StyleConfig) -> Result<(), String> {
    let mut data = read_store(&app)?;
    data.style = style;
    write_store(&app, &data)
}

/// 新增文字记录：内容落盘为 texts/<id>.md
#[tauri::command]
fn save_text(app: AppHandle, title: String, content: String) -> Result<MediaItem, String> {
    if content.trim().is_empty() {
        return Err("内容不能为空".into());
    }
    let id = Uuid::new_v4().to_string();
    let root = ensure_dirs(&app)?;
    fs::write(root.join("texts").join(format!("{id}.md")), &content)
        .map_err(|e| format!("写入文字文件失败: {e}"))?;

    let item = MediaItem {
        id,
        kind: "text".into(),
        content,
        title: if title.trim().is_empty() { "文字记录".into() } else { title },
        created_at: now_ms(),
    };
    let mut data = read_store(&app)?;
    data.items.insert(0, item.clone());
    write_store(&app, &data)?;
    Ok(item)
}

/// 新增图片/视频记录：二进制落盘为 images|videos/<id>.<ext>
#[tauri::command]
fn save_file(
    app: AppHandle,
    title: String,
    kind: String,
    ext: String,
    data: Vec<u8>,
) -> Result<MediaItem, String> {
    let dir_name = match kind.as_str() {
        "image" => "images",
        "video" => "videos",
        _ => return Err("仅支持 image 或 video".into()),
    };
    if data.is_empty() {
        return Err("文件内容为空".into());
    }
    let id = Uuid::new_v4().to_string();
    let fname = format!("{id}.{ext}");
    let root = ensure_dirs(&app)?;
    fs::write(root.join(dir_name).join(&fname), &data)
        .map_err(|e| format!("写入文件失败: {e}"))?;

    let item = MediaItem {
        id,
        kind,
        content: format!("uploads/{dir_name}/{fname}"),
        title,
        created_at: now_ms(),
    };
    let mut data = read_store(&app)?;
    data.items.insert(0, item.clone());
    write_store(&app, &data)?;
    Ok(item)
}

/// 删除记录：同步删除索引与实体文件
#[tauri::command]
fn delete_record(app: AppHandle, id: String) -> Result<(), String> {
    let mut data = read_store(&app)?;
    let Some(pos) = data.items.iter().position(|i| i.id == id) else {
        return Err("记录不存在".into());
    };
    let item = data.items.remove(pos);
    let root = ensure_dirs(&app)?;
    match item.kind.as_str() {
        "text" => {
            let _ = fs::remove_file(root.join("texts").join(format!("{}.md", item.id)));
        }
        _ => {
            if let Some(rel) = item.content.strip_prefix("uploads/") {
                let _ = fs::remove_file(root.join(rel));
            }
        }
    }
    write_store(&app, &data)
}

/// 更新记录（标题；文字记录同时更新内容并重写 texts/<id>.md）
#[tauri::command]
fn update_record(
    app: AppHandle,
    id: String,
    title: String,
    content: String,
) -> Result<(), String> {
    let mut data = read_store(&app)?;
    let Some(item) = data.items.iter_mut().find(|i| i.id == id) else {
        return Err("记录不存在".into());
    };
    item.title = title;
    if item.kind == "text" {
        item.content = content.clone();
        let root = ensure_dirs(&app)?;
        fs::write(root.join("texts").join(format!("{id}.md")), &content)
            .map_err(|e| format!("更新文字文件失败: {e}"))?;
    }
    write_store(&app, &data)
}

/// 读取 uploads/ 内的文件字节（导出用），带路径穿越防护
#[tauri::command]
fn read_file_bytes(app: AppHandle, path: String) -> Result<Vec<u8>, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {e}"))?;
    let clean = path.trim_start_matches('/');
    let full = dir.join(clean);
    let uploads = dir.join("uploads");
    if !full.starts_with(&uploads) {
        return Err("非法路径".into());
    }
    fs::read(&full).map_err(|e| format!("读取文件失败: {e}"))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_records,
            save_style,
            save_text,
            save_file,
            delete_record,
            update_record,
            read_file_bytes
        ])
        .run(tauri::generate_context!())
        .expect("启动应用失败");
}

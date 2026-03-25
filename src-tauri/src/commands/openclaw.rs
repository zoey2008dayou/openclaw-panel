use std::process::Command;
use std::env;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenClawInfo {
    pub installed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

#[tauri::command]
pub fn check_openclaw_installed() -> Result<OpenClawInfo, String> {
    // 收集所有可能存在的 openclaw 路径
    let mut paths_to_check: Vec<PathBuf> = Vec::new();
    
    // 1. 从 PATH 环境变量获取
    if let Ok(path_env) = env::var("PATH") {
        let separator = if cfg!(target_os = "windows") { ";" } else { ":" };
        for dir in path_env.split(separator) {
            let openclaw_path = PathBuf::from(dir).join("openclaw");
            if openclaw_path.exists() {
                paths_to_check.push(openclaw_path);
            }
        }
    }
    
    // 2. 常见全局安装位置
    let home = env::var("HOME").unwrap_or_else(|_| "/root".to_string());
    let common_paths = vec![
        // npm 全局
        format!("{}/.npm-global/bin/openclaw", home),
        format!("{}/npm-global/bin/openclaw", home),
        // pnpm 全局
        format!("{}/.local/share/pnpm/openclaw", home),
        format!("{}/.local/bin/openclaw", home),
        format!("{}/Library/pnpm/openclaw", home), // macOS
        // yarn 全局
        format!("{}/.yarn/bin/openclaw", home),
        format!("{}/.config/yarn/global/node_modules/.bin/openclaw", home),
        // nvm
        format!("{}/.nvm/versions/node/*/bin/openclaw", home),
        // fnm
        format!("{}/.fnm/*/bin/openclaw", home),
        // volta
        format!("{}/.volta/bin/openclaw", home),
        // 系统路径
        "/usr/local/bin/openclaw".to_string(),
        "/usr/bin/openclaw".to_string(),
        "/opt/homebrew/bin/openclaw".to_string(), // macOS Apple Silicon
    ];
    
    for path in common_paths {
        let p = PathBuf::from(&path);
        if p.exists() && !paths_to_check.contains(&p) {
            paths_to_check.push(p);
        }
    }
    
    // 3. glob 展开 nvm/fnm 路径
    let glob_patterns = vec![
        format!("{}/.nvm/versions/node/*/bin/openclaw", home),
        format!("{}/.fnm/*/bin/openclaw", home),
    ];
    
    for pattern in glob_patterns {
        if let Ok(entries) = glob::glob(&pattern) {
            for entry in entries.flatten() {
                if entry.exists() && !paths_to_check.contains(&entry) {
                    paths_to_check.push(entry);
                }
            }
        }
    }
    
    // 尝试每个找到的路径
    for path in paths_to_check {
        let result = Command::new(&path)
            .arg("--version")
            .output();
            
        if let Ok(output) = result {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout)
                    .lines()
                    .next()
                    .unwrap_or("")
                    .split_whitespace()
                    .nth(1)
                    .unwrap_or("unknown")
                    .to_string();
                    
                return Ok(OpenClawInfo {
                    installed: true,
                    version: Some(version),
                    path: Some(path.to_string_lossy().to_string()),
                });
            }
        }
    }
    
    // 4. 最后尝试 which/where 作为备选
    let which_output = if cfg!(target_os = "windows") {
        Command::new("where").arg("openclaw").output()
    } else {
        Command::new("which").arg("openclaw").output()
    };
    
    if let Ok(output) = which_output {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let version_output = Command::new(&path).arg("--version").output();
            
            let version = version_output
                .ok()
                .filter(|o| o.status.success())
                .map(|o| {
                    String::from_utf8_lossy(&o.stdout)
                        .lines()
                        .next()
                        .unwrap_or("")
                        .split_whitespace()
                        .nth(1)
                        .unwrap_or("unknown")
                        .to_string()
                });
                
            return Ok(OpenClawInfo {
                installed: true,
                version,
                path: Some(path),
            });
        }
    }
    
    Ok(OpenClawInfo {
        installed: false,
        version: None,
        path: None,
    })
}

#[tauri::command]
pub async fn install_openclaw() -> Result<String, String> {
    // 检测包管理器
    let (pkg_manager, install_cmd) = if Command::new("pnpm").arg("--version").output().map(|o| o.status.success()).unwrap_or(false) {
        ("pnpm", vec!["pnpm", "install", "-g", "openclaw"])
    } else if Command::new("npm").arg("--version").output().map(|o| o.status.success()).unwrap_or(false) {
        ("npm", vec!["npm", "install", "-g", "openclaw"])
    } else if Command::new("yarn").arg("--version").output().map(|o| o.status.success()).unwrap_or(false) {
        ("yarn", vec!["yarn", "global", "add", "openclaw"])
    } else {
        return Err("未找到包管理器 (pnpm/npm/yarn)，请先安装 Node.js".to_string());
    };

    // 执行安装
    let output = Command::new(&install_cmd[0])
        .args(&install_cmd[1..])
        .output()
        .map_err(|e| format!("安装失败: {}", e))?;

    if output.status.success() {
        Ok(format!("使用 {} 安装成功！", pkg_manager))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("安装失败: {}", stderr))
    }
}
use std::process::Command;
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
    // 尝试查找 openclaw - 支持多种路径
    let paths_to_check = if cfg!(target_os = "windows") {
        vec!["openclaw"]
    } else {
        vec![
            "openclaw",
            "/usr/local/bin/openclaw",
            "/usr/bin/openclaw",
            &format!("{}/.local/bin/openclaw", std::env::var("HOME").unwrap_or_default()),
            &format!("{}/.local/share/pnpm/openclaw", std::env::var("HOME").unwrap_or_default()),
            &format!("{}/.npm-global/bin/openclaw", std::env::var("HOME").unwrap_or_default()),
        ]
    };

    let mut found_path: Option<String> = None;

    for path in &paths_to_check {
        // 尝试直接执行 --version
        let result = Command::new(path)
            .arg("--version")
            .output();

        if let Ok(output) = result {
            if output.status.success() {
                found_path = Some(path.to_string());
                break;
            }
        }
    }

    // 也尝试 which/where 作为备选
    if found_path.is_none() {
        let which_output = if cfg!(target_os = "windows") {
            Command::new("where").arg("openclaw").output()
        } else {
            Command::new("which").arg("openclaw").output()
        };

        if let Ok(output) = which_output {
            if output.status.success() {
                found_path = Some(String::from_utf8_lossy(&output.stdout).trim().to_string());
            }
        }
    }

    match found_path {
        Some(path) => {
            // 获取版本
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

            Ok(OpenClawInfo {
                installed: true,
                version,
                path: Some(path),
            })
        }
        None => Ok(OpenClawInfo {
            installed: false,
            version: None,
            path: None,
        }),
    }
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
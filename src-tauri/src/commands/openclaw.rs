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
    // 尝试查找 openclaw
    let which_output = if cfg!(target_os = "windows") {
        Command::new("where").arg("openclaw").output()
    } else {
        Command::new("which").arg("openclaw").output()
    };

    match which_output {
        Ok(output) if output.status.success() => {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();

            // 获取版本
            let version_output = Command::new("openclaw").arg("--version").output();

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
        _ => Ok(OpenClawInfo {
            installed: false,
            version: None,
            path: None,
        }),
    }
}

#[tauri::command]
pub async fn install_openclaw() -> Result<String, String> {
    // 返回安装命令提示，实际安装需要用户确认
    Ok("请运行: npm install -g openclaw".to_string())
}
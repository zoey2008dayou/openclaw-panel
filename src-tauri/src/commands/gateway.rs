use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GatewayStatus {
    pub running: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pid: Option<u32>,
}

#[tauri::command]
pub fn gateway_status() -> Result<GatewayStatus, String> {
    let output = Command::new("openclaw")
        .args(["gateway", "status"])
        .output()
        .map_err(|e| format!("执行命令失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let _stderr = String::from_utf8_lossy(&output.stderr);

    // 解析状态
    let running =
        stdout.contains("running") || stdout.contains("active") || !stdout.contains("not running");

    // 尝试解析端口
    let port = stdout.lines().find_map(|line| {
        if line.contains("port") || line.contains(":") {
            line.split(|c: char| !c.is_numeric())
                .filter_map(|s| s.parse::<u16>().ok())
                .next()
        } else {
            None
        }
    });

    Ok(GatewayStatus {
        running,
        port,
        pid: None,
    })
}

#[tauri::command]
pub async fn gateway_start() -> Result<String, String> {
    Command::new("openclaw")
        .args(["gateway", "start"])
        .spawn()
        .map_err(|e| format!("启动失败: {}", e))?;

    Ok("Gateway 启动中...".to_string())
}

#[tauri::command]
pub async fn gateway_stop() -> Result<String, String> {
    let _output = Command::new("openclaw")
        .args(["gateway", "stop"])
        .output()
        .map_err(|e| format!("停止失败: {}", e))?;

    Ok("Gateway 已停止".to_string())
}
use std::fs;
use std::path::PathBuf;
use crate::models::config::OpenClawConfig;

fn get_config_path() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取用户目录");
    home.join(".openclaw").join("openclaw.json")
}

#[tauri::command]
pub fn read_config() -> Result<OpenClawConfig, String> {
    let path = get_config_path();

    if !path.exists() {
        return Ok(OpenClawConfig {
            models: None,
            channels: None,
            gateway: None,
        });
    }

    let content =
        fs::read_to_string(&path).map_err(|e| format!("读取配置失败: {}", e))?;

    let config: OpenClawConfig =
        serde_json::from_str(&content).map_err(|e| format!("解析配置失败: {}", e))?;

    Ok(config)
}

#[tauri::command]
pub fn save_config(config: OpenClawConfig) -> Result<(), String> {
    let path = get_config_path();
    let dir = path.parent().expect("无法获取配置目录");

    // 备份原配置
    if path.exists() {
        let backup = path.with_extension("json.bak");
        fs::copy(&path, &backup).ok();
    }

    // 确保目录存在
    fs::create_dir_all(dir).map_err(|e| format!("创建目录失败: {}", e))?;

    // 写入新配置
    let content =
        serde_json::to_string_pretty(&config).map_err(|e| format!("序列化配置失败: {}", e))?;

    fs::write(&path, content).map_err(|e| format!("写入配置失败: {}", e))?;

    Ok(())
}
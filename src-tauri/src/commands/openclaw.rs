use std::process::{Command, Stdio};
use std::env;
use std::path::PathBuf;
use std::io::Write;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenClawInfo {
    pub installed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DependencyStatus {
    pub node_installed: bool,
    pub node_version: Option<String>,
    pub pnpm_installed: bool,
    pub npm_installed: bool,
    pub yarn_installed: bool,
    pub recommended_manager: String,
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
        // 自定义安装位置 (我们的安装脚本会放这里)
        format!("{}/.openclaw/bin/openclaw", home),
        format!("{}/.local/bin/openclaw", home),
        // npm 全局
        format!("{}/.npm-global/bin/openclaw", home),
        format!("{}/npm-global/bin/openclaw", home),
        // pnpm 全局
        format!("{}/.local/share/pnpm/openclaw", home),
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
        // bun
        format!("{}/.bun/bin/openclaw", home),
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
pub fn check_dependencies() -> Result<DependencyStatus, String> {
    // 检测 Node.js
    let node_output = Command::new("node").arg("--version").output();
    let (node_installed, node_version) = match node_output {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            (true, Some(version))
        }
        _ => (false, None),
    };
    
    // 检测包管理器
    let pnpm_installed = Command::new("pnpm").arg("--version").output()
        .map(|o| o.status.success()).unwrap_or(false);
    let npm_installed = Command::new("npm").arg("--version").output()
        .map(|o| o.status.success()).unwrap_or(false);
    let yarn_installed = Command::new("yarn").arg("--version").output()
        .map(|o| o.status.success()).unwrap_or(false);
    
    // 推荐包管理器
    let recommended_manager = if pnpm_installed {
        "pnpm".to_string()
    } else if npm_installed {
        "npm".to_string()
    } else if yarn_installed {
        "yarn".to_string()
    } else {
        "none".to_string()
    };
    
    Ok(DependencyStatus {
        node_installed,
        node_version,
        pnpm_installed,
        npm_installed,
        yarn_installed,
        recommended_manager,
    })
}

#[tauri::command]
pub async fn install_openclaw() -> Result<InstallResult, String> {
    let deps = check_dependencies()?;
    
    if !deps.node_installed {
        return Ok(InstallResult {
            success: false,
            message: "请先安装 Node.js (https://nodejs.org)".to_string(),
            version: None,
        });
    }
    
    // 选择包管理器
    let (pkg_manager, install_cmd) = if deps.pnpm_installed {
        ("pnpm", vec!["pnpm", "install", "-g", "openclaw"])
    } else if deps.npm_installed {
        ("npm", vec!["npm", "install", "-g", "openclaw"])
    } else if deps.yarn_installed {
        ("yarn", vec!["yarn", "global", "add", "openclaw"])
    } else {
        return Ok(InstallResult {
            success: false,
            message: "未找到包管理器".to_string(),
            version: None,
        });
    };

    // 执行安装
    let output = Command::new(&install_cmd[0])
        .args(&install_cmd[1..])
        .output()
        .map_err(|e| format!("安装失败: {}", e))?;

    if output.status.success() {
        std::thread::sleep(std::time::Duration::from_secs(1));
        let info = check_openclaw_installed()?;
        
        Ok(InstallResult {
            success: true,
            message: format!("使用 {} 安装成功！", pkg_manager),
            version: info.version,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Ok(InstallResult {
            success: false,
            message: format!("安装失败: {}", stderr),
            version: None,
        })
    }
}

#[tauri::command]
pub async fn install_all_dependencies() -> Result<InstallResult, String> {
    let home = env::var("HOME").unwrap_or_else(|_| "/root".to_string());
    let bin_dir = PathBuf::from(&home).join(".openclaw/bin");
    let install_log = PathBuf::from(&home).join(".openclaw/install.log");
    
    // 创建目录
    fs::create_dir_all(&bin_dir).map_err(|e| format!("创建目录失败: {}", e))?;
    
    // 检测 Node.js
    let node_output = Command::new("node").arg("--version").output();
    let node_installed = node_output.map(|o| o.status.success()).unwrap_or(false);
    
    if !node_installed {
        // macOS: 尝试用 Homebrew 安装 Node.js
        if cfg!(target_os = "macos") {
            let brew_check = Command::new("brew").arg("--version").output();
            if brew_check.map(|o| o.status.success()).unwrap_or(false) {
                // 有 Homebrew，安装 Node.js
                let output = Command::new("brew")
                    .args(["install", "node"])
                    .output()
                    .map_err(|e| format!("安装 Node.js 失败: {}", e))?;
                    
                if !output.status.success() {
                    return Ok(InstallResult {
                        success: false,
                        message: "安装 Node.js 失败，请手动安装: brew install node".to_string(),
                        version: None,
                    });
                }
            } else {
                return Ok(InstallResult {
                    success: false,
                    message: "请先安装 Homebrew: /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"".to_string(),
                    version: None,
                });
            }
        } else if cfg!(target_os = "linux") {
            // Linux: 尝试 apt 或 yum
            let apt_output = Command::new("apt").arg("--version").output();
            if apt_output.map(|o| o.status.success()).unwrap_or(false) {
                Command::new("apt")
                    .args(["update"])
                    .output()
                    .ok();
                let output = Command::new("apt")
                    .args(["install", "-y", "nodejs", "npm"])
                    .output()
                    .map_err(|e| format!("安装 Node.js 失败: {}", e))?;
                    
                if !output.status.success() {
                    return Ok(InstallResult {
                        success: false,
                        message: "安装 Node.js 失败，请手动安装: sudo apt install nodejs npm".to_string(),
                        version: None,
                    });
                }
            } else {
                return Ok(InstallResult {
                    success: false,
                    message: "请先安装 Node.js: https://nodejs.org/".to_string(),
                    version: None,
                });
            }
        } else {
            return Ok(InstallResult {
                success: false,
                message: "请先安装 Node.js: https://nodejs.org/".to_string(),
                version: None,
            });
        }
    }
    
    // 检测/安装 pnpm
    let pnpm_check = Command::new("pnpm").arg("--version").output();
    let pnpm_installed = pnpm_check.map(|o| o.status.success()).unwrap_or(false);
    
    if !pnpm_installed {
        // 使用 npm 安装 pnpm
        let output = Command::new("npm")
            .args(["install", "-g", "pnpm"])
            .output()
            .map_err(|e| format!("安装 pnpm 失败: {}", e))?;
            
        if !output.status.success() {
            // npm 全局安装可能需要权限，尝试用 corepack
            let corepack_output = Command::new("corepack")
                .args(["enable", "pnpm"])
                .output();
                
            if corepack_output.map(|o| o.status.success()).unwrap_or(false) {
                // corepack 成功
            } else {
                return Ok(InstallResult {
                    success: false,
                    message: "安装 pnpm 失败，请手动安装: npm install -g pnpm".to_string(),
                    version: None,
                });
            }
        }
    }
    
    // 安装 OpenClaw
    let output = Command::new("pnpm")
        .args(["install", "-g", "openclaw"])
        .output()
        .map_err(|e| format!("安装 OpenClaw 失败: {}", e))?;
        
    if output.status.success() {
        std::thread::sleep(std::time::Duration::from_secs(1));
        
        // 检查是否安装成功
        let info = check_openclaw_installed()?;
        
        if info.installed {
            let version = info.version.clone();
            Ok(InstallResult {
                success: true,
                message: format!("安装成功！OpenClaw {}", info.version.unwrap_or_else(|| "已安装".to_string())),
                version: version,
            })
        } else {
            // 已安装但检测不到，可能是 PATH 问题
            Ok(InstallResult {
                success: true,
                message: "安装成功！请重启应用以检测安装。".to_string(),
                version: None,
            })
        }
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(InstallResult {
            success: false,
            message: format!("安装失败: {}{}", stderr, stdout),
            version: None,
        })
    }
}

#[tauri::command]
pub async fn install_pnpm() -> Result<InstallResult, String> {
    // 检查是否已安装
    let output = Command::new("pnpm").arg("--version").output();
    if let Ok(output) = output {
        if output.status.success() {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            return Ok(InstallResult {
                success: true,
                message: format!("pnpm 已安装: {}", version),
                version: Some(version),
            });
        }
    }
    
    // 使用 npm 安装 pnpm
    let output = Command::new("npm")
        .args(["install", "-g", "pnpm"])
        .output()
        .map_err(|e| format!("安装 pnpm 失败: {}", e))?;
    
    if output.status.success() {
        Ok(InstallResult {
            success: true,
            message: "pnpm 安装成功！".to_string(),
            version: None,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Ok(InstallResult {
            success: false,
            message: format!("安装失败: {}", stderr),
            version: None,
        })
    }
}
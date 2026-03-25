mod commands;
mod models;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            check_openclaw_installed,
            check_dependencies,
            install_openclaw,
            install_pnpm,
            install_all_dependencies,
            read_config,
            save_config,
            gateway_status,
            gateway_start,
            gateway_stop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
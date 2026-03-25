use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OpenClawConfig {
    #[serde(default)]
    pub models: Option<ModelsConfig>,
    #[serde(default)]
    pub channels: Option<ChannelsConfig>,
    #[serde(default)]
    pub gateway: Option<GatewayConfig>,
    #[serde(default)]
    pub plugins: Option<PluginsConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelsConfig {
    #[serde(default = "default_merge")]
    pub mode: String,
    #[serde(default)]
    pub providers: Option<HashMap<String, ProviderConfig>>,
}

fn default_merge() -> String {
    "merge".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub models: Option<Vec<ModelInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ChannelsConfig {
    /// QQ Bot 通道配置
    #[serde(skip_serializing_if = "Option::is_none")]
    pub qqbot: Option<QQBotChannelConfig>,
    /// 飞书通道配置 (旧版兼容)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feishu: Option<FeishuChannelConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QQBotChannelConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_secret: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeishuChannelConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_secret: Option<String>,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginsConfig {
    #[serde(default)]
    pub entries: Option<PluginsEntries>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PluginsEntries {
    /// 飞书插件
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feishu: Option<PluginEntry>,
    /// 微信插件
    #[serde(skip_serializing_if = "Option::is_none")]
    pub openclaw_weixin: Option<PluginEntry>,
    /// QQ Bot 插件
    #[serde(skip_serializing_if = "Option::is_none")]
    pub openclaw_qqbot: Option<PluginEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginEntry {
    #[serde(default = "default_true")]
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth: Option<GatewayAuth>,
}

fn default_port() -> u16 {
    11797
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayAuth {
    #[serde(default = "default_token")]
    pub mode: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
}

fn default_token() -> String {
    "token".to_string()
}
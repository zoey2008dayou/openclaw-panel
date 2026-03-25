use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenClawConfig {
    #[serde(default)]
    pub models: Option<ModelsConfig>,
    #[serde(default)]
    pub channels: Option<ChannelsConfig>,
    #[serde(default)]
    pub gateway: Option<GatewayConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelsConfig {
    #[serde(default)]
    pub providers: Option<std::collections::HashMap<String, ProviderConfig>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub models: Option<Vec<ModelInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelsConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feishu: Option<FeishuChannelConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeishuChannelConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_secret: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection_mode: Option<String>,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth: Option<GatewayAuth>,
}

fn default_port() -> u16 {
    11797
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayAuth {
    pub mode: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
}
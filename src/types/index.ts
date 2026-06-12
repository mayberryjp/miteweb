export interface LogItem {
  id: number;
  received_at: string;
  source_ip?: string;
  host?: string;
  facility?: string;
  severity?: string;
  program?: string;
  pid?: string;
  message: string;
  raw_message: string;
}

export interface AlertItem {
  id: number;
  created_at: string;
  log_id?: number;
  rule_name: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  host?: string;
  source_ip?: string;
  message: string;
  reason?: string;
  action?: string;
  discord_sent: boolean;
}

export interface HostItem {
  id: number;
  host?: string;
  source_ip: string;
  first_seen_at: string;
  last_seen_at: string;
  log_count: number;
  alert_count: number;
}

export interface RuleItem {
  name: string;
  enabled: boolean;
  severity: string;
  description?: string;
  source_file: string;
  cooldown_seconds?: number;
  discord: boolean;
  load_status: "ok" | "error";
  error?: string;
}

export interface AIAnalysisItem {
  id: number;
  created_at: string;
  source_ip?: string;
  host?: string;
  sample_count: number;
  markdown_path: string;
  status: "success" | "failed" | "pending";
  summary?: string;
  markdown_content?: string;
  extracted_rules?: string[];
  rule_load_warnings?: string[];
}

export interface HealthStatus {
  status: string;
  uptime?: number;
  version?: string;
}

export interface StatsData {
  logs_last_hour?: number;
  logs_last_24h?: number;
  alerts_last_hour?: number;
  alerts_last_24h?: number;
  known_hosts?: number;
  loaded_rules?: number;
  ai_discovery_enabled?: boolean;
  discord_configured?: boolean;
  ai_configured?: boolean;
  retention_days?: number;
}

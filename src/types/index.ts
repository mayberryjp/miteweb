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
  pattern_id?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  limit: number;
  offset: number;
  total: number;
}

export interface AlertItem {
  id: number;
  created_at: string;
  log_id?: number;
  pattern_id?: number;
  severity: string;
  host?: string;
  source_ip?: string;
  message: string;
  reason?: string;
  action?: string;
  discord_sent: boolean;
  pattern_text?: string;
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

export interface PatternItem {
  id: number;
  pattern_hash: string;
  pattern_text: string;
  sample_message: string;
  classification: string;
  ai_explanation?: string;
  user_override?: string;
  match_regex?: string;
  title?: string;
  host?: string;
  program?: string;
  hit_count: number;
  first_seen_at: string;
  last_seen_at: string;
  effective_classification?: string;
}

export interface PendingPattern {
  id: number;
  pattern_hash: string;
  pattern_text: string;
  sample_message: string;
  host?: string;
  program?: string;
  hit_count: number;
  first_seen_at: string;
  last_seen_at: string;
}

export interface HealthStatus {
  status: string;
  version?: string;
  uptime?: number;
}

export interface TopHost {
  source_ip: string;
  host?: string;
  log_count: number;
}

export interface PatternBreakdown {
  classification: string;
  count: number;
}

export interface StatsData {
  logs_last_hour?: number;
  logs_last_24h?: number;
  alerts_last_hour?: number;
  alerts_last_24h?: number;
  top_hosts?: TopHost[];
  total_patterns?: number;
  pending_patterns?: number;
  pattern_breakdown?: PatternBreakdown[];
  database_size_bytes?: number;
  ai_enabled?: boolean;
}

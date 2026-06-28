import type { PatternItem } from "@/types";

export const CLASSIFICATION_ORDER = ["critical", "high", "medium", "low", "noise", "pending"] as const;

export const CLASSIFICATION_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  noise: "Noise",
  pending: "Pending",
};

export const getPatternClassification = (pattern: PatternItem): string => {
  return (pattern.effective_classification || pattern.classification || "pending").toLowerCase();
};

export const getClassificationColor = (pattern: PatternItem): string => {
  const cls = getPatternClassification(pattern);
  if (cls === "critical") return "#F5A623";
  if (cls === "high") return "#1565C0";
  if (cls === "medium") return "#2EC4A0";
  if (cls === "low") return "#64B5F6";
  if (cls === "noise") return "#5a7d7a";
  return "#2196F3";
};

export const getClassificationIcon = (pattern: PatternItem): string => {
  const cls = getPatternClassification(pattern);
  if (cls === "critical") return "mdi-alert-octagon";
  if (cls === "high") return "mdi-alert-circle";
  if (cls === "medium") return "mdi-alert";
  if (cls === "low") return "mdi-information";
  if (cls === "noise") return "mdi-volume-off";
  return "mdi-clock-outline";
};

export const OBSERVED_ATTRIBUTES = [
  "workflow-id",
  "readonly",
  "hide-toolbar",
  "show-minimap",
  "show-json-preview",
  "max-history",
  "theme",
];

export interface ResolvedConfig {
  workflowId: string;
  readonly: boolean;
  hideToolbar: boolean;
  showMinimap: boolean;
  showJsonPreview: boolean;
  maxHistory: number;
  theme: string;
}

export function parseBooleanAttribute(rawValue: string | null): boolean {
  return rawValue !== null;
}

export function parseNumberAttribute(
  rawValue: string | null,
  fallback: number,
): number {
  if (rawValue === null) return fallback;
  const parsed = parseInt(rawValue, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function parseStringAttribute(
  rawValue: string | null,
  fallback: string,
): string {
  if (rawValue === null || rawValue.trim() === "") return fallback;
  return rawValue;
}

export function parseAllAttributes(element: HTMLElement): ResolvedConfig {
  return {
    workflowId: parseStringAttribute(
      element.getAttribute("workflow-id"),
      "c1x_default",
    ),
    readonly: parseBooleanAttribute(element.getAttribute("readonly")),
    hideToolbar: parseBooleanAttribute(element.getAttribute("hide-toolbar")),
    showMinimap: parseBooleanAttribute(element.getAttribute("show-minimap")),
    showJsonPreview: parseBooleanAttribute(
      element.getAttribute("show-json-preview"),
    ),
    maxHistory: parseNumberAttribute(element.getAttribute("max-history"), 50),
    theme: parseStringAttribute(element.getAttribute("theme"), "light"),
  };
}

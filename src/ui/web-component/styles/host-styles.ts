import { generateCSSVars } from "../../styles/tokens";

export const HOST_STYLES = `
${generateCSSVars()}

:host {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--c1x-font);
  box-sizing: border-box;
  color: var(--c1x-text);
}

:host([theme="dark"]) {
  --c1x-bg: #151515;
  --c1x-canvas: #1f1f1f;
  --c1x-border: #2b2b2b;
  --c1x-border-dark: #3a3a3a;
  --c1x-text: #f8fafc;
  --c1x-text-secondary: #cbd5e1;
  --c1x-text-muted: #94a3b8;
}

:host([readonly]) .wf-readonly-overlay {
  display: block;
}

* {
  box-sizing: inherit;
}
`;

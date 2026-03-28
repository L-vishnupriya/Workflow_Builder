export const MODAL_STYLES = `
/* C1X Shoelace Overrides */
:host {
  --sl-border-radius-medium: 12px;
  --sl-color-primary-600: #f97316;
  --sl-color-primary-500: #fb923c;
  --sl-input-border-color-focus: #f97316;
  --sl-focus-ring-color: rgba(249, 115, 22, 0.4);
  --header-color: #f97316;
}

/* Custom width for modal */
sl-dialog::part(panel) {
  width: 460px;
  max-width: 82vw;
  border-top: 4px solid var(--header-color);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(17, 24, 39, 0.2);
  border: 1px solid #fdba74;
  background: #fff;
}

/* Header typography */
sl-dialog::part(header) {
  padding-bottom: 6px;
  border-bottom: 1px solid #ffedd5;
}

sl-dialog::part(title) {
  font-family: Inter, sans-serif;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: var(--header-color);
}

sl-dialog::part(body) {
  padding: 14px 16px 10px;
  background: #fff;
}

sl-dialog::part(footer) {
  border-top: 1px solid #ffedd5;
  background: #fff7ed;
  padding: 10px 14px;
}

sl-button::part(base) {
  border-radius: 9px;
  font-weight: 600;
}

sl-button[variant='primary']::part(base) {
  background: #f97316;
  border-color: #f97316;
}

sl-button[variant='primary']::part(base):hover {
  background: #ea580c;
  border-color: #ea580c;
}

/* Form body layout */
.form-body {
  padding: 2px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Error text below fields */
.field-error {
  font-family: Inter, sans-serif;
  font-size: 11px;
  color: #dc2626;
  margin-top: 2px;
}

sl-input::part(form-control-label),
sl-select::part(form-control-label) {
  font-size: 12px;
  font-weight: 600;
}

sl-input::part(help-text),
sl-select::part(help-text) {
  font-size: 11px;
  line-height: 1.25;
}

sl-input::part(input),
sl-select::part(display-input) {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

sl-input::part(input)::placeholder,
sl-select::part(display-input)::placeholder {
  color: #6b7280;
  opacity: 1;
}

sl-input::part(base):focus-within,
sl-select::part(combobox):focus-within {
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.35);
  border-color: #f97316;
}

/* Branch input row layout used in Split Node */
.branch-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
`;

export function injectModalStyles() {
  if (document.getElementById("c1x-modal-styles")) return;

  const styleTag = document.createElement("style");
  styleTag.id = "c1x-modal-styles";
  styleTag.innerHTML = MODAL_STYLES;
  document.head.appendChild(styleTag);
}

export const LAYOUT_STYLES = `
.wf-container {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #f7f7f7 0%, #f0f0f0 100%);
  position: relative;
}

.wf-sidebar-area {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--c1x-border);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  overflow-y: auto;
}

.wf-canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 50% -10%, #fafafa 0%, #f1f1f1 70%);
}

.wf-canvas-mount {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.wf-json-preview {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 320px;
  background: #1E1E1E;
  color: #D4D4D4;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  overflow-y: auto;
  padding: 12px;
  border-left: 1px solid #333;
  display: none;
  z-index: 5;
}

:host([show-json-preview]) .wf-json-preview {
  display: block;
}

.wf-toolbar {
  position: relative;
  top: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  z-index: 10;
  background: #fff;
  padding: 8px 10px;
  border-radius: 0;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
  border: 1px solid #c8c8c8;
  border-left: none;
  border-right: none;
}

.wf-toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wf-toolbar-brand {
  font-size: 13px;
  font-weight: 700;
  color: #3a3a3a;
  letter-spacing: 0.02em;
}

.wf-toolbar-btn {
  background: #fff;
  border: 1px solid #d2d2d2;
  cursor: pointer;
  padding: 4px 10px;
  font-size: 11px;
  font-family: inherit;
  font-weight: 700;
  color: #3a3a3a;
  border-radius: 999px;
  transition: background 0.2s, border-color 0.2s;
}

.wf-toolbar-btn:hover:not(:disabled) {
  border-color: #e8571a;
  color: #e8571a;
}

.wf-toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.wf-sidebar {
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(180deg, #ffffff 0%, #f6f6f6 100%);
  border-right: 1px solid #c8c8c8;
  transition: width 0.25s ease;
}

.wf-sidebar.is-collapsed {
  width: 64px;
}

.wf-sidebar-toggle {
  position: absolute;
  top: 10px;
  right: 8px;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid #d2d2d2;
  background: #fff;
  cursor: pointer;
  z-index: 2;
}

.wf-sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 10px;
  padding-top: 46px;
  overflow-y: auto;
}

.wf-palette-item {
  position: relative;
  overflow: hidden;
}

.wf-palette-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  opacity: 0;
  transition: opacity 0.12s ease;
  background: rgba(17, 24, 39, 0.2);
}

.wf-palette-item:hover::before {
  opacity: 1;
}

.wf-palette-item:hover .wf-drag-handle {
  opacity: 1;
}

.wf-palette-audience::before { background: #f97316; }
.wf-palette-wait::before { background: #6366f1; }
.wf-palette-filter::before { background: #f59e0b; }
.wf-palette-action::before { background: #10b981; }
.wf-palette-split::before { background: #8b5cf6; }
.wf-palette-end::before { background: #6b7280; }

.wf-sidebar.is-collapsed .wf-sidebar-title,
.wf-sidebar.is-collapsed .wf-sidebar-subtitle,
.wf-sidebar.is-collapsed .wf-palette-label,
.wf-sidebar.is-collapsed .wf-palette-subtitle {
  display: none;
}

.wf-canvas-controls {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 11;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d2d2d2;
  border-radius: 999px;
  padding: 4px;
  backdrop-filter: blur(6px);
}

.wf-canvas-btn {
  min-width: 30px;
  height: 28px;
  border: 1px solid #d2d2d2;
  border-radius: 999px;
  background: #fff;
  color: #3a3a3a;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.wf-canvas-btn:hover {
  border-color: #e8571a;
  color: #e8571a;
}

.wf-canvas-btn-danger {
  border-color: #df8e8e;
  color: #b94848;
}

.wf-empty-hint {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #6a6a6a;
  text-align: center;
  background: rgba(255, 255, 255, 0.75);
  border: 1px dashed #c8c8c8;
  border-radius: 12px;
  padding: 12px 14px;
}

.wf-empty-hint strong {
  color: #3a3a3a;
  font-size: 13px;
}

.wf-empty-hint span {
  font-size: 12px;
}

.wf-empty-hint.is-hidden {
  display: none;
}

:host([theme="dark"]) .wf-toolbar,
:host([theme="dark"]) .wf-sidebar,
:host([theme="dark"]) .wf-sidebar-area {
  background: #101317;
}

:host([theme="dark"]) .wf-toolbar-btn,
:host([theme="dark"]) .wf-sidebar-toggle {
  background: #182029;
  color: var(--c1x-text);
  border-color: var(--c1x-border-dark);
}

:host([theme="dark"]) .wf-palette-item {
  border-color: var(--c1x-border-dark) !important;
}

@media (max-width: 1200px) {
  .wf-sidebar {
    width: 220px;
  }

  .wf-sidebar-list {
    padding-left: 10px;
    padding-right: 10px;
  }
}

@media (max-width: 900px) {
  .wf-sidebar {
    width: 64px;
  }

  .wf-sidebar .wf-palette-label,
  .wf-sidebar .wf-palette-subtitle {
    display: none;
  }

  .wf-canvas-controls {
    right: 8px;
    bottom: 8px;
    gap: 4px;
    padding: 5px;
  }

  .wf-canvas-btn {
    min-width: 30px;
    height: 28px;
    padding: 0 8px;
  }
}

.wf-readonly-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  cursor: not-allowed;
  display: none;
  background: rgba(255, 255, 255, 0.1);
}

/* Shoelace Modal Shell Mount */
.wf-modal-mount {
  /* Modals are appended to document.body, but we keep this incase we shadow-root inject them later */
  display: none; 
}
`;

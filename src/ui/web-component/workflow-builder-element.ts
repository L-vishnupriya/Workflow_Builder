import { WorkflowEngine } from "../../core/engine/workflow-engine";
import { WorkflowRenderer } from "../canvas/renderer";
import { ModalManager } from "../modal/modal-manager";
import {
  OBSERVED_ATTRIBUTES,
  parseAllAttributes,
  ResolvedConfig,
} from "./observed-attributes";
import { WF_EVENTS, dispatchWorkflowEvent } from "./dom-events";
import { HOST_STYLES } from "./styles/host-styles";
import { LAYOUT_STYLES } from "./styles/layout-styles";
import { applyPublicApi } from "./public-api";

export class WorkflowBuilderElement extends HTMLElement {
  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  // Public API types (implemented via mixin)
  getWorkflow(): string {
    throw new Error("Method not implemented.");
  }
  loadWorkflow(json: string): boolean {
    throw new Error("Method not implemented.");
  }
  validateWorkflow(): any {
    throw new Error("Method not implemented.");
  }
  undo(): void {
    throw new Error("Method not implemented.");
  }
  redo(): void {
    throw new Error("Method not implemented.");
  }
  clearWorkflow(): void {
    throw new Error("Method not implemented.");
  }
  fitToScreen(): void {
    throw new Error("Method not implemented.");
  }
  setReadOnly(readonly: boolean): void {
    throw new Error("Method not implemented.");
  }

  private _shadowRoot: ShadowRoot;
  private _engine: WorkflowEngine | null = null;
  private _renderer: WorkflowRenderer | null = null;
  private _modalManager: ModalManager | null = null;
  private _isInitialized = false;
  private _config!: ResolvedConfig;

  // UI Refs
  private undoBtn!: HTMLButtonElement;
  private redoBtn!: HTMLButtonElement;
  private emptyHintEl: HTMLDivElement | null = null;

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._isInitialized = false;
  }

  connectedCallback() {
    if (this._isInitialized) return;

    this._config = parseAllAttributes(this);

    // 1. Inject Styles
    const styleEl = document.createElement("style");
    styleEl.textContent = HOST_STYLES + LAYOUT_STYLES;
    this._shadowRoot.appendChild(styleEl);

    // 2. Build DOM
    const container = document.createElement("div");
    container.className = "wf-container";

    const canvasArea = document.createElement("div");
    canvasArea.className = "wf-canvas-area";

    if (!this._config.hideToolbar) {
      const toolbar = this.buildToolbar();
      canvasArea.appendChild(toolbar);
    }

    const canvasMount = document.createElement("div");
    canvasMount.className = "wf-canvas-mount";
    canvasArea.appendChild(canvasMount);

    this.emptyHintEl = document.createElement("div");
    this.emptyHintEl.className = "wf-empty-hint";
    this.emptyHintEl.innerHTML =
      "<strong>Start by dragging a node</strong><span>Use the left panel to build your workflow graph.</span>";
    canvasArea.appendChild(this.emptyHintEl);

    const controls = this.buildCanvasControls();
    canvasArea.appendChild(controls);

    const jsonPreview = document.createElement("div");
    jsonPreview.className = "wf-json-preview";
    if (this._config.showJsonPreview) {
      jsonPreview.style.display = "block";
    }

    const readonlyOverlay = document.createElement("div");
    readonlyOverlay.className = "wf-readonly-overlay";
    canvasArea.appendChild(readonlyOverlay);

    container.appendChild(canvasArea);
    this._shadowRoot.appendChild(container);
    this._shadowRoot.appendChild(jsonPreview);

    // 3. Initialize Core Layers
    this._engine = new WorkflowEngine({
      workflowId: this._config.workflowId,
      maxHistory: this._config.maxHistory,
    });

    this._modalManager = new ModalManager(this._engine);
    this._renderer = new WorkflowRenderer(
      canvasMount,
      this._engine,
      (nodeId: string, nodeType: string, params: any) => {
        this._modalManager?.open(nodeId, nodeType, params);
      },
    );

    // 4. Wire DOM Events to Engine
    this.wireEngineEvents(jsonPreview);

    // 5. Initial state
    if (this._config.readonly) {
      this.setReadOnly(true);
    }

    this._isInitialized = true;
    dispatchWorkflowEvent(this, WF_EVENTS.READY, {});
  }

  disconnectedCallback() {
    if (!this._isInitialized) return;

    this._modalManager?.destroy();
    this._renderer?.destroy();
    this._engine?.destroy();

    this._shadowRoot.innerHTML = "";
    this._engine = null;
    this._renderer = null;
    this._modalManager = null;
    this._isInitialized = false;

    dispatchWorkflowEvent(this, WF_EVENTS.DESTROYED, {});
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (!this._isInitialized) return;
    if (oldValue === newValue) return;

    switch (name) {
      case "readonly":
        this.setReadOnly(newValue !== null);
        break;
      case "hide-toolbar":
        console.warn(
          "Attribute hide-toolbar cannot be changed after initialization.",
        );
        break;
      case "show-json-preview":
        const preview = this._shadowRoot.querySelector(
          ".wf-json-preview",
        ) as HTMLElement;
        if (preview) {
          preview.style.display = newValue !== null ? "block" : "none";
        }
        break;
      case "show-minimap":
        console.info(
          "[C1X] show-minimap attribute received:",
          newValue !== null,
        );
        break;
      case "theme":
        // The host CSS variable `:host([theme="dark"])` handles color swapping automatically via CSS
        break;
      case "workflow-id":
      case "max-history":
        console.warn(
          `Attribute ${name} cannot be changed after initialization.`,
        );
        break;
    }
  }

  private buildToolbar(): HTMLElement {
    const toolbar = document.createElement("div");
    toolbar.className = "wf-toolbar";

    const left = document.createElement("div");
    left.className = "wf-toolbar-group";

    const brand = document.createElement("div");
    brand.className = "wf-toolbar-brand";
    brand.textContent = "C1X Workflow Builder";
    left.appendChild(brand);

    const historyGroup = document.createElement("div");
    historyGroup.className = "wf-toolbar-group";

    this.undoBtn = document.createElement("button");
    this.undoBtn.className = "wf-toolbar-btn";
    this.undoBtn.textContent = "Undo";
    this.undoBtn.disabled = true;
    this.undoBtn.onclick = () => this.undo();
    historyGroup.appendChild(this.undoBtn);

    this.redoBtn = document.createElement("button");
    this.redoBtn.className = "wf-toolbar-btn";
    this.redoBtn.textContent = "Redo";
    this.redoBtn.disabled = true;
    this.redoBtn.onclick = () => this.redo();
    historyGroup.appendChild(this.redoBtn);

    left.appendChild(historyGroup);

    const middle = document.createElement("div");
    middle.className = "wf-toolbar-group";

    const fitBtn = document.createElement("button");
    fitBtn.className = "wf-toolbar-btn";
    fitBtn.textContent = "Auto Layout";
    fitBtn.onclick = () => this.fitToScreen();
    middle.appendChild(fitBtn);

    const fitViewBtn = document.createElement("button");
    fitViewBtn.className = "wf-toolbar-btn";
    fitViewBtn.textContent = "Fit";
    fitViewBtn.onclick = () => this.fitToScreen();
    middle.appendChild(fitViewBtn);

    const validateBtn = document.createElement("button");
    validateBtn.className = "wf-toolbar-btn";
    validateBtn.textContent = "Validate";
    validateBtn.onclick = () => this.validateWorkflow();
    middle.appendChild(validateBtn);

    const right = document.createElement("div");
    right.className = "wf-toolbar-group";

    const exportBtn = document.createElement("button");
    exportBtn.className = "wf-toolbar-btn wf-export-btn";
    exportBtn.textContent = "Export";
    exportBtn.onclick = () => {
      const json = this.getWorkflow();
      navigator.clipboard.writeText(json).then(() => {
        const ogText = exportBtn.textContent;
        exportBtn.textContent = "Copied!";
        setTimeout(() => (exportBtn.textContent = ogText), 2000);
      });
    };
    right.appendChild(exportBtn);

    toolbar.appendChild(left);
    toolbar.appendChild(middle);
    toolbar.appendChild(right);

    return toolbar;
  }

  private buildCanvasControls(): HTMLElement {
    const controls = document.createElement("div");
    controls.className = "wf-canvas-controls";

    const zoomOut = document.createElement("button");
    zoomOut.type = "button";
    zoomOut.className = "wf-canvas-btn";
    zoomOut.textContent = "-";
    zoomOut.setAttribute("aria-label", "Zoom out");
    zoomOut.onclick = () => this._renderer?.zoomOut();

    const zoomIn = document.createElement("button");
    zoomIn.type = "button";
    zoomIn.className = "wf-canvas-btn";
    zoomIn.textContent = "+";
    zoomIn.setAttribute("aria-label", "Zoom in");
    zoomIn.onclick = () => this._renderer?.zoomIn();

    const fit = document.createElement("button");
    fit.type = "button";
    fit.className = "wf-canvas-btn";
    fit.textContent = "Fit";
    fit.onclick = () => this.fitToScreen();

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "wf-canvas-btn wf-canvas-btn-danger";
    clear.textContent = "Clear";
    clear.onclick = () => this.clearWorkflow();

    controls.appendChild(zoomOut);
    controls.appendChild(zoomIn);
    controls.appendChild(fit);
    controls.appendChild(clear);
    return controls;
  }

  private wireEngineEvents(jsonPreview: HTMLElement) {
    if (!this._engine) return;

    this._engine.events.on("node:added", (payload: any) => {
      dispatchWorkflowEvent(this, WF_EVENTS.NODE_ADDED, payload);
    });

    this._engine.events.on("node:configured", (payload: any) => {
      dispatchWorkflowEvent(this, WF_EVENTS.NODE_CONFIGURED, payload);
      this.dispatchChangeEvent(jsonPreview);
    });

    this._engine.events.on("node:deleted", (payload: any) => {
      dispatchWorkflowEvent(this, WF_EVENTS.NODE_DELETED, payload);
      this.dispatchChangeEvent(jsonPreview);
    });

    this._engine.events.on("edge:added", (payload: any) => {
      dispatchWorkflowEvent(this, WF_EVENTS.EDGE_ADDED, { edge: payload.edge });
      this.dispatchChangeEvent(jsonPreview);
    });

    this._engine.events.on("edge:deleted", (payload: any) => {
      dispatchWorkflowEvent(this, WF_EVENTS.EDGE_DELETED, {
        edgeId: payload.edgeId,
      });
      this.dispatchChangeEvent(jsonPreview);
    });

    this._engine.events.on("validation:failed", (payload: any) => {
      dispatchWorkflowEvent(this, WF_EVENTS.VALIDATION_FAILED, payload);
    });

    this._engine.events.on("history:changed", (payload: any) => {
      if (this.undoBtn) {
        this.undoBtn.disabled = !payload.canUndo;
      }
      if (this.redoBtn) {
        this.redoBtn.disabled = !payload.canRedo;
      }
      dispatchWorkflowEvent(this, WF_EVENTS.HISTORY_CHANGED, payload);
      this.dispatchChangeEvent(jsonPreview);
    });

    this._engine.events.on("graph:loaded", () => {
      this.dispatchChangeEvent(jsonPreview);
    });
  }

  private dispatchChangeEvent(jsonPreview: HTMLElement) {
    if (!this._engine) return;

    // We delay the JSON export slightly to let the engine settle its state (avoiding cyclic tight loops)
    setTimeout(() => {
      if (!this._engine) return; // check again incase destroyed
      const json = this._engine.exportJSON();
      const graph = this._engine.getGraph();

      if (this._config.showJsonPreview) {
        jsonPreview.innerHTML = `<pre>${JSON.stringify(JSON.parse(json), null, 2)}</pre>`;
      }

      const hasNodes = Array.isArray(graph.nodes) && graph.nodes.length > 0;
      if (this.emptyHintEl) {
        this.emptyHintEl.classList.toggle("is-hidden", hasNodes);
      }

      dispatchWorkflowEvent(this, WF_EVENTS.CHANGE, {
        workflowId: graph.workflowId,
        graph,
        json,
      });
    }, 0);
  }
}

applyPublicApi(WorkflowBuilderElement);

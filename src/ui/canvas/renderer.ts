import { WorkflowEngine } from "../../core/engine/workflow-engine";
import { CanvasManager } from "./canvas/canvas-manager";
import { EdgeManager } from "./canvas/edge-manager";
import { EngineSync } from "./sync/engine-sync";
import { Sidebar } from "./sidebar/sidebar";
// @ts-ignore
import { LiteGraph } from "litegraph.js";
import { AudienceNode } from "./nodes/audience-node";
import { WaitNode } from "./nodes/wait-node";
import { FilterNode } from "./nodes/filter-node";
import { ActionNode } from "./nodes/action-node";
import { SplitNode } from "./nodes/split-node";
import { EndNode } from "./nodes/end-node";

function ensureNodeRegistrations() {
  const registry = (LiteGraph as any).registered_node_types || {};
  const registrations: Array<[string, any]> = [
    ["c1x/audience", AudienceNode],
    ["c1x/wait", WaitNode],
    ["c1x/filter", FilterNode],
    ["c1x/action", ActionNode],
    ["c1x/split", SplitNode],
    ["c1x/end", EndNode],
  ];

  for (const [type, ctor] of registrations) {
    if (!registry[type]) {
      LiteGraph.registerNodeType(type, ctor);
    }
  }
}

export class WorkflowRenderer {
  container: HTMLElement;
  engine: WorkflowEngine;

  private canvasManager: CanvasManager;
  private edgeManager: EdgeManager;
  private engineSync: EngineSync;
  private sidebar: Sidebar;
  private wrapper: HTMLElement;
  private onNodeDblClick?: (
    nodeId: string,
    nodeType: string,
    params: any,
  ) => void;

  constructor(
    container: HTMLElement,
    engine: WorkflowEngine,
    onNodeDblClick?: (nodeId: string, nodeType: string, params: any) => void,
  ) {
    this.container = container;
    this.engine = engine;
    this.onNodeDblClick = onNodeDblClick;

    // Some consumer bundlers can instantiate multiple LiteGraph copies.
    // Ensure node constructors are always present in the active registry.
    ensureNodeRegistrations();

    // Build the main DOM layout Wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.className = "c1x-workflow-wrapper";
    this.wrapper.style.display = "flex";
    this.wrapper.style.position = "absolute";
    this.wrapper.style.inset = "0";
    this.wrapper.style.width = "100%";
    this.wrapper.style.height = "100%";
    this.wrapper.style.minWidth = "0";
    this.wrapper.style.overflow = "hidden";

    // Canvas Container
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "c1x-canvas-container";
    canvasContainer.style.flex = "1 1 0";
    canvasContainer.style.minWidth = "0";
    canvasContainer.style.position = "relative";
    canvasContainer.style.height = "100%";

    // Assemble Layout first so canvas manager has real dimensions.
    this.wrapper.appendChild(canvasContainer);
    this.container.appendChild(this.wrapper);

    // Initialize Managers
    this.canvasManager = new CanvasManager(canvasContainer, this.engine);
    this.edgeManager = new EdgeManager(this.engine, this.canvasManager);
    this.edgeManager.initialize();

    // Relay node dblclick from engine events to modal callback.
    this.engine.events.on("node:dblclick", (payload: any) => {
      this.onNodeDblClick?.(payload.nodeId, payload.nodeType, payload.params);
    });

    this.engineSync = new EngineSync(
      this.engine,
      this.canvasManager.lgraph,
      this.edgeManager,
      this.canvasManager.lcanvas,
    );

    // Initialize Sidebar
    this.sidebar = new Sidebar(this.canvasManager);

    // Wire canvas-ready callback: after the canvas has real layout dimensions,
    // populate nodes from the engine (in case loadWorkflow fired before ready)
    this.canvasManager.onCanvasReady = () => {
      const graph = this.engine.getGraph();
      if (graph.nodes.length > 0) {
        setTimeout(() => {
          this.engineSync.syncFullGraph(graph as any);
        }, 50);
      }
    };

    // Assemble Layout
    this.wrapper.prepend(this.sidebar.getElement());
  }

  fitToScreen() {
    this.canvasManager.fitToScreen();
  }

  zoomIn() {
    this.canvasManager.zoomIn();
  }

  zoomOut() {
    this.canvasManager.zoomOut();
  }

  setReadOnly(readOnly: boolean) {
    // Basic disable interaction logic for LiteGraph
    if (this.canvasManager.lgraph) {
      if (readOnly) {
        this.canvasManager.lcanvas.allow_interaction = false;
        this.canvasManager.lcanvas.allow_drag = false;
      } else {
        this.canvasManager.lcanvas.allow_interaction = true;
        this.canvasManager.lcanvas.allow_drag = true;
      }
    }
  }

  destroy() {
    this.canvasManager.destroy();
    if (this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }
}

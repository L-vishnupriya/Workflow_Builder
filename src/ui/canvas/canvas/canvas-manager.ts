// @ts-ignore
import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";
import { WorkflowEngine } from "../../../core/engine/workflow-engine";

export class CanvasManager {
  container: HTMLElement;
  canvasEl: HTMLCanvasElement;
  engine: WorkflowEngine;
  onCanvasReady: (() => void) | null = null;

  lgraph: any;
  lcanvas: any;

  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, engine: WorkflowEngine) {
    this.container = container;
    this.engine = engine;

    this.canvasEl = document.createElement("canvas");
    this.canvasEl.style.display = "block";
    this.canvasEl.style.width = "100%";
    this.canvasEl.style.height = "100%";
    this.canvasEl.style.background = "#E2E8F0";
    this.canvasEl.style.cursor = "default";
    this.container.appendChild(this.canvasEl);
    this.container.style.background = "#E2E8F0";

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.container.getBoundingClientRect();
      const w = Math.max(
        1,
        Math.floor(rect.width || this.container.clientWidth || 0),
      );
      const h = Math.max(
        1,
        Math.floor(rect.height || this.container.clientHeight || 0),
      );
      this.canvasEl.width = Math.floor(w * dpr);
      this.canvasEl.height = Math.floor(h * dpr);
      this.canvasEl.style.width = `${w}px`;
      this.canvasEl.style.height = `${h}px`;
    };

    setSize();

    this.lgraph = new LGraph();
    this.lcanvas = new LGraphCanvas(this.canvasEl, this.lgraph);
    // Hide LiteGraph's node search UI (double-click empty canvas / link context menu "Search").
    this.lcanvas.allow_searchbox = false;
    this.lcanvas.allow_reconnect_links = true;
    this.lcanvas.render_canvas_border = false;
    this.lcanvas.show_info = false;
    this.lcanvas.render_info = false;
    this.lcanvas.background_image = "";
    this.lcanvas.bgcolor = "#E2E8F0";
    this.lcanvas.clear_background_color = "#E2E8F0";
    this.lcanvas.always_render_background = true;
    this.lcanvas.onBackgroundRender = null;
    (LiteGraph as any).node_box_coloured_by_mode = false;
    (LiteGraph as any).LINK_COLOR = "#334155";
    (LiteGraph as any).EVENT_LINK_COLOR = "#E8571A";
    (LiteGraph as any).CONNECTING_LINK_COLOR = "#F97316";
    this.lcanvas.default_link_color = (LiteGraph as any).LINK_COLOR;
    this.lcanvas.connections_width = 5;
    this.lcanvas.clear_background = true;

    const drawBackground = (_canvas: any, _ctx: CanvasRenderingContext2D) => {
      this.drawGrid();
    };
    this.lcanvas.onDrawBackground = drawBackground;

    // Fallback for LiteGraph variants that do not consistently call onDrawBackground.
    const originalDrawBackCanvas = this.lcanvas.drawBackCanvas?.bind(
      this.lcanvas,
    );
    if (originalDrawBackCanvas) {
      this.lcanvas.drawBackCanvas = (...args: any[]) => {
        originalDrawBackCanvas(...args);
        this.drawGrid();
      };
    }
    if (typeof this.lcanvas.setDirty === "function") {
      this.lcanvas.setDirty(true, true);
    }

    this.resizeObserver = new ResizeObserver(() => {
      setSize();
      if (this.lcanvas?.resize) {
        this.lcanvas.resize();
      }
    });
    this.resizeObserver.observe(this.container);

    this.lgraph.start();

    // Notify once dimensions are real
    requestAnimationFrame(() => {
      if (this.lcanvas?.resize) {
        this.lcanvas.resize();
      }
      if (this.onCanvasReady) this.onCanvasReady();
    });
  }

  /**
   * Called when a node is dragged from the sidebar and dropped on the canvas.
   */
  addNodeToCanvas(
    type: string,
    screenX: number,
    screenY: number,
  ): string | null {
    const typeMap: Record<string, string> = {
      audience: "c1x/audience",
      wait: "c1x/wait",
      filter: "c1x/filter",
      action: "c1x/action",
      split: "c1x/split",
      end: "c1x/end",
    };

    const lgType = typeMap[type];
    if (!lgType) return null;

    const lgNode = LiteGraph.createNode(lgType);
    if (!lgNode) return null;

    const rect = this.canvasEl.getBoundingClientRect();
    const relX = screenX - rect.left;
    const relY = screenY - rect.top;
    const scale = this.lcanvas?.ds?.scale || 1;
    const offset = this.lcanvas?.ds?.offset || [0, 0];

    lgNode.pos = [relX / scale - offset[0], relY / scale - offset[1]];

    this.lgraph.add(lgNode);
    return lgNode.id?.toString?.() ?? null;
  }

  /**
   * Called by EngineSync to rebuild the full canvas from the engine graph.
   */
  loadFromGraph(
    nodes: {
      id: string;
      type: string;
      position: { x: number; y: number };
      status: string;
    }[],
    edges: { id: string; source: string; target: string }[],
  ) {
    const nodeMap = new Map<string, any>();
    this.lgraph.clear();

    for (const n of nodes) {
      const lgNode = LiteGraph.createNode(`c1x/${n.type}`);
      if (!lgNode) continue;
      lgNode.pos = [n.position.x, n.position.y];
      (lgNode as any).workflowNodeId = n.id;
      this.lgraph.add(lgNode);
      nodeMap.set(n.id, lgNode);
    }

    for (const e of edges) {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (src && tgt) {
        src.connect(0, tgt, 0);
      }
    }

    if (this.lcanvas?.fitToView) {
      this.lcanvas.fitToView();
    }
  }

  removeNodeFromCanvas(nodeId: string) {
    const node = this.lgraph?._nodes?.find(
      (n: any) => n.workflowNodeId === nodeId || `${n.id}` === `${nodeId}`,
    );
    if (node) {
      this.lgraph.remove(node);
    }
  }

  fitToScreen() {
    if (this.lcanvas?.fitToView) {
      this.lcanvas.fitToView();

      // Avoid excessively tiny nodes when graph is large; keep a readable minimum zoom.
      const minReadableScale = 0.78;
      const currentScale = this.lcanvas?.ds?.scale || 1;
      if (currentScale < minReadableScale) {
        const center = [this.canvasEl.width / 2, this.canvasEl.height / 2];
        if (typeof this.lcanvas.setZoom === "function") {
          this.lcanvas.setZoom(minReadableScale, center);
        } else if (this.lcanvas?.ds) {
          this.lcanvas.ds.scale = minReadableScale;
        }
      }
      this.forceRedraw();
    }
  }

  zoomIn() {
    this.applyZoom(1.15);
  }

  zoomOut() {
    this.applyZoom(1 / 1.15);
  }

  forceRedraw() {
    if (this.lgraph?.setDirtyCanvas) {
      this.lgraph.setDirtyCanvas(true, true);
    }
  }

  private applyZoom(multiplier: number) {
    if (!this.lcanvas) return;

    const current = this.lcanvas?.ds?.scale || 1;
    const next = Math.min(3, Math.max(0.35, current * multiplier));
    const center = [this.canvasEl.width / 2, this.canvasEl.height / 2];

    if (typeof this.lcanvas.setZoom === "function") {
      this.lcanvas.setZoom(next, center);
      this.forceRedraw();
      return;
    }

    if (this.lcanvas?.ds) {
      this.lcanvas.ds.scale = next;
      this.forceRedraw();
    }
  }

  private drawGrid() {
    if (!this.lcanvas?.ctx || !this.canvasEl) return;

    const ctx = this.lcanvas.ctx as CanvasRenderingContext2D;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    const scale = this.lcanvas?.ds?.scale || 1;
    const offset = this.lcanvas?.ds?.offset || [0, 0];
    const minor = 24 * scale;
    const major = 24 * 5 * scale;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(0, 0, w, h);

    const oxMinor = (((offset[0] * scale) % minor) + minor) % minor;
    const oyMinor = (((offset[1] * scale) % minor) + minor) % minor;
    const oxMajor = (((offset[0] * scale) % major) + major) % major;
    const oyMajor = (((offset[1] * scale) % major) + major) % major;

    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1;
    for (let x = oxMinor; x < w; x += minor) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = oyMinor; y < h; y += minor) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#94A3B8";
    for (let x = oxMajor; x < w; x += major) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = oyMajor; y < h; y += major) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  destroy() {
    this.resizeObserver.disconnect();
    if (this.lgraph?.stop) {
      this.lgraph.stop();
    }
    if (this.canvasEl.parentNode) {
      this.canvasEl.parentNode.removeChild(this.canvasEl);
    }
  }
}

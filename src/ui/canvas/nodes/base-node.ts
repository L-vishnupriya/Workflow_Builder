// @ts-ignore - litegraph.js does not provide official typings
import { LGraphNode, LiteGraph } from "litegraph.js";
import { WorkflowEngine } from "../../../core/engine/workflow-engine";
import type { NodeType } from "../../../shared/types/index";

export type NodeStatusType = "UNCONFIGURED" | "CONFIGURED" | "INVALID";

export class BaseWorkflowNode extends LGraphNode {
  workflowNodeId!: string;
  nodeStatus: NodeStatusType = "UNCONFIGURED";
  engine!: WorkflowEngine;
  params: any = null;
  private isHovering = false;

  constructor() {
    super();
    const noTitleMode = (LiteGraph as any).NO_TITLE;
    if (typeof noTitleMode === "number") {
      (this.constructor as any).title_mode = noTitleMode;
    }
    // Some basic setup can go here, but since litegraph instantiates these
    // internally sometimes, we set properties mostly via initialize
  }

  // A custom initializer called when we construct it
  initialize(workflowNodeId: string, engine: WorkflowEngine) {
    this.workflowNodeId = workflowNodeId;
    this.engine = engine;
    this.title = this.getNodeTitle(this.getWorkflowNodeType());
    this.color = "#FFFFFF";
    this.bgcolor = this.getNodeColor(this.getWorkflowNodeType());
    this.size = [240, 110]; // Set base size for all nodes

    // Keep only the custom card rendering and suppress LiteGraph's default title pass.
    const noTitleMode = (LiteGraph as any).NO_TITLE;
    if (typeof noTitleMode === "number") {
      (this as any).title_mode = noTitleMode;
    }
  }

  protected layoutSlots(): void {
    const width = this.size[0] ?? 240;
    const height = this.size[1] ?? 110;
    const inputs = this.inputs ?? [];
    const outputs = this.outputs ?? [];

    if (inputs.length > 0) {
      const startY = height * 0.44;
      const step = inputs.length > 1 ? 16 : 0;
      inputs.forEach((slot: any, index: number) => {
        slot.pos = [0, startY + index * step];
        slot.label = " ";
      });
    }

    if (outputs.length > 0) {
      const startY = height * 0.44;
      const step = outputs.length > 1 ? 16 : 0;
      outputs.forEach((slot: any, index: number) => {
        slot.pos = [width, startY + index * step];
        slot.label = " ";
      });
    }
  }

  getWorkflowNodeType(): string {
    return "base"; // Overridden by subclasses
  }

  getNodeTitle(type: string): string {
    switch (type) {
      case "audience":
        return "Audience";
      case "wait":
        return "Wait";
      case "filter":
        return "Filter";
      case "action":
        return "Action";
      case "split":
        return "Split";
      case "end":
        return "End";
      default:
        return "Node";
    }
  }

  getNodeColor(type: string): string {
    switch (type) {
      case "audience":
        return "#F97316";
      case "wait":
        return "#6366F1";
      case "filter":
        return "#F59E0B";
      case "action":
        return "#10B981";
      case "split":
        return "#8B5CF6";
      case "end":
        return "#6B7280";
      default:
        return "#94A3B8";
    }
  }

  getBgColor(hexColor: string): string {
    // Generate a slightly darker hue for the border/bgcolor using basic string manip or fixed lookups
    switch (hexColor) {
      case "#E8F4FD":
        return "#B6DCF8";
      case "#FFF9E6":
        return "#FFE799";
      case "#FDE8E8":
        return "#F8B5B5";
      case "#E8F9EE":
        return "#A6E5BE";
      case "#F0E8FD":
        return "#CDB4F8";
      case "#F5F5F5":
        return "#CCCCCC";
      default:
        return "#BBBBBB";
    }
  }

  onDrawBackground(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): void {
    const width = this.size[0];
    const height = this.size[1];

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 10);
    ctx.fill();
    ctx.restore();

    // Subtle typed header tint gives stronger hierarchy between node kinds.
    ctx.fillStyle = this.toRgba(this.bgcolor, 0.1);
    ctx.beginPath();
    ctx.roundRect(0, 0, width, 30, 10);
    ctx.fill();

    const isSelected =
      !!(this as any).selected || !!(this as any).flags?.selected;
    ctx.lineWidth = isSelected ? 2 : 1.25;
    ctx.strokeStyle = isSelected ? "#F97316" : "#BFC8D4";
    ctx.stroke();

    // Left accent rail by node type.
    ctx.fillStyle = this.bgcolor;
    ctx.beginPath();
    ctx.roundRect(0, 0, 6, height, 10);
    ctx.fill();

    if (this.nodeStatus === "UNCONFIGURED") {
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.arc(width - 14, 14, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.nodeStatus === "INVALID") {
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.arc(width - 14, 14, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.nodeStatus === "CONFIGURED") {
      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.arc(width - 14, 14, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  onDrawForeground(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): void {
    const titleY = 22;
    const summaryY = 54;
    const textMaxWidth = this.size[0] - 20;

    ctx.font = "700 15px Inter, sans-serif";
    ctx.fillStyle = "#111827";
    this.drawTruncatedText(ctx, this.title, 12, titleY, textMaxWidth);

    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 32);
    ctx.lineTo(this.size[0] - 10, 32);
    ctx.stroke();

    if (this.nodeStatus === "CONFIGURED" && this.params) {
      const summary = this.formatParamSummary(this.params);
      if (summary) {
        ctx.fillStyle = "#374151";
        ctx.font = "13px Inter, sans-serif";
        this.drawTruncatedText(ctx, summary, 12, summaryY, textMaxWidth);
      }
    }

    if (
      this.isHovering ||
      !!(this as any).selected ||
      !!(this as any).flags?.selected
    ) {
      const barX = this.size[0] - 58;
      const barY = this.size[1] - 24;
      const barW = 48;
      const barH = 18;

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#374151";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText("⚙", barX + 8, barY + 13);
      ctx.fillStyle = "#DC2626";
      ctx.fillText("🗑", barX + 28, barY + 13);
    }
  }

  private drawTruncatedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
  ): void {
    if (!text) return;

    const ellipsis = "...";
    if (ctx.measureText(text).width <= maxWidth) {
      ctx.fillText(text, x, y);
      return;
    }

    let value = text;
    while (
      value.length > 0 &&
      ctx.measureText(value + ellipsis).width > maxWidth
    ) {
      value = value.slice(0, -1);
    }
    ctx.fillText(value + ellipsis, x, y);
  }

  private toRgba(hexColor: string, alpha: number): string {
    const hex = hexColor.replace("#", "");
    if (hex.length !== 6) return `rgba(17, 24, 39, ${alpha})`;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  formatParamSummary(params: any): string {
    return ""; // Overridden by subclasses
  }

  onDblClick(e: MouseEvent, pos: number[]): boolean {
    if (this.engine) {
      this.engine.events.emit("node:dblclick", {
        nodeId: this.workflowNodeId,
        nodeType: this.getWorkflowNodeType() as NodeType,
        params: this.params,
      });
    }
    return true;
  }

  onMouseEnter(): void {
    this.isHovering = true;
    this.setDirtyCanvas(true, true);
  }

  onMouseLeave(): void {
    this.isHovering = false;
    this.setDirtyCanvas(true, true);
  }

  onMouseDown(e: MouseEvent, pos: number[]): boolean {
    const x = pos[0];
    const y = pos[1];
    const barX = this.size[0] - 58;
    const barY = this.size[1] - 24;

    if (x >= barX + 4 && x <= barX + 20 && y >= barY + 2 && y <= barY + 16) {
      // Gear icon -> open configuration
      if (this.engine) {
        this.engine.events.emit("node:dblclick", {
          nodeId: this.workflowNodeId,
          nodeType: this.getWorkflowNodeType() as NodeType,
          params: this.params,
        });
      }
      return true;
    }

    if (x >= barX + 24 && x <= barX + 44 && y >= barY + 2 && y <= barY + 16) {
      // Trash icon -> remove node from canvas. EngineSync handles notifying the core engine.
      if (this.graph) {
        this.graph.remove(this);
      }
      return true;
    }

    return false;
  }



  markConfigured(params?: any): void {
    this.nodeStatus = "CONFIGURED";
    if (params) this.params = params;
    this.setDirtyCanvas(true, true);
  }

  markInvalid(errors: any[]): void {
    this.nodeStatus = "INVALID";
    this.setDirtyCanvas(true, true);
  }

  markUnconfigured(): void {
    this.nodeStatus = "UNCONFIGURED";
    this.params = null;
    this.setDirtyCanvas(true, true);
  }
}

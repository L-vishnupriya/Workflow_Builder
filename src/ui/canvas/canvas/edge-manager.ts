// @ts-ignore
import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";
import { WorkflowEngine } from "../../../core/engine/workflow-engine";
import { CanvasManager } from "./canvas-manager";

export class EdgeManager {
  engine: WorkflowEngine;
  private canvasManager: CanvasManager;
  private lgraph: any = null;
  private lcanvas: any = null;

  private isSyncing: boolean = false;
  private edgeIdMap = new Map<number, string>();

  constructor(engine: WorkflowEngine, canvasManager: CanvasManager) {
    this.engine = engine;
    this.canvasManager = canvasManager;
  }

  initialize(): void {
    this.lgraph = this.canvasManager.lgraph;
    this.lcanvas = this.canvasManager.lcanvas;
    this.configureEdgeStyles();
    this.hookValidation();
  }

  setSyncing(value: boolean) {
    this.isSyncing = value;
    if (value) {
      this.edgeIdMap.clear();
    }
  }

  registerLinkMap(linkId: number, edgeId: string): void {
    this.edgeIdMap.set(linkId, edgeId);
  }

  private configureEdgeStyles() {
    (LiteGraph as any).LINK_RENDER_MODE = (LiteGraph as any).SPLINE_LINK;

    // We can override lcanvas.drawLink here if we want deep custom drawing
    // For now we stick to custom colors and standard splines
  }

  private hookValidation() {
    if (!this.lgraph) return;
    // Intercept when a connection lands
    this.lgraph.onNodeConnectionChange = (
      type: number,
      node: any,
      slot: number,
      targetNode: any,
      targetSlot: number,
    ) => {
      // type === 1 means connection created, type === 2 means disconnected
      if (type === 1 /* LiteGraph.INPUT or CONNECTED */ && targetNode) {
        // Prevent self-connection
        if (node.id === targetNode.id) {
          this.lgraph.disconnectNodeInput(node, slot); // revert
          return;
        }

        // Skip engine sync during graph reconstruction - EngineSync handles that separately
        if (this.isSyncing) return;

        // IMPORTANT: In LiteGraph's onNodeConnectionChange, `node` is the node
        // receiving the INPUT, and `targetNode` is the node providing the OUTPUT.
        // So `targetNode` is source and `node` is target in DAG terms.
        const sourceId = targetNode.workflowNodeId;
        const targetId = node.workflowNodeId;

        if (sourceId && targetId) {
          // Verify with engine
          const result = this.engine.connectNodes(sourceId, targetId);

          if ("valid" in result && !result.valid) {
            // Cycle detected or duplication error
            console.warn("Validation failed:", result.errors);

            // Revert the connection immediately in UI
            // Depending on the version of LiteGraph, inputs are tracked on targetNode
            targetNode.disconnectInput(targetSlot);

            // Optional: Show toast or UI flash
          } else if (!("valid" in result)) {
            const linkId = targetNode?.inputs?.[targetSlot]?.link;
            if (typeof linkId === "number") {
              this.edgeIdMap.set(linkId, result.id);
            }
          }
        }
      } else if (type === 2 /* DISCONNECTED */ && targetNode) {
        if (this.isSyncing) return;

        const existingLinkIds = new Set<number>(
          Object.keys(this.lgraph?.links || {}).map((k) => Number(k)),
        );

        for (const [linkId, edgeId] of this.edgeIdMap.entries()) {
          if (!existingLinkIds.has(linkId)) {
            const result = this.engine.deleteEdge(edgeId);
            if (result.valid) {
              this.edgeIdMap.delete(linkId);
            }
            break;
          }
        }
      }
    };
  }
}

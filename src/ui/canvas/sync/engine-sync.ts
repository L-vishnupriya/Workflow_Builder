// @ts-ignore
import { LGraph, LiteGraph } from "litegraph.js";
import { WorkflowEngine } from "../../../core/engine/workflow-engine";
import { WorkflowGraph, NodeType } from "../../../shared/types/index";
import { BaseWorkflowNode } from "../nodes/base-node";
import { EdgeManager } from "../canvas/edge-manager";

export class EngineSync {
  engine: WorkflowEngine;
  lgraph: any;
  lcanvas: any;

  nodeIdMap = new Map<number, string>(); // litegraph ID -> engine ID
  reverseNodeIdMap = new Map<string, number>(); // engine ID -> litegraph ID
  edgeIdMap = new Map<number, string>(); // litegraph link ID -> engine Edge ID

  private isSyncing = false;
  private edgeManager: EdgeManager | null = null;

  constructor(
    engine: WorkflowEngine,
    lgraph: any,
    edgeManager?: EdgeManager,
    lcanvas?: any,
  ) {
    this.engine = engine;
    this.lgraph = lgraph;
    this.lcanvas = lcanvas || null;
    this.edgeManager = edgeManager || null;

    this.hookLiteGraphEvents();
    this.hookEngineEvents();
  }

  private hookLiteGraphEvents() {
    this.lgraph.onNodeAdded = (lgNode: BaseWorkflowNode) => {
      if (this.isSyncing) return; // Prevent infinite loop when loading JSON

      // Note: LiteGraph triggers this when a node is dragged onto the canvas.
      // We need to create it in the Workflow Engine.
      const type = lgNode.getWorkflowNodeType
        ? lgNode.getWorkflowNodeType()
        : lgNode.type?.replace("c1x/", "");
      if (!type) return;

      const position = { x: lgNode.pos[0], y: lgNode.pos[1] };
      const engineNode = this.engine.addNode(type, position);

      // Initialize the litegraph node with the engine's ID
      if (lgNode.initialize) {
        lgNode.initialize(engineNode.id, this.engine);
      }

      this.nodeIdMap.set(lgNode.id, engineNode.id);
      this.reverseNodeIdMap.set(engineNode.id, lgNode.id);

      // Open configuration immediately for newly dropped nodes.
      this.engine.events.emit("node:dblclick", {
        nodeId: engineNode.id,
        nodeType: type as NodeType,
        params: null,
      });
    };

    this.lgraph.onNodeRemoved = (lgNode: any) => {
      if (this.isSyncing) return;

      const engineId = this.nodeIdMap.get(lgNode.id);
      if (engineId) {
        this.engine.deleteNode(engineId);
        this.nodeIdMap.delete(lgNode.id);
        this.reverseNodeIdMap.delete(engineId);
      }
    };
  }

  private hookEngineEvents() {
    this.engine.events.on("node:configured", (payload: any) => {
      this.onEngineNodeConfigured(payload.nodeId, payload.params);
    });

    this.engine.events.on("validation:failed", (payload: any) => {
      this.onEngineValidationFailed(payload.errors);
    });

    this.engine.events.on("graph:changed", (payload: any) => {
      // triggered by undo/redo
      this.syncFullGraph(payload.graph);
    });

    this.engine.events.on("graph:loaded", (payload: any) => {
      // triggered by importJSON
      this.syncFullGraph(payload.graph);
    });
  }

  private onEngineNodeConfigured(nodeId: string, params: any) {
    const lgNodeId = this.reverseNodeIdMap.get(nodeId);
    if (lgNodeId === undefined) return;

    const lgNode = this.lgraph.getNodeById(lgNodeId) as BaseWorkflowNode;
    if (lgNode && lgNode.markConfigured) {
      lgNode.markConfigured(params);
    }
  }

  private onEngineValidationFailed(errors: any[]) {
    for (const error of errors) {
      if (error.nodeId) {
        const lgNodeId = this.reverseNodeIdMap.get(error.nodeId);
        if (lgNodeId !== undefined) {
          const lgNode = this.lgraph.getNodeById(lgNodeId) as BaseWorkflowNode;
          if (lgNode && lgNode.markInvalid) {
            lgNode.markInvalid([error]);
          }
        }
      }
    }
  }

  syncFullGraph(graph: WorkflowGraph) {
    this.isSyncing = true;
    this.edgeManager?.setSyncing(true);
    try {
      // Save current positions to prevent jitter if nodes still exist
      const positions = new Map<string, [number, number]>();
      for (const node of this.lgraph._nodes) {
        const engineId = this.nodeIdMap.get(node.id);
        if (engineId) positions.set(engineId, [node.pos[0], node.pos[1]]);
      }

      this.lgraph.clear();
      this.lgraph.start(); // Restart rendering loop - clear() stops it
      this.nodeIdMap.clear();
      this.reverseNodeIdMap.clear();
      this.edgeIdMap.clear();

      // 1. Recreate Nodes
      for (const engineNode of graph.nodes) {
        const typeStr = `c1x/${engineNode.type}`;
        const lgNode = LiteGraph.createNode(typeStr) as BaseWorkflowNode;
        if (!lgNode) continue;

        if (positions.has(engineNode.id)) {
          const pos = positions.get(engineNode.id)!;
          lgNode.pos = [pos[0], pos[1]];
        } else {
          lgNode.pos = [engineNode.position.x, engineNode.position.y];
        }

        if (lgNode.initialize) {
          lgNode.initialize(engineNode.id, this.engine);
        }

        if (engineNode.status === "CONFIGURED") {
          lgNode.markConfigured(engineNode.params);
        }

        this.lgraph.add(lgNode);
        this.nodeIdMap.set(lgNode.id, engineNode.id);
        this.reverseNodeIdMap.set(engineNode.id, lgNode.id);
      }

      // 2. Recreate Edges
      for (const edge of graph.edges) {
        const sourceLgId = this.reverseNodeIdMap.get(edge.source);
        const targetLgId = this.reverseNodeIdMap.get(edge.target);

        if (sourceLgId !== undefined && targetLgId !== undefined) {
          const sourceNode = this.lgraph.getNodeById(sourceLgId);
          const targetNode = this.lgraph.getNodeById(targetLgId);

          if (sourceNode && targetNode) {
            // Find outputs/inputs (simplistic logic: assumes output 0 connects to input 0 typically)
            // Realistically, for split node it matters, but we'll connect 0 to 0 for standard cases
            const outSlot = 0;
            const inSlot = 0;

            const linkResult = sourceNode.connect(outSlot, targetNode, inSlot);
            // LiteGraph returns either a link object or id depending on version.
            const linkId =
              typeof linkResult === "number"
                ? linkResult
                : (linkResult?.id ?? targetNode?.inputs?.[inSlot]?.link);
            if (typeof linkId === "number") {
              this.edgeManager?.registerLinkMap(linkId, edge.id);
            }
          }
        }
      }
    } catch (err) {
      console.error("FATAL ERROR in EngineSync.syncFullGraph:", err);
    } finally {
      this.isSyncing = false;
      this.edgeManager?.setSyncing(false);
      // Force canvas to redraw via both paths
      this.lgraph.setDirtyCanvas(true, true);
      if (this.lcanvas) {
        this.lcanvas.draw(true, true);
      }
    }
  }
}

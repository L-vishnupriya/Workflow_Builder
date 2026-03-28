import {
  WorkflowGraph,
  WorkflowNode,
  Edge,
  Position,
  ValidationResult,
} from "../../shared/types/index";
import { EventBus } from "../events/event-bus";
import { HistoryManager } from "../history/history-manager";
import {
  generateNodeId,
  generateEdgeId,
  generateWorkflowId,
} from "../../shared/utils/id-generator";
import { wouldCreateCycle } from "../graph/adjacency";
import { DAGValidator } from "../validator/dag-validator";
import { JSONSerializer } from "../serializer/json-serializer";

export class WorkflowStore {
  private graph: WorkflowGraph;
  private eventBus: EventBus;
  private historyManager: HistoryManager;

  constructor(
    eventBus: EventBus,
    historyManager: HistoryManager,
    workflowId?: string,
  ) {
    this.eventBus = eventBus;
    this.historyManager = historyManager;
    this.graph = {
      workflowId: workflowId || generateWorkflowId(),
      nodes: [],
      edges: [],
    };
  }

  private pushSnapshot(): void {
    const snapshot = JSON.parse(JSON.stringify(this.graph));
    this.historyManager.push({ timestamp: Date.now(), graph: snapshot });
  }

  getGraph(): WorkflowGraph {
    return this.graph;
  }

  addNode(type: string, position: Position): WorkflowNode {
    this.pushSnapshot();

    const node: WorkflowNode = {
      id: generateNodeId(),
      type: type as any,
      position,
      status: "UNCONFIGURED",
      createdAt: Date.now(),
      params: {} as any,
    };

    this.graph.nodes.push(node);
    this.eventBus.emit("node:added", { node });
    return node;
  }

  configureNode(nodeId: string, params: any): ValidationResult {
    const node = this.graph.nodes.find((n: any) => n.id === nodeId);
    if (!node) {
      return {
        valid: false,
        errors: [
          {
            code: "NODE_NOT_FOUND",
            message: `No node found with id ${nodeId}`,
            nodeId,
          },
        ],
      };
    }

    // A temporary graph for validation
    const tempGraph: WorkflowGraph = JSON.parse(JSON.stringify(this.graph));
    const tempNode = tempGraph.nodes.find((n: any) => n.id === nodeId)!;
    tempNode.params = params;
    tempNode.status = "CONFIGURED";

    // Validate the params using DAGValidator with the temporary graph
    const paramErrors = DAGValidator.validateNodeParams(tempGraph).filter(
      (e: any) => e.nodeId === nodeId,
    );
    if (paramErrors.length > 0) {
      this.eventBus.emit("validation:failed", { errors: paramErrors });
      return { valid: false, errors: paramErrors };
    }

    this.pushSnapshot();

    node.params = params;
    node.status = "CONFIGURED";

    this.eventBus.emit("node:configured", { nodeId, params });
    return { valid: true, errors: [] };
  }

  deleteNode(nodeId: string): boolean {
    const nodeIndex = this.graph.nodes.findIndex((n: any) => n.id === nodeId);
    if (nodeIndex === -1) return false;

    this.pushSnapshot();

    const edgesToRemove = this.graph.edges.filter(
      (e: any) => e.source === nodeId || e.target === nodeId,
    );

    // Remove edges
    this.graph.edges = this.graph.edges.filter(
      (e: any) => e.source !== nodeId && e.target !== nodeId,
    );
    // Remove node
    this.graph.nodes.splice(nodeIndex, 1);

    this.eventBus.emit("node:deleted", { nodeId });
    for (const edge of edgesToRemove) {
      this.eventBus.emit("edge:deleted", { edgeId: edge.id });
    }

    return true;
  }

  deleteEdge(edgeId: string): ValidationResult {
    const edgeIndex = this.graph.edges.findIndex((e) => e.id === edgeId);
    if (edgeIndex === -1) {
      return {
        valid: false,
        errors: [
          {
            code: "EDGE_NOT_FOUND",
            message: `No edge found with id ${edgeId}`,
            edgeId,
          },
        ],
      };
    }

    this.pushSnapshot();
    this.graph.edges.splice(edgeIndex, 1);
    this.eventBus.emit("edge:deleted", { edgeId });

    return { valid: true, errors: [] };
  }

  addEdge(sourceId: string, targetId: string): Edge | ValidationResult {
    const sourceNode = this.graph.nodes.find((n: any) => n.id === sourceId);
    const targetNode = this.graph.nodes.find((n: any) => n.id === targetId);

    if (!sourceNode || !targetNode) {
      return {
        valid: false,
        errors: [
          {
            code: "NODE_NOT_FOUND",
            message: "Source or target node not found",
          },
        ],
      };
    }

    const existingEdge = this.graph.edges.find(
      (e: any) => e.source === sourceId && e.target === targetId,
    );
    if (existingEdge) {
      return {
        valid: false,
        errors: [{ code: "DUPLICATE_EDGE", message: "Edge already exists" }],
      };
    }

    if (wouldCreateCycle(sourceId, targetId, this.graph.edges)) {
      const error = [
        {
          code: "CYCLE_DETECTED",
          message: "Adding this edge would create a cycle.",
        },
      ];
      this.eventBus.emit("validation:failed", { errors: error });
      return { valid: false, errors: error };
    }

    this.pushSnapshot();

    const edge: Edge = {
      id: generateEdgeId(sourceId, targetId),
      source: sourceId,
      target: targetId,
      createdAt: Date.now(),
    };

    this.graph.edges.push(edge);
    this.eventBus.emit("edge:added", { edge });

    return edge;
  }

  loadGraph(jsonString: string): ValidationResult {
    try {
      const parsedGraph = JSONSerializer.importFromJSON(jsonString);
      const validation = DAGValidator.validate(parsedGraph);

      if (!validation.valid) {
        this.eventBus.emit("validation:failed", { errors: validation.errors });
      }

      this.pushSnapshot();
      this.graph = parsedGraph;
      this.eventBus.emit("graph:loaded", { graph: this.graph });

      return validation;
    } catch (e) {
      return {
        valid: false,
        errors: [{ code: "PARSE_ERROR", message: (e as Error).message }],
      };
    }
  }

  restoreSnapshot(snapshot: { timestamp: number; graph: WorkflowGraph }): void {
    // Replaces state directly (used by engine undo)
    this.graph = JSON.parse(JSON.stringify(snapshot.graph));
  }

  clear(workflowId?: string): void {
    this.pushSnapshot();
    this.graph = {
      workflowId: workflowId || this.graph.workflowId || generateWorkflowId(),
      nodes: [],
      edges: [],
    };
    this.eventBus.emit("graph:changed", { graph: this.graph });
  }
}

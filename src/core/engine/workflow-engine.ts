import { EventBus } from "../events/event-bus";
import { HistoryManager } from "../history/history-manager";
import { WorkflowStore } from "../store/workflow-store";
import { DAGValidator } from "../validator/dag-validator";
import { JSONSerializer, ExportOptions } from "../serializer/json-serializer";
import {
  EngineConfig,
  ValidationResult,
  WorkflowNode,
  Edge,
  Position,
  WorkflowGraph,
} from "../../shared/types/index";

export class WorkflowEngine {
  private config: EngineConfig;
  private eventBus: EventBus;
  private historyManager: HistoryManager;
  private store: WorkflowStore;
  private destroyed: boolean = false;

  constructor(config?: EngineConfig) {
    this.config = {
      maxHistory: config?.maxHistory ?? 50,
      maxBranchesPerSplit: config?.maxBranchesPerSplit,
      workflowId: config?.workflowId,
    };

    this.eventBus = new EventBus();
    this.historyManager = new HistoryManager(
      this.eventBus,
      this.config.maxHistory,
    );
    this.store = new WorkflowStore(
      this.eventBus,
      this.historyManager,
      this.config.workflowId,
    );
  }

  private ensureNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error("WorkflowEngine has been destroyed");
    }
  }

  // --- Exposed properties ---
  get events(): EventBus {
    return this.eventBus;
  }

  getGraph(): WorkflowGraph {
    this.ensureNotDestroyed();
    return this.store.getGraph();
  }

  // --- Store operations ---

  addNode(type: string, position: Position): WorkflowNode {
    this.ensureNotDestroyed();
    return this.store.addNode(type, position);
  }

  configureNode(nodeId: string, params: any): ValidationResult {
    this.ensureNotDestroyed();
    return this.store.configureNode(nodeId, params);
  }

  deleteNode(nodeId: string): boolean {
    this.ensureNotDestroyed();
    return this.store.deleteNode(nodeId);
  }

  connectNodes(sourceId: string, targetId: string): Edge | ValidationResult {
    this.ensureNotDestroyed();
    return this.store.addEdge(sourceId, targetId);
  }

  deleteEdge(edgeId: string): ValidationResult {
    this.ensureNotDestroyed();
    const result = this.store.deleteEdge(edgeId);
    if (result.valid) {
      this.emitHistoryState();
    }
    return result;
  }

  // --- Validation ---

  validate(): ValidationResult {
    this.ensureNotDestroyed();
    return DAGValidator.validate(this.store.getGraph());
  }

  // --- History operations ---

  undo(): void {
    this.ensureNotDestroyed();

    // Save current state first
    const currentState = {
      timestamp: Date.now(),
      graph: JSON.parse(JSON.stringify(this.store.getGraph())),
    };
    const snapshot = this.historyManager.undo(currentState);

    if (snapshot) {
      this.store.restoreSnapshot(snapshot);
      this.emitHistoryState();
      // Optionally emit a graph:loaded or changed event so views update
      this.eventBus.emit("graph:changed", { graph: this.store.getGraph() });
    }
  }

  redo(): void {
    this.ensureNotDestroyed();

    const currentState = {
      timestamp: Date.now(),
      graph: JSON.parse(JSON.stringify(this.store.getGraph())),
    };
    const snapshot = this.historyManager.redo(currentState);

    if (snapshot) {
      this.store.restoreSnapshot(snapshot);
      this.emitHistoryState();
      this.eventBus.emit("graph:changed", { graph: this.store.getGraph() });
    }
  }

  // --- IO operations ---

  exportJSON(options?: ExportOptions): string {
    this.ensureNotDestroyed();
    return JSONSerializer.exportToJSON(this.store.getGraph(), options);
  }

  importJSON(jsonString: string): ValidationResult {
    this.ensureNotDestroyed();
    return this.store.loadGraph(jsonString);
  }

  clear(): void {
    this.ensureNotDestroyed();
    this.store.clear(this.config.workflowId);
    this.emitHistoryState();
  }

  private emitHistoryState(): void {
    this.eventBus.emit("history:changed", {
      canUndo: this.historyManager.canUndo(),
      canRedo: this.historyManager.canRedo(),
    });
  }

  // --- Cleanup ---

  destroy(): void {
    if (this.destroyed) return;

    this.eventBus.clear();
    this.historyManager.clear();
    // store doesn't have a clear, but getting GC'd anyway
    this.destroyed = true;
  }
}

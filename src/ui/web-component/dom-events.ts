import {
  WorkflowGraph,
  WorkflowNode,
  ValidationError,
} from "../../shared/types/index";

export const WF_EVENTS = {
  CHANGE: "workflow-change",
  NODE_ADDED: "workflow-node-added",
  NODE_CONFIGURED: "workflow-node-configured",
  NODE_DELETED: "workflow-node-deleted",
  EDGE_ADDED: "workflow-edge-added",
  EDGE_DELETED: "workflow-edge-deleted",
  HISTORY_CHANGED: "workflow-history-changed",
  VALIDATION_FAILED: "workflow-validation-failed",
  READY: "workflow-ready",
  DESTROYED: "workflow-destroyed",
} as const;

export interface WorkflowChangeDetail {
  workflowId: string;
  graph: WorkflowGraph;
  json: string;
}

export interface NodeAddedDetail {
  node: WorkflowNode;
}
export interface NodeConfiguredDetail {
  nodeId: string;
  params: any;
}
export interface NodeDeletedDetail {
  nodeId: string;
}
export interface EdgeAddedDetail {
  edge: any;
}
export interface EdgeDeletedDetail {
  edgeId: string;
}
export interface HistoryChangedDetail {
  canUndo: boolean;
  canRedo: boolean;
}
export interface ValidationFailedDetail {
  errors: ValidationError[];
}

export function dispatchWorkflowEvent(
  element: HTMLElement,
  eventName: string,
  detail: any,
) {
  const event = new CustomEvent(eventName, {
    bubbles: true,
    composed: true,
    detail,
  });
  element.dispatchEvent(event);
}

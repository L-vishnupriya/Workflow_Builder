export type NodeStatus = "UNCONFIGURED" | "CONFIGURED";

export interface Position {
  x: number;
  y: number;
}

export interface BaseNode {
  id: string;
  type: string;
  position: Position;
  status: NodeStatus;
  createdAt: number;
  params: Record<string, any>;
}

export interface AudienceParams {
  segmentName: string;
  days?: number;
}

export interface WaitParams {
  duration: number;
  unit: "minutes" | "hours" | "days" | "weeks";
}

export interface FilterParams {
  condition: string;
  value: string;
}

export interface ActionParams {
  channel: string;
  templateId: string;
}

export interface SplitParams {
  condition: string;
  branches: string[];
}

export interface EndParams {
  label?: string;
}

export interface AudienceNode extends BaseNode {
  type: "audience";
  params: AudienceParams;
}

export interface WaitNode extends BaseNode {
  type: "wait";
  params: WaitParams;
}

export interface FilterNode extends BaseNode {
  type: "filter";
  params: FilterParams;
}

export interface ActionNode extends BaseNode {
  type: "action";
  params: ActionParams;
}

export interface SplitNode extends BaseNode {
  type: "split";
  params: SplitParams;
}

export interface EndNode extends BaseNode {
  type: "end";
  params: EndParams;
}

export type WorkflowNode =
  | AudienceNode
  | WaitNode
  | FilterNode
  | ActionNode
  | SplitNode
  | EndNode;
export type NodeType = WorkflowNode["type"];

export interface Edge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  createdAt?: number;
}

export interface WorkflowGraph {
  workflowId: string;
  nodes: WorkflowNode[];
  edges: Edge[];
}

export interface ValidationError {
  code: string; // e.g., 'CYCLE_DETECTED'
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface EventPayloads {
  "node:added": { node: WorkflowNode };
  "node:configured": { nodeId: string; params: any };
  "node:deleted": { nodeId: string };
  "node:moved": { nodeId: string; position: Position };
  "edge:added": { edge: Edge };
  "edge:deleted": { edgeId: string };
  "graph:loaded": { graph: WorkflowGraph };
  "graph:changed": { graph: WorkflowGraph };
  "validation:failed": { errors: ValidationError[] };
  "history:changed": { canUndo: boolean; canRedo: boolean };
  "node:dblclick": {
    nodeId: string;
    nodeType: NodeType;
    params: Record<string, any> | null;
  };
}

export type EventName = keyof EventPayloads;

export interface HistorySnapshot {
  timestamp: number;
  graph: WorkflowGraph;
}

export interface EngineConfig {
  maxHistory?: number;
  maxBranchesPerSplit?: number;
  workflowId?: string;
}

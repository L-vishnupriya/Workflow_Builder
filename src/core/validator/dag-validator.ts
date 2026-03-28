import {
  WorkflowGraph,
  ValidationResult,
  ValidationError,
  WorkflowNode,
} from "../../shared/types/index";
import {
  topologicalSort,
  getRootNodes,
  getTerminalNodes,
  findCyclePath,
  buildAdjacencyList,
} from "../graph/adjacency";

export class DAGValidator {
  static validate(graph: WorkflowGraph): ValidationResult {
    const errors: ValidationError[] = [
      ...DAGValidator.validateNonEmptyWorkflow(graph),
      ...DAGValidator.validateNoCycles(graph),
      ...DAGValidator.validateNodeParams(graph),
      ...DAGValidator.validateSingleRoot(graph),
      ...DAGValidator.validateEndNode(graph),
      ...DAGValidator.validateNoOrphanEdges(graph),
      ...DAGValidator.validateNoDetachedNodes(graph),
    ];

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateNonEmptyWorkflow(graph: WorkflowGraph): ValidationError[] {
    if (graph.nodes.length === 0) {
      return [
        {
          code: "EMPTY_WORKFLOW",
          message: "Workflow is empty. Add at least one node to begin.",
        },
      ];
    }
    return [];
  }

  static validateNoCycles(graph: WorkflowGraph): ValidationError[] {
    const sorted = topologicalSort(graph.nodes, graph.edges);
    if (sorted !== null) {
      return [];
    }

    const cyclePath = findCyclePath(graph.nodes, graph.edges);
    const pathStr = cyclePath
      ? ` Nodes involved: ${cyclePath.join(" -> ")} -> ${cyclePath[0]}`
      : "";

    return [
      {
        code: "CYCLE_DETECTED",
        message: `Your workflow contains a loop which is not allowed.${pathStr}`,
      },
    ];
  }

  static validateNodeParams(graph: WorkflowGraph): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const node of graph.nodes) {
      if (node.status === "UNCONFIGURED") {
        errors.push({
          code: "UNCONFIGURED_NODE",
          message: "Node is not configured yet.",
          nodeId: node.id,
        });
        continue;
      }

      if (!node.params) {
        errors.push({
          code: "MISSING_PARAMS",
          message: `Node is missing params completely.`,
          nodeId: node.id,
        });
        continue;
      }

      switch (node.type) {
        case "audience":
          if (
            !node.params.segmentName ||
            typeof node.params.segmentName !== "string" ||
            node.params.segmentName.trim() === ""
          ) {
            errors.push({
              code: "INVALID_PARAM",
              message: "Audience node must have a non-empty segmentName.",
              nodeId: node.id,
            });
          }
          if (
            node.params.days !== undefined &&
            (typeof node.params.days !== "number" || node.params.days <= 0)
          ) {
            errors.push({
              code: "INVALID_PARAM",
              message: "Audience days must be a number greater than zero.",
              nodeId: node.id,
            });
          }
          break;
        case "wait":
          if (
            typeof node.params.duration !== "number" ||
            node.params.duration <= 0
          ) {
            errors.push({
              code: "INVALID_PARAM",
              message: "Wait node must have a duration greater than zero.",
              nodeId: node.id,
            });
          }
          if (
            !["minutes", "hours", "days", "weeks"].includes(node.params.unit)
          ) {
            errors.push({
              code: "INVALID_PARAM",
              message: "Wait node has invalid unit.",
              nodeId: node.id,
            });
          }
          break;
        case "filter":
          if (!node.params.condition || node.params.condition.trim() === "") {
            errors.push({
              code: "INVALID_PARAM",
              message: "Filter condition is missing.",
              nodeId: node.id,
            });
          }
          if (!node.params.value || node.params.value.trim() === "") {
            errors.push({
              code: "INVALID_PARAM",
              message: "Filter value is missing.",
              nodeId: node.id,
            });
          }
          break;
        case "action":
          if (!node.params.channel || node.params.channel.trim() === "") {
            errors.push({
              code: "INVALID_PARAM",
              message: "Action channel is missing.",
              nodeId: node.id,
            });
          }
          if (!node.params.templateId || node.params.templateId.trim() === "") {
            errors.push({
              code: "INVALID_PARAM",
              message: "Action templateId is missing.",
              nodeId: node.id,
            });
          }
          break;
        case "split":
          if (!node.params.condition || node.params.condition.trim() === "") {
            errors.push({
              code: "INVALID_PARAM",
              message: "Split node must have a condition.",
              nodeId: node.id,
            });
          }
          if (
            !Array.isArray(node.params.branches) ||
            node.params.branches.length < 2
          ) {
            errors.push({
              code: "INVALID_PARAM",
              message: "Split node must have at least 2 branches.",
              nodeId: node.id,
            });
          }
          break;
        case "end":
          // End nodes might not require params
          break;
        default:
          const n = node as any;
          errors.push({
            code: "UNKNOWN_NODE_TYPE",
            message: `Unknown node type: ${n.type}`,
            nodeId: n.id,
          });
      }
    }

    return errors;
  }

  static validateSingleRoot(graph: WorkflowGraph): ValidationError[] {
    if (graph.nodes.length === 0) return [];

    const rootNodes = getRootNodes(graph);

    if (rootNodes.length === 1) return [];

    if (rootNodes.length === 0) {
      return [
        {
          code: "NO_ROOT_NODE",
          message: "The workflow has no entry point (possibly cycle).",
        },
      ];
    }

    return [
      {
        code: "MULTIPLE_ROOTS",
        message:
          "The workflow contains multiple disconnected path streams. Only one entry is allowed.",
        nodeId: rootNodes.join(", "), // Or you could output multiple errors
      },
    ];
  }

  static validateEndNode(graph: WorkflowGraph): ValidationError[] {
    if (graph.nodes.length === 0) return [];

    const terminalNodesId = getTerminalNodes(graph);
    const errors: ValidationError[] = [];

    for (const id of terminalNodesId) {
      const node = graph.nodes.find((n: WorkflowNode) => n.id === id);
      if (node && node.type !== "end") {
        errors.push({
          code: "MISSING_END_NODE",
          message: "This path does not terminate in an End node.",
          nodeId: id,
        });
      }
    }

    return errors;
  }

  static validateNoOrphanEdges(graph: WorkflowGraph): ValidationError[] {
    const nodeIds = new Set(graph.nodes.map((n: any) => n.id));
    const errors: ValidationError[] = [];

    for (const edge of graph.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        errors.push({
          code: "ORPHAN_EDGE",
          message: "An edge exists between non-existent nodes.",
          edgeId: edge.id,
        });
      }
    }

    return errors;
  }

  static validateNoDetachedNodes(graph: WorkflowGraph): ValidationError[] {
    if (graph.nodes.length <= 1) return [];

    const connectedNodes = new Set<string>();
    for (const edge of graph.edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    const errors: ValidationError[] = [];
    for (const node of graph.nodes) {
      if (!connectedNodes.has(node.id)) {
        errors.push({
          code: "DETACHED_NODE",
          message: "This node is not connected to the workflow.",
          nodeId: node.id,
        });
      }
    }

    return errors;
  }
}

import { WorkflowGraph, WorkflowNode, Edge, Position } from '../../shared/types/index';
import { generateEdgeId } from '../../shared/utils/id-generator';

export interface ExportOptions {
  includePosition?: boolean;
}

export class JSONSerializer {
  
  /**
   * Exports the graph to a JSON string matching the external spec.
   */
  static exportToJSON(graph: WorkflowGraph, options: ExportOptions = {}): string {
    const { includePosition = false } = options;

    const exportedGraph = {
      workflowId: graph.workflowId,
      nodes: graph.nodes.map(node => {
        const exportedNode: any = {
          id: node.id,
          type: node.type,
          params: node.params
        };
        if (includePosition) {
          exportedNode.position = node.position;
        }
        return exportedNode;
      }),
      edges: graph.edges.map(edge => ({
        source: edge.source,
        target: edge.target
      }))
    };

    return JSON.stringify(exportedGraph, null, 2);
  }

  /**
   * Imports a JSON string and returns a complete internal WorkflowGraph.
   */
  static importFromJSON(jsonString: string): WorkflowGraph {
    let parsed: any;
    
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`Failed to parse workflow JSON: ${(e as Error).message}`);
    }

    if (!JSONSerializer.validateJSONShape(parsed)) {
      throw new Error('Invalid workflow JSON schema');
    }

    // Convert to internal graph structure
    const graph: WorkflowGraph = {
      workflowId: parsed.workflowId,
      nodes: parsed.nodes.map((node: any, index: number) => {
        // Simple automatic grid position if missing
        const position: Position = node.position || { x: index * 100, y: Math.floor(index / 5) * 100 };
        return {
          id: node.id,
          type: node.type,
          params: node.params,
          position,
          status: (node.params && Object.keys(node.params).length > 0) ? 'CONFIGURED' : 'UNCONFIGURED',
          createdAt: Date.now()
        } as WorkflowNode;
      }),
      edges: parsed.edges.map((edge: any) => ({
        id: generateEdgeId(edge.source, edge.target),
        source: edge.source,
        target: edge.target,
        createdAt: Date.now()
      }))
    };

    return graph;
  }

  /**
   * Type guard to ensure JSON shape is roughly correct
   */
  static validateJSONShape(obj: any): obj is { workflowId: string, nodes: any[], edges: any[] } {
    if (typeof obj !== 'object' || obj === null) return false;
    if (typeof obj.workflowId !== 'string') return false;
    if (!Array.isArray(obj.nodes)) return false;
    if (!Array.isArray(obj.edges)) return false;

    for (const node of obj.nodes) {
      if (!node.id || !node.type || !node.params) return false;
    }

    for (const edge of obj.edges) {
      if (!edge.source || !edge.target) return false;
    }

    return true;
  }
}

import { Edge, WorkflowNode, WorkflowGraph } from '../../shared/types/index';

/**
 * Builds an adjacency list mapping a source node ID to an array of target node IDs.
 */
export function buildAdjacencyList(edges: Edge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  
  for (const edge of edges) {
    if (!map.has(edge.source)) {
      map.set(edge.source, []);
    }
    map.get(edge.source)?.push(edge.target);
  }
  
  return map;
}

/**
 * Checks if adding an edge from sourceId to targetId would create a cycle.
 */
export function wouldCreateCycle(sourceId: string, targetId: string, edges: Edge[]): boolean {
  const adjacencyList = buildAdjacencyList(edges);
  const visited = new Set<string>();

  function dfs(currentId: string): boolean {
    if (currentId === sourceId) return true; // Found a path back to source
    if (visited.has(currentId)) return false;

    visited.add(currentId);
    
    const neighbors = adjacencyList.get(currentId) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    return false;
  }

  return dfs(targetId);
}

/**
 * Performs a topological sort on the graph using Kahn's algorithm.
 * Returns sorted node IDs if successful, or null if a cycle is detected.
 */
export function topologicalSort(nodes: WorkflowNode[], edges: Edge[]): string[] | null {
  const adjacencyList = buildAdjacencyList(edges);
  const inDegree = new Map<string, number>();

  // Initialize in-degrees
  for (const node of nodes) {
    inDegree.set(node.id, 0);
  }

  // Calculate in-degrees
  for (const edge of edges) {
    const currentCount = inDegree.get(edge.target) || 0;
    inDegree.set(edge.target, currentCount + 1);
  }

  const queue: string[] = [];
  // Enqueue root nodes (inDegree === 0)
  for (const [nodeId, count] of inDegree.entries()) {
    if (count === 0) {
      queue.push(nodeId);
    }
  }

  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const neighbors = adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      const currentCount = inDegree.get(neighbor) || 0;
      inDegree.set(neighbor, currentCount - 1);
      
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (result.length === nodes.length) {
    return result;
  }

  return null; // Cycle detected
}

/**
 * Builds a reverse adjacency list mapping target node ID to source node IDs.
 */
export function buildReverseAdjacencyList(edges: Edge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  
  for (const edge of edges) {
    if (!map.has(edge.target)) {
      map.set(edge.target, []);
    }
    map.get(edge.target)?.push(edge.source);
  }
  
  return map;
}

/**
 * Returns a set of all ancestor node IDs for a given node.
 */
export function getAncestors(nodeId: string, graph: WorkflowGraph): Set<string> {
  const reverseList = buildReverseAdjacencyList(graph.edges);
  const ancestors = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const parents = reverseList.get(current) || [];
    
    for (const parent of parents) {
      if (!ancestors.has(parent)) {
        ancestors.add(parent);
        queue.push(parent);
      }
    }
  }

  return ancestors;
}

/**
 * Returns a set of all descendant node IDs for a given node.
 */
export function getDescendants(nodeId: string, graph: WorkflowGraph): Set<string> {
  const adjacencyList = buildAdjacencyList(graph.edges);
  const descendants = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = adjacencyList.get(current) || [];
    
    for (const child of children) {
      if (!descendants.has(child)) {
        descendants.add(child);
        queue.push(child);
      }
    }
  }

  return descendants;
}

/**
 * Returns an array of node IDs that have no incoming edges.
 */
export function getRootNodes(graph: WorkflowGraph): string[] {
  const hasIncoming = new Set<string>();
  
  for (const edge of graph.edges) {
    hasIncoming.add(edge.target);
  }

  return graph.nodes.filter((node: any) => !hasIncoming.has(node.id)).map((node: any) => node.id);
}

/**
 * Returns an array of node IDs that have no outgoing edges.
 */
export function getTerminalNodes(graph: WorkflowGraph): string[] {
  const hasOutgoing = new Set<string>();
  
  for (const edge of graph.edges) {
    hasOutgoing.add(edge.source);
  }

  return graph.nodes.filter((node: any) => !hasOutgoing.has(node.id)).map((node: any) => node.id);
}

/**
 * Uses DFS to find and exactly report the node IDs involved in a cycle.
 */
export function findCyclePath(nodes: WorkflowNode[], edges: Edge[]): string[] | null {
  const adjacencyList = buildAdjacencyList(edges);
  const visited = new Set<string>();
  const visiting = new Set<string>();
  let cycleStartNode: string | null = null;
  const path: string[] = [];
  
  function dfs(currentId: string): boolean {
    if (visiting.has(currentId)) {
      cycleStartNode = currentId;
      return true; // Cycle found
    }
    if (visited.has(currentId)) return false;

    visiting.add(currentId);
    path.push(currentId);
    
    const neighbors = adjacencyList.get(currentId) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    visiting.delete(currentId);
    path.pop();
    visited.add(currentId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        // Extract the cycle from path
        if (cycleStartNode) {
          const index = path.indexOf(cycleStartNode);
          if (index !== -1) {
            return path.slice(index);
          }
        }
        return path;
      }
    }
  }

  return null;
}

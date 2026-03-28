/**
 * Fallback for environments without crypto.randomUUID
 */
function generateFallbackUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return generateFallbackUUID();
}

/**
 * Generates a unique node ID. Format: n_<8 chars>
 */
export function generateNodeId(): string {
  const uuid = getUUID();
  return `n_${uuid.substring(0, 8)}`;
}

/**
 * Generates an edge ID from source to target. Format: e_<source>_<target>
 */
export function generateEdgeId(sourceId: string, targetId: string): string {
  return `e_${sourceId}_${targetId}`;
}

/**
 * Generates a workflow ID. Format: c1x_<timestamp>_<4 chars>
 */
export function generateWorkflowId(): string {
  const timestamp = Date.now();
  const uuid = getUUID();
  const randomSuffix = uuid.substring(0, 4);
  return `c1x_${timestamp}_${randomSuffix}`;
}

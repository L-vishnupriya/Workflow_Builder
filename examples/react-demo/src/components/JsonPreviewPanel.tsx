type Props = {
  json: string;
};

export function JsonPreviewPanel({ json }: Props) {
  let pretty = json;
  let nodeCount = 0;
  let edgeCount = 0;

  try {
    const parsed = JSON.parse(json);
    pretty = JSON.stringify(parsed, null, 2);
    nodeCount = Array.isArray(parsed.nodes) ? parsed.nodes.length : 0;
    edgeCount = Array.isArray(parsed.edges) ? parsed.edges.length : 0;
  } catch {
    pretty = json;
  }

  return (
    <div className="json-panel-inner">
      <div className="json-summary">
        {nodeCount} nodes · {edgeCount} edges
      </div>
      <pre>{pretty}</pre>
    </div>
  );
}

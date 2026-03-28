type ValidationError = {
  code?: string;
  message: string;
  nodeId?: string;
};

type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

type Props = {
  result: ValidationResult | null;
};

export function ValidationPanel({ result }: Props) {
  if (!result) {
    return (
      <div className="validation-panel">
        <p>Run validation from the top bar to see workflow health.</p>
      </div>
    );
  }

  if (result.valid) {
    return (
      <div className="validation-panel">
        <div className="validation-valid">Valid workflow</div>
      </div>
    );
  }

  return (
    <div className="validation-panel">
      <div className="validation-invalid">
        {result.errors.length} validation errors
      </div>
      <ul>
        {result.errors.map((error, index) => (
          <li key={`${error.code ?? "ERR"}-${index}`}>
            <strong>{error.code ?? "VALIDATION_ERROR"}</strong>: {error.message}
            {error.nodeId ? ` (${error.nodeId})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

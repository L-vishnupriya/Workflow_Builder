type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onLoadSample: () => void;
  onValidate: () => void;
  onExport: () => void;
  onFitScreen: () => void;
};

export function Toolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onLoadSample,
  onValidate,
  onExport,
  onFitScreen,
}: Props) {
  return (
    <div className="toolbar">
      <button onClick={onUndo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={onRedo} disabled={!canRedo}>
        Redo
      </button>
      <button onClick={onLoadSample}>Load Sample</button>
      <button onClick={onFitScreen}>Fit</button>
      <button onClick={onValidate}>Validate</button>
      <button onClick={onExport}>Export</button>
    </div>
  );
}

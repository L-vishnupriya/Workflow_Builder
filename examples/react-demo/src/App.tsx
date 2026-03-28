import { useCallback, useRef, useState } from "react";
import { JsonPreviewPanel } from "./components/JsonPreviewPanel";
import { ValidationPanel } from "./components/ValidationPanel";
import {
  WorkflowBuilderRef,
  WorkflowBuilderWrapper,
} from "./components/WorkflowBuilderWrapper";
import sampleWorkflow from "./sample-workflow.json";

type ValidationResult = {
  valid: boolean;
  errors: Array<{ code?: string; message: string; nodeId?: string }>;
};

export default function App() {
  const builderRef = useRef<WorkflowBuilderRef>(null);
  const [workflowJson, setWorkflowJson] = useState<string>("{}");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeTab, setActiveTab] = useState<"validation" | "json">(
    "validation",
  );
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleReady = useCallback(() => {
    setIsReady(true);
    builderRef.current?.loadWorkflow(JSON.stringify(sampleWorkflow));
    setTimeout(() => builderRef.current?.fitToScreen(), 150);
  }, []);

  const handleLoadSample = useCallback(() => {
    builderRef.current?.loadWorkflow(JSON.stringify(sampleWorkflow));
    setTimeout(() => builderRef.current?.fitToScreen(), 150);
  }, []);

  const handleWorkflowChange = useCallback((detail: { json: string }) => {
    setWorkflowJson(detail.json);
  }, []);

  const handleHistoryChanged = useCallback(
    (detail: { canUndo: boolean; canRedo: boolean }) => {
      setCanUndo(detail.canUndo);
      setCanRedo(detail.canRedo);
    },
    [],
  );

  const handleValidate = useCallback(() => {
    const result = builderRef.current?.validateWorkflow();
    if (result) {
      setValidationResult(result);
    }
    setActiveTab("validation");
  }, []);

  const handleExport = useCallback(() => {
    const json = builderRef.current?.getWorkflow() ?? "{}";
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "workflow-export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast("Workflow JSON downloaded");
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-title">C1X Workflow Builder</div>
        <div className="app-center-controls">
          <button
            onClick={() => builderRef.current?.undo()}
            disabled={!canUndo}
          >
            Undo
          </button>
          <button
            onClick={() => builderRef.current?.redo()}
            disabled={!canRedo}
          >
            Redo
          </button>
          <span className="toolbar-separator" aria-hidden="true" />
          <button onClick={() => builderRef.current?.fitToScreen()}>
            Auto Layout
          </button>
          <button onClick={() => builderRef.current?.fitToScreen()}>Fit</button>
          <span className="toolbar-separator" aria-hidden="true" />
          <button onClick={handleLoadSample}>Load Sample</button>
        </div>
        <div className="app-right-controls">
          <div
            className={`status-pill ${validationResult?.valid ? "ok" : validationResult ? "bad" : "idle"}`}
          >
            {validationResult
              ? validationResult.valid
                ? "Validation: Valid"
                : `Validation: ${validationResult.errors.length} issues`
              : isReady
                ? "Validation: Not run"
                : "Initializing"}
          </div>
          <button onClick={() => setPanelOpen((prev) => !prev)}>
            {panelOpen ? "Hide Panel" : "Show Panel"}
          </button>
          <button onClick={handleValidate}>Validate</button>
          <button className="primary-cta" onClick={handleExport}>
            Export
          </button>
        </div>
      </header>

      <main className={`app-main ${panelOpen ? "" : "panel-collapsed"}`}>
        <section className="builder-section">
          {!isReady && (
            <div className="loading-overlay">Loading workflow...</div>
          )}
          <WorkflowBuilderWrapper
            ref={builderRef}
            workflowId="react-demo-001"
            onWorkflowChange={handleWorkflowChange}
            onReady={handleReady}
            onHistoryChanged={handleHistoryChanged}
            onValidationFailed={(errors) => {
              setValidationResult({ valid: false, errors });
              setActiveTab("validation");
            }}
            hideToolbar
          />
        </section>

        <aside className={`output-section ${panelOpen ? "" : "collapsed"}`}>
          <div className="output-tabs">
            <button
              className={activeTab === "validation" ? "active" : ""}
              onClick={() => setActiveTab("validation")}
            >
              Validation
            </button>
            <button
              className={activeTab === "json" ? "active" : ""}
              onClick={() => setActiveTab("json")}
            >
              JSON Output
            </button>
          </div>
          <div className="output-body">
            {activeTab === "validation" && (
              <ValidationPanel result={validationResult} />
            )}
            {activeTab === "json" && <JsonPreviewPanel json={workflowJson} />}
          </div>
        </aside>
      </main>
      {toast && <div className="demo-toast">{toast}</div>}
    </div>
  );
}

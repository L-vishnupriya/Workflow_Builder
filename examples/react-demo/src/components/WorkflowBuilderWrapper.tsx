import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type WorkflowChangeDetail = {
  workflowId: string;
  graph: unknown;
  json: string;
};

type HistoryDetail = { canUndo: boolean; canRedo: boolean };

type ValidationResult = {
  valid: boolean;
  errors: Array<{ code?: string; message: string; nodeId?: string }>;
};

export interface WorkflowBuilderRef {
  getWorkflow: () => string;
  loadWorkflow: (json: string) => boolean;
  validateWorkflow: () => ValidationResult | undefined;
  undo: () => void;
  redo: () => void;
  clearWorkflow: () => void;
  fitToScreen: () => void;
}

type C1XWorkflowBuilderElement = HTMLElement & {
  getWorkflow: () => string;
  loadWorkflow: (json: string) => boolean;
  validateWorkflow: () => ValidationResult;
  undo: () => void;
  redo: () => void;
  clearWorkflow: () => void;
  fitToScreen: () => void;
};

type Props = {
  workflowId?: string;
  onWorkflowChange?: (detail: WorkflowChangeDetail) => void;
  onReady?: () => void;
  onValidationFailed?: (errors: ValidationResult["errors"]) => void;
  onHistoryChanged?: (detail: HistoryDetail) => void;
  readOnly?: boolean;
  theme?: "light" | "dark";
  hideToolbar?: boolean;
};

export const WorkflowBuilderWrapper = forwardRef<WorkflowBuilderRef, Props>(
  (
    {
      workflowId = "react-demo-001",
      onWorkflowChange,
      onReady,
      onValidationFailed,
      onHistoryChanged,
      readOnly,
      theme,
      hideToolbar,
    },
    ref,
  ) => {
    const elRef = useRef<C1XWorkflowBuilderElement | null>(null);
    const readyNotifiedRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getWorkflow: () => elRef.current?.getWorkflow() ?? "{}",
      loadWorkflow: (json: string) =>
        elRef.current?.loadWorkflow(json) ?? false,
      validateWorkflow: () => elRef.current?.validateWorkflow(),
      undo: () => elRef.current?.undo(),
      redo: () => elRef.current?.redo(),
      clearWorkflow: () => elRef.current?.clearWorkflow(),
      fitToScreen: () => elRef.current?.fitToScreen(),
    }));

    useEffect(() => {
      const el = elRef.current;
      if (!el) return;

      const notifyReadyOnce = () => {
        if (readyNotifiedRef.current) return;
        readyNotifiedRef.current = true;
        onReady?.();
      };

      const handleChange = (e: Event) => {
        onWorkflowChange?.((e as CustomEvent).detail as WorkflowChangeDetail);
      };
      const handleReady = () => notifyReadyOnce();
      const handleValidationFailed = (e: Event) => {
        const detail = (e as CustomEvent).detail as {
          errors?: ValidationResult["errors"];
        };
        onValidationFailed?.(detail.errors ?? []);
      };
      const handleHistoryChanged = (e: Event) => {
        onHistoryChanged?.((e as CustomEvent).detail as HistoryDetail);
      };

      el.addEventListener("workflow-change", handleChange);
      el.addEventListener("workflow-ready", handleReady);
      el.addEventListener("workflow-validation-failed", handleValidationFailed);
      el.addEventListener("workflow-history-changed", handleHistoryChanged);

      // Fallback: if the custom event fired before listener attachment,
      // detect initialized shadow content and notify readiness once.
      const readyCheck = window.setInterval(() => {
        if (readyNotifiedRef.current) {
          window.clearInterval(readyCheck);
          return;
        }
        if (el.shadowRoot?.querySelector(".wf-container")) {
          notifyReadyOnce();
          window.clearInterval(readyCheck);
        }
      }, 100);

      return () => {
        window.clearInterval(readyCheck);
        el.removeEventListener("workflow-change", handleChange);
        el.removeEventListener("workflow-ready", handleReady);
        el.removeEventListener(
          "workflow-validation-failed",
          handleValidationFailed,
        );
        el.removeEventListener(
          "workflow-history-changed",
          handleHistoryChanged,
        );
      };
    }, [onWorkflowChange, onReady, onValidationFailed, onHistoryChanged]);

    return (
      <c1x-workflow-builder
        ref={(node: C1XWorkflowBuilderElement | null) => {
          elRef.current = node as C1XWorkflowBuilderElement | null;
        }}
        workflow-id={workflowId}
        theme={theme}
        {...(readOnly ? { readonly: true } : {})}
        {...(hideToolbar ? { "hide-toolbar": true } : {})}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    );
  },
);

WorkflowBuilderWrapper.displayName = "WorkflowBuilderWrapper";

import type React from "react";

interface C1XWorkflowBuilderElement extends HTMLElement {
  getWorkflow(): string;
  loadWorkflow(json: string): boolean;
  validateWorkflow(): {
    valid: boolean;
    errors: Array<{ code?: string; message: string; nodeId?: string }>;
  };
  undo(): void;
  redo(): void;
  clearWorkflow(): void;
  fitToScreen(): void;
  setReadOnly(readOnly: boolean): void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "c1x-workflow-builder": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        C1XWorkflowBuilderElement
      > & {
        "workflow-id"?: string;
        readonly?: boolean | string;
        "hide-toolbar"?: boolean | string;
        "show-json-preview"?: boolean | string;
        "show-minimap"?: boolean | string;
        theme?: "light" | "dark";
        "max-history"?: number | string;
      };
    }
  }

  interface HTMLElementTagNameMap {
    "c1x-workflow-builder": C1XWorkflowBuilderElement;
  }
}

export {};

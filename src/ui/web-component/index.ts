import "@shoelace-style/shoelace/dist/themes/light.css";
import { WorkflowBuilderElement } from "./workflow-builder-element";
import { WF_EVENTS } from "./dom-events";

// Safe registration
if (typeof window !== "undefined" && typeof customElements !== "undefined") {
  if (!customElements.get("c1x-workflow-builder")) {
    customElements.define("c1x-workflow-builder", WorkflowBuilderElement);
  }
}

export { WorkflowBuilderElement, WF_EVENTS };

// Re-export specific public types from the library so consumers don't have to guess
export type {
  WorkflowGraph,
  WorkflowNode,
  Edge,
  ValidationResult,
  ValidationError,
} from "../../shared/types/index";

export type {
  WorkflowChangeDetail,
  NodeAddedDetail,
  NodeConfiguredDetail,
  NodeDeletedDetail,
  EdgeAddedDetail,
  EdgeDeletedDetail,
  ValidationFailedDetail,
} from "./dom-events";

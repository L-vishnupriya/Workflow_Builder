import { WorkflowEngine } from "../../core/engine/workflow-engine";
import { ModalShell } from "./components/modal-shell";
import { BaseForm } from "./forms/base-form";
import { AudienceForm } from "./forms/audience-form";
import { WaitForm } from "./forms/wait-form";
import { FilterForm } from "./forms/filter-form";
import { ActionForm } from "./forms/action-form";
import { SplitForm } from "./forms/split-form";
import { EndForm } from "./forms/end-form";

export class ModalManager {
  private engine: WorkflowEngine;
  private shell: ModalShell;
  private isOpen = false;
  private currentForm: BaseForm | null = null;
  private activeNodeId: string | null = null;

  constructor(engine: WorkflowEngine) {
    this.engine = engine;
    this.shell = new ModalShell();

    // Auto-close if engine deletes the node while modal is open
    this.engine.events.on("graph:changed", (payload: any) => {
      if (this.isOpen && this.activeNodeId) {
        const stillExists = payload.graph.nodes.some(
          (n: any) => n.id === this.activeNodeId,
        );
        if (!stillExists) {
          this.shell.close();
          this.isOpen = false;
          this.activeNodeId = null;
        }
      }
    });

    this.engine.events.on("node:deleted", (payload: any) => {
      if (this.isOpen && this.activeNodeId === payload.nodeId) {
        this.shell.close();
        this.isOpen = false;
        this.activeNodeId = null;
      }
    });
  }

  open(nodeId: string, nodeType: string, existingParams?: any) {
    if (this.isOpen) {
      this.shell.close();
    }

    const formClassMap: Record<string, new () => BaseForm> = {
      audience: AudienceForm,
      wait: WaitForm,
      filter: FilterForm,
      action: ActionForm,
      split: SplitForm,
      end: EndForm,
    };

    const FormClass = formClassMap[nodeType];
    if (!FormClass) {
      console.error(`No form registered for node type: ${nodeType}`);
      return;
    }

    this.currentForm = new FormClass();
    this.activeNodeId = nodeId;

    // The shell handles mounting and validation injection via the config
    this.shell.open({
      nodeId,
      nodeType,
      existingParams,
      formInstance: this.currentForm,
      onSave: (params: any) => {
        const result = this.engine.configureNode(nodeId, params);
        if (result && "valid" in result && !result.valid) {
          const msg =
            result.errors?.[0]?.message || "Unknown validation error.";
          this.shell.showError(msg);
        } else {
          this.isOpen = false;
          this.shell.close();
        }
      },
      onCancel: () => {
        // Keep unconfigured nodes on cancel/close so users can continue editing later.
        this.isOpen = false;
        // Existing configured nodes remain unchanged when editing is canceled.
      },
    });

    this.isOpen = true;

    // Listen to form validity changes to enable/disable Save button
    this.currentForm.onValidityChange((valid) => {
      this.shell.setSaveEnabled(valid);
    });
  }

  close() {
    this.shell.close();
    this.isOpen = false;
    this.activeNodeId = null;
  }

  destroy() {
    this.shell.destroy();
  }
}

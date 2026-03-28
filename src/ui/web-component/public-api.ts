import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import { ValidationResult } from "../../shared/types/index";

export function applyPublicApi(target: any) {
  target.prototype.getWorkflow = function (): string {
    if (!this._isInitialized || !this._engine) return "{}";
    return this._engine.exportJSON();
  };

  target.prototype.loadWorkflow = function (json: string): boolean {
    if (!this._isInitialized || !this._engine) return false;
    try {
      const result = this._engine.importJSON(json);
      if (!result.valid) {
        this._engine.events.emit("validation:failed", {
          errors: result.errors,
        });
        return false;
      }
      return true;
    } catch (e) {
      console.error("Failed to load workflow:", e);
      return false;
    }
  };

  target.prototype.validateWorkflow = function (): ValidationResult {
    if (!this._isInitialized || !this._engine) {
      return {
        valid: false,
        errors: [
          {
            code: "ENGINE_NOT_READY",
            nodeId: "system",
            message: "Engine not initialized",
          },
        ],
      };
    }
    const result = this._engine.validate();
    if (!result.valid) {
      this._engine.events.emit("validation:failed", { errors: result.errors });
    }
    return result;
  };

  target.prototype.undo = function (): void {
    if (!this._isInitialized || !this._engine) return;
    this._engine.undo();
  };

  target.prototype.redo = function (): void {
    if (!this._isInitialized || !this._engine) return;
    this._engine.redo();
  };

  target.prototype.clearWorkflow = function (): void {
    if (!this._isInitialized || !this._engine) return;

    const dialog = document.createElement("sl-dialog") as any;
    dialog.label = "Clear Workflow";

    const content = document.createElement("p");
    content.textContent =
      "This will clear all nodes and connections. This action cannot be undone.";
    dialog.appendChild(content);

    const footer = document.createElement("div");
    footer.slot = "footer";

    const cancelBtn = document.createElement("sl-button") as any;
    cancelBtn.variant = "default";
    cancelBtn.textContent = "Cancel";

    const confirmBtn = document.createElement("sl-button") as any;
    confirmBtn.variant = "danger";
    confirmBtn.textContent = "Clear";

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    dialog.appendChild(footer);

    const hostRoot = this._shadowRoot || this.shadowRoot;
    hostRoot.appendChild(dialog);

    cancelBtn.addEventListener("click", () => {
      dialog.hide();
    });

    confirmBtn.addEventListener("click", () => {
      this._engine.clear();
      dialog.hide();
    });

    dialog.addEventListener("sl-after-hide", () => {
      dialog.remove();
    });

    dialog.show();
  };

  target.prototype.fitToScreen = function (): void {
    if (!this._isInitialized || !this._renderer) return;
    this._renderer.fitToScreen();
  };

  target.prototype.setReadOnly = function (readonly: boolean): void {
    if (!this._isInitialized || !this._renderer) return;
    this._renderer.setReadOnly(readonly);

    // Toggle the CSS class/layer
    const overlay = this._shadowRoot.querySelector(".wf-readonly-overlay");
    if (overlay) {
      overlay.style.display = readonly ? "block" : "none";
    }

    // Toggle toolbar
    const toolbar = this._shadowRoot.querySelector(".wf-toolbar");
    if (toolbar) {
      const buttons = toolbar.querySelectorAll("button");
      buttons.forEach((btn: HTMLButtonElement) => {
        if (btn.classList.contains("wf-export-btn")) return; // Export still allowed in readonly
        btn.disabled = readonly;
      });
    }
  };
}

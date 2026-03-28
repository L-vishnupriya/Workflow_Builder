import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import { injectModalStyles } from "../modal-styles";
import { IForm } from "../forms/base-form";

export type ModalConfig = {
  nodeId: string;
  nodeType: string;
  existingParams?: any;
  formInstance: IForm;
  onSave: (params: any) => void;
  onCancel: () => void;
};

export class ModalShell {
  private dialog: any;
  private formMount: HTMLElement;
  private titleHint: HTMLElement;
  private saveBtn: any;
  private cancelBtn: any;
  private currentConfig: ModalConfig | null = null;
  private alertContainer: HTMLElement;

  constructor() {
    injectModalStyles();

    this.dialog = document.createElement("sl-dialog");
    document.body.appendChild(this.dialog);

    // Form mount area inside the default slot
    this.titleHint = document.createElement("div");
    this.titleHint.className = "c1x-modal-title-hint";
    this.titleHint.style.cssText =
      "font-family: Inter, sans-serif; font-size: 16px; line-height: 1.25; font-weight: 700; color: #111827; margin-bottom: 8px;";
    this.dialog.appendChild(this.titleHint);

    this.formMount = document.createElement("div");
    this.formMount.id = "c1x-form-mount";
    this.dialog.appendChild(this.formMount);

    // Footer slot
    const footer = document.createElement("div");
    footer.slot = "footer";

    this.cancelBtn = document.createElement("sl-button");
    this.cancelBtn.textContent = "Cancel";
    this.cancelBtn.variant = "default";

    this.saveBtn = document.createElement("sl-button");
    this.saveBtn.textContent = "Save";
    this.saveBtn.variant = "primary";
    this.saveBtn.disabled = true;

    footer.appendChild(this.cancelBtn);
    footer.appendChild(this.saveBtn);
    this.dialog.appendChild(footer);

    // Alert container
    this.alertContainer = document.createElement("div");
    this.dialog.appendChild(this.alertContainer);

    this.setupListeners();
  }

  private setupListeners() {
    this.dialog.addEventListener("sl-request-close", (event: any) => {
      // Prevent immediate close
      event.preventDefault();
      this.handleCloseRequest("backdrop");
    });

    this.cancelBtn.addEventListener("click", () => {
      this.handleCloseRequest("cancelBtn");
    });

    this.saveBtn.addEventListener("click", () => {
      if (this.currentConfig && this.currentConfig.formInstance.isValid()) {
        const params = this.currentConfig.formInstance.getValues();
        this.currentConfig.onSave(params);
        // Do not close automatically here, let ModalManager handle close on success
      }
    });
  }

  private handleCloseRequest(source: string) {
    if (!this.currentConfig) return;

    const form = this.currentConfig.formInstance;
    if (form.isDirty()) {
      this.showUnsavedWarning();
    } else {
      this.closeWithoutChecking();
    }
  }

  private showUnsavedWarning() {
    this.alertContainer.innerHTML = "";
    const alert: any = document.createElement("sl-alert");
    alert.variant = "warning";
    alert.open = true;
    alert.closable = false;

    alert.innerHTML = `
      <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
      <strong>Unsaved Changes</strong><br>
      You have unsaved changes.
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <sl-button size="small" variant="warning" class="confirm-close">Close</sl-button>
        <sl-button size="small" variant="default" class="keep-editing">Keep Editing</sl-button>
      </div>
    `;

    this.alertContainer.appendChild(alert);

    alert.querySelector(".confirm-close").addEventListener("click", () => {
      this.alertContainer.innerHTML = "";
      this.closeWithoutChecking();
    });

    alert.querySelector(".keep-editing").addEventListener("click", () => {
      this.alertContainer.innerHTML = ""; // dismiss alert
    });
  }

  private closeWithoutChecking() {
    if (this.currentConfig) {
      this.currentConfig.onCancel();
    }
    this.dialog.hide();
  }

  open(config: ModalConfig) {
    this.currentConfig = config;
    this.alertContainer.innerHTML = "";

    this.setTitleAndColor(config.nodeType);
    this.setSaveEnabled(false);

    this.formMount.innerHTML = "";

    this.dialog.show();

    // We delay the render slightly to let the dialog animation start,
    // which helps Shoelace web components calculate dimensions properly.
    setTimeout(() => {
      this.currentConfig?.formInstance.render(
        this.formMount,
        this.currentConfig.existingParams,
      );
      if (this.currentConfig?.formInstance.isValid()) {
        this.setSaveEnabled(true);
      }
    }, 50);
  }

  close() {
    this.dialog.hide();
  }

  setSaveEnabled(enabled: boolean) {
    this.saveBtn.disabled = !enabled;
  }

  showError(message: string) {
    this.alertContainer.innerHTML = "";
    const alert: any = document.createElement("sl-alert");
    alert.variant = "danger";
    alert.open = true;
    alert.closable = true;
    alert.innerHTML = `
      <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
      <strong>Could not save configuration</strong><br>
      ${message}
    `;
    this.alertContainer.appendChild(alert);
  }

  private setTitleAndColor(nodeType: string) {
    const configMap: Record<
      string,
      { label: string; color: string; icon: string; subtitle: string }
    > = {
      audience: {
        label: "Audience configuration",
        color: "#F97316",
        icon: "people",
        subtitle: "Edit Audience Details",
      },
      wait: {
        label: "Wait configuration",
        color: "#6366F1",
        icon: "clock",
        subtitle: "Edit Wait Details",
      },
      filter: {
        label: "Filter configuration",
        color: "#F59E0B",
        icon: "lightning-charge",
        subtitle: "Edit Filter Details",
      },
      action: {
        label: "Action configuration",
        color: "#10B981",
        icon: "envelope",
        subtitle: "Edit Action Details",
      },
      split: {
        label: "Split configuration",
        color: "#8B5CF6",
        icon: "shuffle",
        subtitle: "Edit Split Details",
      },
      end: {
        label: "End configuration",
        color: "#6B7280",
        icon: "stop-circle",
        subtitle: "Edit End Details",
      },
    };

    const mapping = configMap[nodeType] || {
      label: "Node configuration",
      color: "#94A3B8",
      icon: "gear",
      subtitle: "Edit Node Details",
    };

    this.dialog.label = mapping.label;
    this.titleHint.textContent = mapping.subtitle;
    this.dialog.style.setProperty("--header-color", mapping.color);
  }

  destroy() {
    if (this.dialog.parentNode) {
      this.dialog.parentNode.removeChild(this.dialog);
    }
  }
}

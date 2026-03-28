import { Component, ViewChild } from "@angular/core";
import { WorkflowBuilderComponent } from "./workflow-builder/workflow-builder.component";

type ValidationError = { code?: string; message: string; nodeId?: string };

type ValidationResult = { valid: boolean; errors: ValidationError[] };

@Component({
  selector: "app-root",
  standalone: false,
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  @ViewChild("builder", { static: true })
  builder!: WorkflowBuilderComponent;

  workflowJson = "{}";
  canUndo = false;
  canRedo = false;
  activeTab: "json" | "validation" = "validation";
  validationResult: ValidationResult | null = null;
  isReady = false;
  panelOpen = false;
  toastMessage: string | null = null;

  onWorkflowChange(detail: { json: string }): void {
    this.workflowJson = detail.json;
  }

  onHistoryChanged(detail: { canUndo: boolean; canRedo: boolean }): void {
    this.canUndo = detail.canUndo;
    this.canRedo = detail.canRedo;
  }

  onValidationFailed(errors: ValidationError[]): void {
    this.validationResult = { valid: false, errors };
    this.activeTab = "validation";
  }

  onValidate(): void {
    this.validationResult = this.builder.validate();
    this.activeTab = "validation";
  }

  onReady(): void {
    this.isReady = true;
  }

  onLoadSample(): void {
    this.builder.loadSample();
  }

  onExport(): void {
    const json = this.builder.getWorkflow();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "workflow-export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.toastMessage = "Workflow JSON downloaded";
    window.setTimeout(() => {
      this.toastMessage = null;
    }, 1800);
  }
}

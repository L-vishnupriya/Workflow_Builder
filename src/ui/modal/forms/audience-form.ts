import { BaseForm } from "./base-form";
import { FieldValidator } from "../components/field-validator";

export class AudienceForm extends BaseForm {
  private input: any;
  private daysInput: any;

  render(container: HTMLElement, existingParams?: any): void {
    this.container = container;
    const formBody = document.createElement("div");
    formBody.className = "form-body";

    this.input = document.createElement("sl-input");
    this.input.label = "Segment Name";
    this.input.placeholder = "e.g. Inactive Users";
    this.input.required = true;
    this.input.helpText = "Define which audience segment enters this workflow";

    if (existingParams && existingParams.segmentName) {
      this.input.value = existingParams.segmentName;
    }

    this.input.addEventListener("sl-input", () => {
      this.clearFieldError(this.input);
      this.triggerValidityCheck();
    });

    this.input.addEventListener("sl-invalid", (e: Event) => {
      e.preventDefault();
      this.setFieldError(this.input, "Segment name is required.");
    });

    this.daysInput = document.createElement("sl-input");
    this.daysInput.type = "number";
    this.daysInput.label = "Days";
    this.daysInput.min = "1";
    this.daysInput.placeholder = "e.g. 7";
    this.daysInput.helpText = "Optional lookback window in days";

    if (existingParams && existingParams.days) {
      this.daysInput.value = String(existingParams.days);
    }

    this.daysInput.addEventListener("sl-input", () => {
      this.clearFieldError(this.daysInput);
      this.triggerValidityCheck();
    });

    formBody.appendChild(this.input);
    formBody.appendChild(this.daysInput);
    container.appendChild(formBody);

    this.snapshotInitialValues();

    setTimeout(() => {
      if (this.input && typeof this.input.focus === "function") {
        this.input.focus();
      }
    }, 100);
  }

  getValues() {
    const rawDays = (this.daysInput?.value || "").trim();
    return {
      segmentName: (this.input.value || "").trim(),
      ...(rawDays ? { days: Number(rawDays) } : {}),
    };
  }

  isValid(): boolean {
    return FieldValidator.validateRequired(this.getValues().segmentName).valid;
  }
}

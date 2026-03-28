import { BaseForm } from './base-form';

export class EndForm extends BaseForm {
  private labelInput: any;

  render(container: HTMLElement, existingParams?: any): void {
    this.container = container;
    const formBody = document.createElement('div');
    formBody.className = 'form-body';

    const alert = document.createElement('sl-alert');
    alert.variant = 'success';
    alert.open = true;
    alert.innerHTML = '<sl-icon slot="icon" name="check2-circle"></sl-icon> This node marks the end of a workflow path.';
    
    this.labelInput = document.createElement('sl-input');
    this.labelInput.label = 'Path Label (optional)';
    this.labelInput.placeholder = 'e.g. Converted Users';

    if (existingParams?.label && existingParams.label !== 'End') {
      this.labelInput.value = existingParams.label;
    }

    formBody.appendChild(alert);
    formBody.appendChild(this.labelInput);
    container.appendChild(formBody);

    this.snapshotInitialValues();

    // End node is always immediately valid since it has no required fields
    setTimeout(() => {
      this.triggerValidityCheck();
    }, 10);
  }

  getValues() {
    return {
      label: (this.labelInput.value || '').trim() || 'End'
    };
  }

  isValid(): boolean {
    return true; // No required fields
  }
}

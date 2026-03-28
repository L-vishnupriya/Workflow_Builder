import { BaseForm } from './base-form';
import { FieldValidator } from '../components/field-validator';

export class WaitForm extends BaseForm {
  private durationInput: any;
  private unitSelect: any;

  render(container: HTMLElement, existingParams?: any): void {
    this.container = container;
    const formBody = document.createElement('div');
    formBody.className = 'form-body';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '12px';
    row.style.alignItems = 'flex-end';

    // Duration Input
    const durWrap = document.createElement('div');
    durWrap.style.flex = '1';
    this.durationInput = document.createElement('sl-input');
    this.durationInput.type = 'number';
    this.durationInput.label = 'Duration';
    this.durationInput.min = '1';
    this.durationInput.placeholder = 'e.g. 2';
    this.durationInput.required = true;
    
    if (existingParams?.duration) {
      this.durationInput.value = existingParams.duration.toString();
    }
    
    // Unit Select
    const unitWrap = document.createElement('div');
    unitWrap.style.flex = '1';
    this.unitSelect = document.createElement('sl-select');
    this.unitSelect.label = 'Unit';
    this.unitSelect.required = true;
    
    this.unitSelect.innerHTML = `
      <sl-option value="minutes">Minutes</sl-option>
      <sl-option value="hours">Hours</sl-option>
      <sl-option value="days">Days</sl-option>
    `;

    this.unitSelect.value = existingParams?.unit || 'hours';

    const validate = () => {
      this.clearFieldError(this.durationInput);
      this.clearFieldError(this.unitSelect);
      this.triggerValidityCheck();
    };

    this.durationInput.addEventListener('sl-input', validate);
    this.unitSelect.addEventListener('sl-change', validate);

    durWrap.appendChild(this.durationInput);
    unitWrap.appendChild(this.unitSelect);
    row.appendChild(durWrap);
    row.appendChild(unitWrap);
    formBody.appendChild(row);
    container.appendChild(formBody);

    this.snapshotInitialValues();
  }

  getValues() {
    return {
      duration: Number(this.durationInput.value),
      unit: this.unitSelect.value
    };
  }

  isValid(): boolean {
    const vals = this.getValues();
    const durValid = FieldValidator.validatePositiveNumber(vals.duration);
    if (!durValid.valid) return false;
    if (!vals.unit) return false;
    return true;
  }
}

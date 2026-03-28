import { BaseForm } from './base-form';
import { FieldValidator } from '../components/field-validator';

export class FilterForm extends BaseForm {
  private conditionSelect: any;
  private valueInput: any;

  render(container: HTMLElement, existingParams?: any): void {
    this.container = container;
    const formBody = document.createElement('div');
    formBody.className = 'form-body';

    // Condition Select
    this.conditionSelect = document.createElement('sl-select');
    this.conditionSelect.label = 'Condition';
    this.conditionSelect.required = true;
    this.conditionSelect.innerHTML = `
      <sl-option value="opened_email">Opened Email</sl-option>
      <sl-option value="purchased">Purchased</sl-option>
      <sl-option value="clicked_link">Clicked Link</sl-option>
      <sl-option value="not_purchased">Did Not Purchase</sl-option>
    `;

    // Value Input
    this.valueInput = document.createElement('sl-input');
    this.valueInput.label = 'Value';
    this.valueInput.required = true;

    if (existingParams) {
      if (existingParams.condition) this.conditionSelect.value = existingParams.condition;
      if (existingParams.value) this.valueInput.value = existingParams.value;
    }

    const setPlaceholder = () => {
      const map: Record<string, string> = {
        opened_email: 'e.g. Newsletter_April',
        purchased: 'e.g. ProductSKU_001',
        clicked_link: 'e.g. https://...',
        not_purchased: 'e.g. ProductSKU_001'
      };
      this.valueInput.placeholder = map[this.conditionSelect.value] || 'e.g. Value';
    };

    setPlaceholder(); // initial

    const validate = () => {
      this.clearFieldError(this.valueInput);
      this.triggerValidityCheck();
    };

    this.conditionSelect.addEventListener('sl-change', () => {
      setPlaceholder();
      this.valueInput.value = ''; // clear on condition change
      validate();
    });

    this.valueInput.addEventListener('sl-input', validate);

    formBody.appendChild(this.conditionSelect);
    formBody.appendChild(this.valueInput);
    container.appendChild(formBody);

    this.snapshotInitialValues();
  }

  getValues() {
    return {
      condition: this.conditionSelect.value,
      value: (this.valueInput.value || '').trim()
    };
  }

  isValid(): boolean {
    const vals = this.getValues();
    if (!vals.condition) return false;
    return FieldValidator.validateRequired(vals.value).valid;
  }
}

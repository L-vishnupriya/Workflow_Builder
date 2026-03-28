import { BaseForm } from './base-form';
import { FieldValidator } from '../components/field-validator';

export class SplitForm extends BaseForm {
  private conditionInput: any;
  private branchWrapper: HTMLElement | null = null;
  private branchInputs: any[] = [];
  private addBtn: any;

  render(container: HTMLElement, existingParams?: any): void {
    this.container = container;
    const formBody = document.createElement('div');
    formBody.className = 'form-body';

    // Condition
    this.conditionInput = document.createElement('sl-input');
    this.conditionInput.label = 'Split Condition';
    this.conditionInput.placeholder = 'e.g. Preferred communication channel';
    this.conditionInput.required = true;
    
    if (existingParams?.condition) {
      this.conditionInput.value = existingParams.condition;
    }

    // Branches Section
    const branchesHeader = document.createElement('strong');
    branchesHeader.textContent = 'Branch Labels';
    branchesHeader.style.fontFamily = 'Inter, sans-serif';
    branchesHeader.style.fontSize = '14px';
    branchesHeader.style.display = 'block';

    this.branchWrapper = document.createElement('div');
    this.branchWrapper.style.display = 'flex';
    this.branchWrapper.style.flexDirection = 'column';
    this.branchWrapper.style.gap = '8px';

    formBody.appendChild(this.conditionInput);
    formBody.appendChild(branchesHeader);
    formBody.appendChild(this.branchWrapper);

    this.addBtn = document.createElement('sl-button');
    this.addBtn.size = 'small';
    this.addBtn.variant = 'default';
    this.addBtn.textContent = '+ Add Branch';
    formBody.appendChild(this.addBtn);

    const initialBranches = existingParams?.branches || ['Branch A', 'Branch B'];
    for (let i = 0; i < initialBranches.length; i++) {
      this.addBranchInput(initialBranches[i], i >= 2);
    }

    this.conditionInput.addEventListener('sl-input', () => this.triggerValidityCheck());
    
    this.addBtn.addEventListener('click', () => {
      if (this.branchInputs.length < 4) {
        this.addBranchInput(`Branch ${String.fromCharCode(65 + this.branchInputs.length)}`, true);
        this.triggerValidityCheck();
      }
    });

    container.appendChild(formBody);
    this.snapshotInitialValues();
  }

  private addBranchInput(val: string, removable: boolean) {
    if (!this.branchWrapper) return;

    const row = document.createElement('div');
    row.className = 'branch-row';

    const input = document.createElement('sl-input');
    input.value = val;
    input.style.flex = '1';
    input.required = true;
    input.addEventListener('sl-input', () => this.triggerValidityCheck());

    this.branchInputs.push(input);
    row.appendChild(input);

    if (removable) {
      const rmBtn: any = document.createElement('sl-icon-button');
      rmBtn.name = 'x';
      rmBtn.addEventListener('click', () => {
        const idx = this.branchInputs.indexOf(input);
        if (idx > -1) this.branchInputs.splice(idx, 1);
        row.remove();
        this.addBtn.disabled = this.branchInputs.length >= 4;
        this.triggerValidityCheck();
      });
      row.appendChild(rmBtn);
    }

    this.branchWrapper.appendChild(row);
    this.addBtn.disabled = this.branchInputs.length >= 4;
  }

  getValues() {
    return {
      condition: (this.conditionInput.value || '').trim(),
      branches: this.branchInputs.map(i => (i.value || '').trim())
    };
  }

  isValid(): boolean {
    const vals = this.getValues();
    if (!FieldValidator.validateRequired(vals.condition).valid) return false;
    if (vals.branches.length < 2) return false;
    return vals.branches.every(b => FieldValidator.validateRequired(b).valid);
  }
}

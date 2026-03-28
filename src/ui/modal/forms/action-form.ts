import { BaseForm } from './base-form';
import { FieldValidator } from '../components/field-validator';

export class ActionForm extends BaseForm {
  private channelSelect: any;
  private templateInput: any;
  private warningAlert: any;

  render(container: HTMLElement, existingParams?: any): void {
    this.container = container;
    const formBody = document.createElement('div');
    formBody.className = 'form-body';

    // Channel Select
    this.channelSelect = document.createElement('sl-select');
    this.channelSelect.label = 'Channel';
    this.channelSelect.required = true;
    this.channelSelect.innerHTML = `
      <sl-option value="email">📧 Email</sl-option>
      <sl-option value="sms">💬 SMS</sl-option>
      <sl-option value="whatsapp">📱 WhatsApp</sl-option>
    `;

    // Template Input
    this.templateInput = document.createElement('sl-input');
    this.templateInput.label = 'Template ID';
    this.templateInput.placeholder = 'e.g. T-101';
    this.templateInput.helpText = 'Enter the template ID from your campaign library';
    this.templateInput.required = true;

    // WhatsApp Warning
    this.warningAlert = document.createElement('sl-alert');
    this.warningAlert.variant = 'warning';
    this.warningAlert.innerHTML = '<sl-icon slot="icon" name="exclamation-triangle"></sl-icon> WhatsApp requires pre-approved templates only';
    this.warningAlert.style.display = 'none';

    if (existingParams) {
      if (existingParams.channel) this.channelSelect.value = existingParams.channel;
      if (existingParams.templateId) this.templateInput.value = existingParams.templateId;
    }

    const validate = () => {
      this.clearFieldError(this.templateInput);
      this.triggerValidityCheck();
    };

    const checkWarning = () => {
      if (this.channelSelect.value === 'whatsapp') {
        this.warningAlert.style.display = 'block';
        if (typeof this.warningAlert.show === 'function') this.warningAlert.show();
      } else {
        if (typeof this.warningAlert.hide === 'function') {
          this.warningAlert.hide();
        } else {
          this.warningAlert.style.display = 'none';
        }
      }
    };

    this.channelSelect.addEventListener('sl-change', () => {
      checkWarning();
      validate();
    });

    this.templateInput.addEventListener('sl-input', validate);

    formBody.appendChild(this.channelSelect);
    formBody.appendChild(this.templateInput);
    formBody.appendChild(this.warningAlert);
    container.appendChild(formBody);

    // Initial warning check
    setTimeout(() => checkWarning(), 100);

    this.snapshotInitialValues();
  }

  getValues() {
    return {
      channel: this.channelSelect.value,
      templateId: (this.templateInput.value || '').trim()
    };
  }

  isValid(): boolean {
    const vals = this.getValues();
    if (!vals.channel) return false;
    return FieldValidator.validateRequired(vals.templateId).valid;
  }
}

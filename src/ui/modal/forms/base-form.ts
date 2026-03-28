import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

export interface IForm {
  render(container: HTMLElement, existingParams?: any): void;
  getValues(): any;
  isValid(): boolean;
  isDirty(): boolean;
  onValidityChange(callback: (valid: boolean) => void): void;
  destroy(): void;
}

export abstract class BaseForm implements IForm {
  protected initialValuesJson: string = '';
  protected validityCallback: ((valid: boolean) => void) | null = null;
  protected container: HTMLElement | null = null;
  private errorSpans = new Map<HTMLElement, HTMLSpanElement>();

  abstract render(container: HTMLElement, existingParams?: any): void;
  abstract getValues(): any;
  abstract isValid(): boolean;

  protected snapshotInitialValues() {
    this.initialValuesJson = JSON.stringify(this.getValues());
  }

  isDirty(): boolean {
    return JSON.stringify(this.getValues()) !== this.initialValuesJson;
  }

  onValidityChange(callback: (valid: boolean) => void): void {
    this.validityCallback = callback;
  }

  protected triggerValidityCheck() {
    if (this.validityCallback) {
      this.validityCallback(this.isValid());
    }
  }

  protected setFieldError(fieldRef: HTMLElement, message: string) {
    let errorSpan = this.errorSpans.get(fieldRef);
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'field-error';
      // Insert right after the field
      fieldRef.parentNode?.insertBefore(errorSpan, fieldRef.nextSibling);
      this.errorSpans.set(fieldRef, errorSpan);
    }
    errorSpan.textContent = message;
    
    // Also try to set visual error state on shoelace input if applicable
    if ('setCustomValidity' in fieldRef && typeof fieldRef.setCustomValidity === 'function') {
      (fieldRef as any).setCustomValidity(message);
    }
  }

  protected clearFieldError(fieldRef: HTMLElement) {
    const errorSpan = this.errorSpans.get(fieldRef);
    if (errorSpan) {
      errorSpan.remove();
      this.errorSpans.delete(fieldRef);
    }
    
    if ('setCustomValidity' in fieldRef && typeof fieldRef.setCustomValidity === 'function') {
      (fieldRef as any).setCustomValidity('');
    }
  }

  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.errorSpans.clear();
    this.validityCallback = null;
  }
}

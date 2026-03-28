export type ValidationResult = { valid: boolean; message: string };
export type ValidationRule = {
  value: string;
  validator: Function;
  args?: any[];
};

export class FieldValidator {
  static validateRequired(value: string | undefined | null): ValidationResult {
    const trimmed = (value || "").trim();
    if (!trimmed) return { valid: false, message: "This field is required." };
    return { valid: true, message: "" };
  }

  static validatePositiveNumber(value: string | number): ValidationResult {
    const parsed = Number(value);
    if (isNaN(parsed) || parsed <= 0) {
      return { valid: false, message: "Must be a number greater than 0." };
    }
    return { valid: true, message: "" };
  }

  static validateMinLength(value: string, min: number): ValidationResult {
    const len = (value || "").trim().length;
    if (len < min) {
      return { valid: false, message: `Must be at least ${min} characters.` };
    }
    return { valid: true, message: "" };
  }

  static validateMaxLength(value: string, max: number): ValidationResult {
    const len = (value || "").trim().length;
    if (len > max) {
      return { valid: false, message: `Must be at most ${max} characters.` };
    }
    return { valid: true, message: "" };
  }

  static validateTemplateId(value: string): ValidationResult {
    const trimmed = (value || "").trim();
    if (!trimmed) return { valid: false, message: "Template ID is required." };
    if (!trimmed.startsWith("T-")) {
      return { valid: false, message: 'Template ID must start with "T-".' };
    }
    return { valid: true, message: "" };
  }

  static validateEnum(value: string, allowed: string[]): ValidationResult {
    if (!allowed.includes(value)) {
      return { valid: false, message: "Invalid selection." };
    }
    return { valid: true, message: "" };
  }

  static validateAll(rules: ValidationRule[]): ValidationResult {
    for (const rule of rules) {
      const args = rule.args || [];
      const result = rule.validator(rule.value, ...args);
      if (!result.valid) return result;
    }
    return { valid: true, message: "" };
  }
}

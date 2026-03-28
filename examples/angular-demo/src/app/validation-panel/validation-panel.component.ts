import { Component, Input } from "@angular/core";

type ValidationError = { code?: string; message: string; nodeId?: string };

@Component({
  selector: "app-validation-panel",
  standalone: false,
  template: `
    <div class="validation-panel" *ngIf="result as r; else idle">
      <ng-container *ngIf="r.valid; else invalidTpl">
        <div class="valid">Valid workflow</div>
      </ng-container>
      <ng-template #invalidTpl>
        <div class="invalid">{{ r.errors.length || 0 }} validation errors</div>
        <ul>
          <li *ngFor="let error of r.errors">
            <strong>{{ error.code || "VALIDATION_ERROR" }}</strong
            >: {{ error.message }}
            <span *ngIf="error.nodeId"> ({{ error.nodeId }})</span>
          </li>
        </ul>
      </ng-template>
    </div>

    <ng-template #idle>
      <div class="validation-panel">
        <p>Run validation from the top bar to see workflow health.</p>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .validation-panel {
        padding: 12px;
      }

      .valid {
        color: #047857;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .invalid {
        color: #b91c1c;
        font-weight: 700;
        margin-bottom: 8px;
      }

      ul {
        margin: 0 0 10px 0;
        padding-left: 18px;
      }
    `,
  ],
})
export class ValidationPanelComponent {
  @Input() result: { valid: boolean; errors: ValidationError[] } | null = null;
}

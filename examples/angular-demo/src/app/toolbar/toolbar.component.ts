import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "app-toolbar",
  standalone: false,
  template: `
    <div class="toolbar">
      <button [disabled]="!canUndo" (click)="undo.emit()">Undo</button>
      <button [disabled]="!canRedo" (click)="redo.emit()">Redo</button>
      <button (click)="loadSample.emit()">Load Sample</button>
      <button (click)="fitScreen.emit()">Fit</button>
      <button (click)="validate.emit()">Validate</button>
      <button (click)="exportWorkflow.emit()">Export</button>
    </div>
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        gap: 8px;
      }

      button {
        border: 1px solid #d1d5db;
        background: #fff;
        border-radius: 8px;
        padding: 6px 10px;
        font-weight: 600;
        cursor: pointer;
      }

      button[disabled] {
        opacity: 0.45;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ToolbarComponent {
  @Input() canUndo = false;
  @Input() canRedo = false;

  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() validate = new EventEmitter<void>();
  @Output() exportWorkflow = new EventEmitter<void>();
  @Output() fitScreen = new EventEmitter<void>();
  @Output() loadSample = new EventEmitter<void>();
}

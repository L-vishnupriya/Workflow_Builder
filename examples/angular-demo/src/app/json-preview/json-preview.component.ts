import { Component, Input } from "@angular/core";

@Component({
  selector: "app-json-preview",
  standalone: false,
  template: `
    <div class="json-panel">
      <div class="json-summary">
        {{ nodeCount }} nodes · {{ edgeCount }} edges
      </div>
      <pre>{{ prettyJson }}</pre>
    </div>
  `,
  styles: [
    `
      .json-panel {
        padding: 12px;
      }

      .json-summary {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 8px;
        font-weight: 600;
      }

      pre {
        margin: 0;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #f8fafc;
        padding: 10px;
        font-size: 12px;
        line-height: 1.4;
        white-space: pre-wrap;
      }
    `,
  ],
})
export class JsonPreviewComponent {
  @Input() json = "{}";

  get prettyJson(): string {
    try {
      return JSON.stringify(JSON.parse(this.json), null, 2);
    } catch {
      return this.json;
    }
  }

  get nodeCount(): number {
    try {
      const parsed = JSON.parse(this.json);
      return Array.isArray(parsed.nodes) ? parsed.nodes.length : 0;
    } catch {
      return 0;
    }
  }

  get edgeCount(): number {
    try {
      const parsed = JSON.parse(this.json);
      return Array.isArray(parsed.edges) ? parsed.edges.length : 0;
    } catch {
      return 0;
    }
  }
}

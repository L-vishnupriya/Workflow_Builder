import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
} from "@angular/core";

type HistoryState = { canUndo: boolean; canRedo: boolean };

type ValidationError = { code?: string; message: string; nodeId?: string };

@Component({
  selector: "app-workflow-builder",
  standalone: false,
  template: `
    <div class="builder-host">
      <c1x-workflow-builder
        #builder
        workflow-id="angular-demo-001"
        hide-toolbar
        [attr.readonly]="isReadOnly ? '' : null"
        [attr.theme]="theme"
      ></c1x-workflow-builder>
    </div>
  `,
  styles: [
    `
      .builder-host {
        width: 100%;
        height: 100%;
      }

      c1x-workflow-builder {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class WorkflowBuilderComponent implements AfterViewInit, OnDestroy {
  @ViewChild("builder", { static: true })
  builderRef!: ElementRef<
    HTMLElement & {
      getWorkflow: () => string;
      loadWorkflow: (json: string) => boolean;
      validateWorkflow: () => { valid: boolean; errors: ValidationError[] };
      undo: () => void;
      redo: () => void;
      clearWorkflow: () => void;
      fitToScreen: () => void;
    }
  >;

  @Output() workflowChange = new EventEmitter<{ json: string }>();
  @Output() ready = new EventEmitter<void>();
  @Output() historyChanged = new EventEmitter<HistoryState>();
  @Output() validationFailed = new EventEmitter<ValidationError[]>();

  isReadOnly = false;
  theme: "light" | "dark" = "light";

  private handlers: Array<{ event: string; fn: EventListener }> = [];
  private initCheckTimer: number | null = null;
  private initialized = false;

  constructor(private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    const element = this.builderRef.nativeElement;

    const addListener = (
      event: string,
      handler: (e: CustomEvent) => void,
    ): void => {
      const fn: EventListener = (rawEvent) => {
        this.zone.run(() => handler(rawEvent as CustomEvent));
      };
      element.addEventListener(event, fn);
      this.handlers.push({ event, fn });
    };

    addListener("workflow-ready", () => {
      this.ensureInitialized();
    });

    addListener("workflow-change", (event) => {
      this.workflowChange.emit(event.detail as { json: string });
    });

    addListener("workflow-history-changed", (event) => {
      this.historyChanged.emit(event.detail as HistoryState);
    });

    addListener("workflow-validation-failed", (event) => {
      const detail = event.detail as { errors?: ValidationError[] };
      this.validationFailed.emit(detail.errors ?? []);
    });

    // Fallback: if workflow-ready fired before listeners were attached,
    // detect initialized shadow content and run initialization once.
    this.initCheckTimer = window.setInterval(() => {
      const host = this.builderRef?.nativeElement as any;
      if (this.initialized || !host?.shadowRoot) return;
      if (host.shadowRoot.querySelector(".wf-container")) {
        this.ensureInitialized();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    const element = this.builderRef.nativeElement;
    for (const entry of this.handlers) {
      element.removeEventListener(entry.event, entry.fn);
    }
    this.handlers = [];
    if (this.initCheckTimer !== null) {
      window.clearInterval(this.initCheckTimer);
      this.initCheckTimer = null;
    }
  }

  private ensureInitialized(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (this.initCheckTimer !== null) {
      window.clearInterval(this.initCheckTimer);
      this.initCheckTimer = null;
    }
    this.loadSampleWorkflow();
    this.ready.emit();
  }

  getWorkflow(): string {
    return this.builderRef.nativeElement.getWorkflow();
  }

  validate(): { valid: boolean; errors: ValidationError[] } {
    return this.builderRef.nativeElement.validateWorkflow();
  }

  undo(): void {
    this.builderRef.nativeElement.undo();
  }

  redo(): void {
    this.builderRef.nativeElement.redo();
  }

  fitToScreen(): void {
    this.builderRef.nativeElement.fitToScreen();
  }

  loadSample(): void {
    void this.loadSampleWorkflow();
  }

  private async loadSampleWorkflow(): Promise<void> {
    try {
      const response = await fetch("assets/sample-workflow.json");
      const json = await response.json();
      this.builderRef.nativeElement.loadWorkflow(JSON.stringify(json));
      setTimeout(() => this.builderRef.nativeElement.fitToScreen(), 150);
    } catch (error) {
      console.error("Failed to load sample workflow", error);
    }
  }
}

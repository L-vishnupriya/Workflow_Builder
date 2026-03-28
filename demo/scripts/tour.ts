type TourStep = {
  targetSelector: string;
  title: string;
  description: string;
  position: "below" | "above" | "right" | "left";
};

export class Tour {
  private static instance: Tour | null = null;

  private currentStep = 0;
  private overlayEl: HTMLDivElement | null = null;
  private tooltipEl: HTMLDivElement | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  private readonly steps: TourStep[] = [
    {
      targetSelector: "shadow:.workflow-sidebar",
      title: "Node Palette",
      description:
        "Drag any node from this sidebar onto the canvas to add it to your workflow.",
      position: "right",
    },
    {
      targetSelector: "#builder",
      title: "Workflow Canvas",
      description: "Drop nodes here and connect them to build a campaign flow.",
      position: "below",
    },
    {
      targetSelector: "shadow:.wf-toolbar",
      title: "Toolbar",
      description:
        "Undo, redo, validate your workflow, export JSON, or fit everything to screen.",
      position: "below",
    },
    {
      targetSelector: "#json-output",
      title: "Live JSON Output",
      description: "Every change is reflected here as clean JSON.",
      position: "left",
    },
    {
      targetSelector: "#btn-validate",
      title: "Validation",
      description:
        "Validate checks cycles, missing params, and disconnected nodes.",
      position: "below",
    },
  ];

  static getInstance(): Tour {
    if (!Tour.instance) {
      Tour.instance = new Tour();
    }
    return Tour.instance;
  }

  startIfFirstVisit(): void {
    if (!localStorage.getItem("c1x-tour-done")) {
      this.start();
    }
  }

  start(): void {
    this.cleanup();
    this.createOverlay();
    this.createTooltip();
    this.setupKeyboard();
    this.showStep(0);
  }

  next(): void {
    if (this.currentStep >= this.steps.length - 1) {
      this.complete();
      return;
    }
    this.showStep(this.currentStep + 1);
  }

  prev(): void {
    if (this.currentStep <= 0) return;
    this.showStep(this.currentStep - 1);
  }

  skip(): void {
    this.cleanup(true);
  }

  complete(): void {
    this.cleanup(true);
  }

  private resolveTarget(selector: string): HTMLElement | null {
    if (selector.startsWith("shadow:")) {
      const inner = selector.slice("shadow:".length);
      const builder = document.getElementById("builder") as HTMLElement | null;
      const shadow = (builder as any)?.shadowRoot as ShadowRoot | undefined;
      return (shadow?.querySelector(inner) as HTMLElement | null) || null;
    }
    return document.querySelector(selector) as HTMLElement | null;
  }

  private createOverlay(): void {
    this.overlayEl = document.createElement("div");
    this.overlayEl.className = "tour-overlay";
    this.overlayEl.innerHTML = `
      <svg class="tour-svg" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100" height="100" fill="white"></rect>
            <rect id="tour-cutout" x="0" y="0" width="0" height="0" rx="8" fill="black"></rect>
          </mask>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)"></rect>
      </svg>
    `;
    document.body.appendChild(this.overlayEl);
  }

  private createTooltip(): void {
    this.tooltipEl = document.createElement("div");
    this.tooltipEl.className = "tour-tooltip";
    this.tooltipEl.innerHTML = `
      <div class="tour-counter"></div>
      <div class="tour-title"></div>
      <div class="tour-body"></div>
      <div class="tour-actions">
        <button class="tour-skip" type="button">Skip</button>
        <div>
          <button class="tour-prev" type="button">Prev</button>
          <button class="tour-next" type="button">Next</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.tooltipEl);

    this.tooltipEl
      .querySelector(".tour-skip")
      ?.addEventListener("click", () => this.skip());
    this.tooltipEl
      .querySelector(".tour-prev")
      ?.addEventListener("click", () => this.prev());
    this.tooltipEl
      .querySelector(".tour-next")
      ?.addEventListener("click", () => this.next());
  }

  private showStep(index: number): void {
    const step = this.steps[index];
    const target = this.resolveTarget(step.targetSelector);
    if (!target) {
      if (index < this.steps.length - 1) {
        this.showStep(index + 1);
      } else {
        this.complete();
      }
      return;
    }

    this.currentStep = index;
    const rect = target.getBoundingClientRect();
    this.updateCutout(rect);
    this.positionTooltip(rect, step.position);

    if (!this.tooltipEl) return;
    (this.tooltipEl.querySelector(".tour-title") as HTMLElement).textContent =
      step.title;
    (this.tooltipEl.querySelector(".tour-body") as HTMLElement).textContent =
      step.description;
    (this.tooltipEl.querySelector(".tour-counter") as HTMLElement).textContent =
      `${index + 1} of ${this.steps.length}`;

    const prevBtn = this.tooltipEl.querySelector(
      ".tour-prev",
    ) as HTMLButtonElement;
    const nextBtn = this.tooltipEl.querySelector(
      ".tour-next",
    ) as HTMLButtonElement;
    prevBtn.style.display = index === 0 ? "none" : "inline-flex";
    nextBtn.textContent = index === this.steps.length - 1 ? "Got it!" : "Next";
  }

  private updateCutout(targetRect: DOMRect): void {
    if (!this.overlayEl) return;
    const cutout = this.overlayEl.querySelector(
      "#tour-cutout",
    ) as SVGRectElement | null;
    if (!cutout) return;

    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const xPct = ((targetRect.left - pad) / vw) * 100;
    const yPct = ((targetRect.top - pad) / vh) * 100;
    const wPct = ((targetRect.width + pad * 2) / vw) * 100;
    const hPct = ((targetRect.height + pad * 2) / vh) * 100;

    cutout.setAttribute("x", `${xPct}`);
    cutout.setAttribute("y", `${yPct}`);
    cutout.setAttribute("width", `${wPct}`);
    cutout.setAttribute("height", `${hPct}`);
  }

  private positionTooltip(
    targetRect: DOMRect,
    position: TourStep["position"],
  ): void {
    if (!this.tooltipEl) return;

    const margin = 16;
    const tooltipW = 300;
    const tooltipH = 170;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = targetRect.left;
    let top = targetRect.top;

    if (position === "below") {
      left = targetRect.left + targetRect.width / 2 - tooltipW / 2;
      top = targetRect.bottom + margin;
    } else if (position === "above") {
      left = targetRect.left + targetRect.width / 2 - tooltipW / 2;
      top = targetRect.top - tooltipH - margin;
    } else if (position === "right") {
      left = targetRect.right + margin;
      top = targetRect.top + targetRect.height / 2 - tooltipH / 2;
    } else {
      left = targetRect.left - tooltipW - margin;
      top = targetRect.top + targetRect.height / 2 - tooltipH / 2;
    }

    left = Math.max(margin, Math.min(left, vw - tooltipW - margin));
    top = Math.max(margin, Math.min(top, vh - tooltipH - margin));

    this.tooltipEl.style.left = `${left}px`;
    this.tooltipEl.style.top = `${top}px`;
  }

  private setupKeyboard(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        this.next();
      } else if (e.key === "ArrowLeft") {
        this.prev();
      } else if (e.key === "Escape") {
        this.skip();
      }
    };
    document.addEventListener("keydown", this.keyHandler);
  }

  private cleanup(markDone = false): void {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
    this.overlayEl?.remove();
    this.tooltipEl?.remove();
    this.overlayEl = null;
    this.tooltipEl = null;

    if (markDone) {
      localStorage.setItem("c1x-tour-done", "true");
    }
  }
}

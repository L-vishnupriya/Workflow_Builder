export class PaletteItem {
  private element: HTMLElement;
  public nodeType: string;

  constructor(
    nodeType: string,
    label: string,
    subtitle: string,
    color: string,
    iconHtml: string,
  ) {
    this.nodeType = nodeType;
    this.element = document.createElement("div");
    this.element.className = `wf-palette-item wf-palette-${nodeType}`;
    this.element.dataset["nodetype"] = nodeType;
    this.element.style.backgroundColor = color;
    this.element.style.padding = "10px";
    this.element.style.margin = "0";
    this.element.style.borderRadius = "10px";
    this.element.style.cursor = "grab";
    this.element.style.border = "1px solid var(--c1x-border)";
    this.element.style.display = "flex";
    this.element.style.alignItems = "flex-start";
    this.element.style.gap = "10px";
    this.element.style.userSelect = "none";
    this.element.style.transition =
      "transform 0.12s ease, box-shadow 0.12s ease";
    this.element.style.boxShadow = "var(--c1x-shadow-sm)";

    this.element.innerHTML = `
      <span class="wf-palette-icon" style="width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border-radius: 7px; background: rgba(249, 115, 22, 0.12); flex: 0 0 auto;">${iconHtml}</span>
      <span style="display:flex; flex-direction:column; gap:2px; min-width:0;">
        <span class="wf-palette-label" style="font-family: Inter, sans-serif; font-size: 13px; font-weight: 700; color: var(--c1x-text);">${label}</span>
        <span class="wf-palette-subtitle" style="font-family: Inter, sans-serif; font-size: 11px; font-weight: 500; color: var(--c1x-text-secondary);">${subtitle}</span>
      </span>
      <span class="wf-drag-handle" style="margin-left:auto; font-size:14px; color:#9CA3AF; opacity:0; transition:opacity 0.12s ease;">⠿</span>
    `;

    this.element.addEventListener("mouseenter", () => {
      this.element.style.transform = "translateY(-2px)";
      this.element.style.boxShadow = "var(--c1x-shadow-md)";
      const handle = this.element.querySelector(
        ".wf-drag-handle",
      ) as HTMLElement | null;
      if (handle) {
        handle.style.opacity = "1";
      }
    });
    this.element.addEventListener("mouseleave", () => {
      this.element.style.transform = "translateY(0)";
      this.element.style.boxShadow = "none";
      const handle = this.element.querySelector(
        ".wf-drag-handle",
      ) as HTMLElement | null;
      if (handle) {
        handle.style.opacity = "0";
      }
    });

    // Use pointerdown to fire composed custom event that pierces shadow boundaries
    this.element.addEventListener("pointerdown", (e: PointerEvent) => {
      e.preventDefault();
      // Dispatch a composed event so it can be caught by the host element (shadow host)
      this.element.dispatchEvent(
        new CustomEvent("palette-dragstart", {
          bubbles: true,
          composed: true, // pierces shadow DOM boundary
          detail: { nodeType: this.nodeType },
        }),
      );
    });
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

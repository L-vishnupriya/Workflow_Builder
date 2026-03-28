import { PaletteItem } from "./palette-item";
import { CanvasManager } from "../canvas/canvas-manager";

export class Sidebar {
  private element: HTMLElement;
  private listElement: HTMLElement;
  private canvasManager: CanvasManager;
  private activeDragType: string | null = null;
  private ghostEl: HTMLElement | null = null;
  private collapsed = false;

  constructor(canvasManager: CanvasManager) {
    this.canvasManager = canvasManager;

    this.element = document.createElement("div");
    this.element.className = "wf-sidebar workflow-sidebar";
    this.element.style.height = "100%";
    this.element.style.display = "flex";
    this.element.style.flexDirection = "column";
    this.element.style.padding = "0";
    this.element.style.overflowY = "hidden";
    this.element.style.flexShrink = "0";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "wf-sidebar-toggle";
    toggle.setAttribute("aria-label", "Toggle sidebar");
    toggle.textContent = "<";
    toggle.addEventListener("click", () => {
      this.collapsed = !this.collapsed;
      this.element.classList.toggle("is-collapsed", this.collapsed);
      toggle.textContent = this.collapsed ? ">" : "<";
    });
    this.element.appendChild(toggle);

    this.listElement = document.createElement("div");
    this.listElement.className = "wf-sidebar-list";
    this.element.appendChild(this.listElement);

    this.createItems();
    this.setupPointerDragHandlers();
  }

  private createItems() {
    const definitions = [
      {
        type: "audience",
        label: "Audience",
        subtitle: "Select Users",
        color: "#FFF7ED",
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><circle cx="16" cy="9" r="2.5"/><path d="M3 18c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/><path d="M13 18c.2-1.6 1.6-2.9 3.5-2.9 2 0 3.5 1.4 3.5 3"/></svg>`,
      },
      {
        type: "wait",
        label: "Wait",
        subtitle: "Delay Action",
        color: "#EEF2FF",
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4338CA" stroke-width="1.8"><circle cx="12" cy="13" r="7"/><path d="M12 13l3-2"/><path d="M9 3h6"/><path d="M12 6v2"/></svg>`,
      },
      {
        type: "filter",
        label: "Filter",
        subtitle: "Apply Rules",
        color: "#FFFBEB",
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="1.8"><path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>`,
      },
      {
        type: "action",
        label: "Action",
        subtitle: "Send Message",
        color: "#ECFDF5",
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M4 8l8 6 8-6"/></svg>`,
      },
      {
        type: "split",
        label: "Split",
        subtitle: "Split Flow",
        color: "#F5F3FF",
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="1.8"><path d="M4 6h5l4 5h7"/><path d="M4 18h5l4-5h7"/><path d="M18 4l3 2-3 2"/><path d="M18 16l3 2-3 2"/></svg>`,
      },
      {
        type: "end",
        label: "End",
        subtitle: "Finish workflow path",
        color: "#F9FAFB",
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M9 12h6"/></svg>`,
      },
    ];

    for (const def of definitions) {
      const item = new PaletteItem(
        def.type,
        def.label,
        def.subtitle,
        def.color,
        def.icon,
      );
      this.listElement.appendChild(item.getElement());
    }
  }

  private setupPointerDragHandlers() {
    // Listen for composed palette-dragstart events bubbling up from palette items
    // composed: true means they pierce Shadow DOM — so we can catch them on the sidebar itself
    this.element.addEventListener("palette-dragstart", (e: Event) => {
      const ce = e as CustomEvent;
      this.activeDragType = ce.detail.nodeType;
      this.createGhost();
      document.body.style.cursor = "grabbing";
    });

    // Track pointer movement at document level to show ghost
    document.addEventListener("pointermove", (e: PointerEvent) => {
      if (!this.activeDragType || !this.ghostEl) return;
      this.ghostEl.style.left = e.clientX + 10 + "px";
      this.ghostEl.style.top = e.clientY - 20 + "px";
    });

    // On pointer up — check if we're over the canvas and add the node
    document.addEventListener("pointerup", (e: PointerEvent) => {
      if (!this.activeDragType) return;

      const nodeType = this.activeDragType;
      this.activeDragType = null;
      this.removeGhost();
      document.body.style.cursor = "";

      // Check if the drop landed over the canvas element
      const canvasEl = this.canvasManager.canvasEl;
      const rect = canvasEl.getBoundingClientRect();

      const inCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (inCanvas) {
        this.canvasManager.addNodeToCanvas(nodeType, e.clientX, e.clientY);
      }
    });
  }

  private createGhost() {
    this.removeGhost();
    this.ghostEl = document.createElement("div");
    this.ghostEl.style.cssText = `
      position: fixed;
      z-index: 99999;
      pointer-events: none;
      background: #6366F1;
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-family: Inter, sans-serif;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      opacity: 0.85;
    `;
    this.ghostEl.textContent = `+ ${this.activeDragType}`;
    document.body.appendChild(this.ghostEl);
  }

  private removeGhost() {
    if (this.ghostEl && this.ghostEl.parentNode) {
      this.ghostEl.parentNode.removeChild(this.ghostEl);
      this.ghostEl = null;
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }
}

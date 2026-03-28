import { JsonHighlighter } from "./json-highlighter";
import { Tour } from "./tour";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";

import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/badge/badge.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";

setBasePath(
  "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/",
);

document.addEventListener("DOMContentLoaded", () => {
  const builder = document.getElementById("builder") as any;
  const jsonOutput = document.getElementById("json-output") as HTMLElement;
  const jsonSummary = document.getElementById("json-summary") as HTMLElement;
  const valOutput = document.getElementById("validation-output") as HTMLElement;
  const loadingScreen = document.getElementById(
    "loading-screen",
  ) as HTMLElement | null;
  const readyStatus = document.getElementById(
    "ready-status",
  ) as HTMLElement | null;

  const tabJson = document.getElementById("tab-json") as HTMLButtonElement;
  const tabVal = document.getElementById("tab-validation") as HTMLButtonElement;
  const panelJson = document.getElementById("panel-json") as HTMLElement;
  const panelVal = document.getElementById("panel-validation") as HTMLElement;

  let lastJson = "{}";
  let initialized = false;

  const markReady = () => {
    if (!readyStatus) return;
    readyStatus.classList.remove("pending");
    readyStatus.classList.add("ready");
    readyStatus.innerHTML = '<span class="ready-dot"></span>Component ready';
  };

  const loadSampleWorkflow = async () => {
    const resp = await fetch("./sample-workflow.json");
    const data = await resp.json();
    builder.loadWorkflow(JSON.stringify(data));
    setTimeout(() => {
      builder.fitToScreen();
    }, 300);
  };

  const updateJsonPanel = (json: string) => {
    jsonOutput.innerHTML = JsonHighlighter.highlight(json);
    jsonOutput.scrollTop = 0;
  };

  const showToast = (
    message: string,
    variant: "success" | "error" | "info",
  ) => {
    const toast = document.createElement("div");
    toast.className = `demo-toast ${variant}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 220);
    }, 2800);
  };

  // Step 3: Listen for changes BEFORE loading
  builder.addEventListener("workflow-change", (e: CustomEvent) => {
    handleWorkflowChange(e.detail);
  });

  builder.addEventListener("workflow-validation-failed", (e: CustomEvent) => {
    switchToValidationTab();
    renderValidationErrors(e.detail.errors);
  });

  async function initDemo() {
    if (initialized) return;
    initialized = true;
    try {
      await loadSampleWorkflow();

      // Start tour if first time
      setTimeout(() => {
        Tour.getInstance().startIfFirstVisit();
      }, 800);
    } catch (err) {
      console.error("Failed to load sample workflow", err);
      showToast("Failed to load sample workflow", "error");
    }
  }

  builder.addEventListener("workflow-ready", async () => {
    loadingScreen?.remove();
    markReady();
    await initDemo();
  });

  // Fallback: if workflow-ready fired before this listener was attached,
  // initialize once when shadow content is available.
  const initCheck = window.setInterval(async () => {
    if (initialized) {
      window.clearInterval(initCheck);
      return;
    }
    if (builder?.shadowRoot?.querySelector(".wf-container")) {
      loadingScreen?.remove();
      markReady();
      await initDemo();
      window.clearInterval(initCheck);
    }
  }, 100);

  // -------------------------
  // UI WIRING
  // -------------------------

  function handleWorkflowChange(detail: any) {
    lastJson = detail.json;
    try {
      const obj = JSON.parse(detail.json);
      const nodeCount = obj.nodes?.length || 0;
      const edgeCount = obj.edges?.length || 0;
      jsonSummary.textContent = `${nodeCount} nodes · ${edgeCount} edges`;
    } catch (e) {}

    updateJsonPanel(detail.json);

    // If validation tab is active, re-validate automatically
    if (tabVal.classList.contains("active")) {
      runValidation();
    }
  }

  function runValidation() {
    const result = builder.validateWorkflow();
    if (result.valid) {
      const graph = JSON.parse(builder.getWorkflow());
      const nodeCount = graph.nodes?.length || 0;
      const edgeCount = graph.edges?.length || 0;
      valOutput.innerHTML = `
        <div class="validation-header valid">
          <span class="validation-icon">✅</span>
          <span>Valid Workflow</span>
        </div>
        <p class="validation-summary">${nodeCount} nodes · ${edgeCount} edges · No errors detected</p>
        <button id="btn-revalidate" class="revalidate-btn">Run Validation Again</button>
      `;
      document
        .getElementById("btn-revalidate")
        ?.addEventListener("click", runValidation);
    } else {
      renderValidationErrors(result.errors);
    }
  }

  function renderValidationErrors(errors: any[]) {
    let html = `
      <div class="validation-header invalid">
        <span class="validation-icon">❌</span>
        <span>${errors.length} Validation Error${errors.length > 1 ? "s" : ""}</span>
      </div>
      <ul class="error-list">
    `;

    for (const err of errors) {
      html += `
        <li class="error-item">
          <span class="error-code">${err.code || "VALIDATION_ERROR"}</span>
          <span class="error-message">${err.message}</span>
          ${err.nodeId ? `<span class="error-node">Node: ${err.nodeId}</span>` : ""}
        </li>
      `;
    }
    html +=
      '</ul><button id="btn-revalidate" class="revalidate-btn">Run Validation Again</button>';
    valOutput.innerHTML = html;
    document
      .getElementById("btn-revalidate")
      ?.addEventListener("click", runValidation);
  }

  function switchToValidationTab() {
    tabJson.classList.remove("active");
    tabVal.classList.add("active");
    panelJson.style.display = "none";
    panelVal.style.display = "block";
  }

  tabJson.addEventListener("click", () => {
    tabVal.classList.remove("active");
    tabJson.classList.add("active");
    panelVal.style.display = "none";
    panelJson.style.display = "block";
  });

  tabVal.addEventListener("click", () => {
    switchToValidationTab();
    runValidation();
  });

  document.getElementById("revalidate-btn")?.addEventListener("click", () => {
    runValidation();
  });

  document
    .getElementById("btn-undo")
    ?.addEventListener("click", () => builder.undo());
  document
    .getElementById("btn-redo")
    ?.addEventListener("click", () => builder.redo());
  document
    .getElementById("btn-fit")
    ?.addEventListener("click", () => builder.fitToScreen());
  document
    .getElementById("btn-load-sample")
    ?.addEventListener("click", async () => {
      try {
        await loadSampleWorkflow();
        showToast("Sample workflow loaded", "success");
      } catch {
        showToast("Failed to load sample workflow", "error");
      }
    });
  document.getElementById("btn-validate")?.addEventListener("click", () => {
    switchToValidationTab();
    runValidation();
  });
  document.getElementById("btn-export")?.addEventListener("click", () => {
    try {
      const json = builder.getWorkflow();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "workflow-export.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Workflow JSON downloaded", "success");
    } catch {
      showToast("Failed to export JSON", "error");
    }
  });

  builder.addEventListener("workflow-history-changed", (e: CustomEvent) => {
    const undoBtn = document.getElementById(
      "btn-undo",
    ) as HTMLButtonElement | null;
    const redoBtn = document.getElementById(
      "btn-redo",
    ) as HTMLButtonElement | null;
    if (undoBtn) undoBtn.disabled = !e.detail?.canUndo;
    if (redoBtn) redoBtn.disabled = !e.detail?.canRedo;
  });

  document.getElementById("github-btn")?.addEventListener("click", () => {
    window.open("https://github.com/c1x-workflow");
  });
});

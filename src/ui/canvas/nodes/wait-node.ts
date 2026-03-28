// @ts-ignore
import { LiteGraph } from "litegraph.js";
import { BaseWorkflowNode } from "./base-node";

export class WaitNode extends BaseWorkflowNode {
  constructor() {
    super();
    this.addInput("in", "event");
    this.addOutput("next", "event");
    this.size = [240, 110];
    this.layoutSlots();
  }

  override getWorkflowNodeType(): string {
    return "wait";
  }

  override formatParamSummary(params: any): string {
    if (params && params.duration && params.unit) {
      return `${params.duration} ${params.unit}`;
    }
    return "";
  }
}

LiteGraph.registerNodeType("c1x/wait", WaitNode);

// @ts-ignore
import { LiteGraph } from "litegraph.js";
import { BaseWorkflowNode } from "./base-node";

export class EndNode extends BaseWorkflowNode {
  constructor() {
    super();
    this.addInput("in", "event");
    this.size = [240, 110];
    this.layoutSlots();
  }

  override getWorkflowNodeType(): string {
    return "end";
  }

  override formatParamSummary(params: any): string {
    return "";
  }
}

LiteGraph.registerNodeType("c1x/end", EndNode);

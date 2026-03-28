// @ts-ignore
import { LiteGraph } from "litegraph.js";
import { BaseWorkflowNode } from "./base-node";

export class FilterNode extends BaseWorkflowNode {
  constructor() {
    super();
    this.addInput("in", "event");
    this.addOutput("next", "event");
    this.size = [240, 110];
    this.layoutSlots();
  }

  override getWorkflowNodeType(): string {
    return "filter";
  }

  override formatParamSummary(params: any): string {
    if (params && params.condition && params.value) {
      return `${params.condition} ${params.value}`;
    }
    return "";
  }
}

LiteGraph.registerNodeType("c1x/filter", FilterNode);

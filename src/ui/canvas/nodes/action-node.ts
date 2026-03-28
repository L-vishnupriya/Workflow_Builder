// @ts-ignore
import { LiteGraph } from "litegraph.js";
import { BaseWorkflowNode } from "./base-node";

export class ActionNode extends BaseWorkflowNode {
  constructor() {
    super();
    this.addInput("in", "event");
    this.addOutput("next", "event");
    this.size = [240, 110];
    this.layoutSlots();
  }

  override getWorkflowNodeType(): string {
    return "action";
  }

  override formatParamSummary(params: any): string {
    if (params && params.channel && params.templateId) {
      return `${params.channel}: ${params.templateId}`;
    }
    return "";
  }
}

LiteGraph.registerNodeType("c1x/action", ActionNode);

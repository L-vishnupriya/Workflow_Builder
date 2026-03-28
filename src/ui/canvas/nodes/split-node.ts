// @ts-ignore
import { LiteGraph } from "litegraph.js";
import { BaseWorkflowNode } from "./base-node";

export class SplitNode extends BaseWorkflowNode {
  constructor() {
    super();
    this.addInput("in", "event");
    this.addOutput("branch_a", "event");
    this.addOutput("branch_b", "event");
    this.size = [240, 110];
    this.layoutSlots();
  }

  override getWorkflowNodeType(): string {
    return "split";
  }

  override formatParamSummary(params: any): string {
    if (params && params.condition) {
      return `Condition: ${params.condition}`;
    }
    return "";
  }
}

LiteGraph.registerNodeType("c1x/split", SplitNode);

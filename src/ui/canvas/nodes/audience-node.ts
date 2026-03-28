// @ts-ignore
import { LiteGraph } from "litegraph.js";
import { BaseWorkflowNode } from "./base-node";

export class AudienceNode extends BaseWorkflowNode {
  constructor() {
    super();
    this.addOutput("next", "event");
    this.size = [240, 110];
    this.layoutSlots();
  }

  override getWorkflowNodeType(): string {
    return "audience";
  }

  override formatParamSummary(params: any): string {
    if (params && params.segmentName) {
      return `Segment: ${params.segmentName}`;
    }
    return "";
  }
}

LiteGraph.registerNodeType("c1x/audience", AudienceNode);

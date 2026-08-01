import type { CardSnapshot } from "../domain/state/index.js";
import type { GatewayVisibleCard } from "../integrations/sts2mcp/gatewayVisibleStateProtocol.js";
import { projectGatewayVisibleCard } from "./gatewayVisibleStateProjection.js";

export type BridgeV2VisibleCard = GatewayVisibleCard;

export function projectBridgeV2Card(card: BridgeV2VisibleCard): CardSnapshot {
  return projectGatewayVisibleCard(card);
}

import type {
  BridgeDiagnosticSnapshot,
  BridgeInspectionEvidenceSnapshot,
  CardSnapshot
} from "../domain/state/index.js";
import {
  decodeBridgeV2Capabilities,
  decodeBridgeV2Inspection,
  type BridgeV2Capabilities,
  type BridgeV2Inspection
} from "../integrations/sts2mcp/bridgeV2Protocol.js";
import type { JsonObject } from "../shared/json.js";
import { projectBridgeV2Card } from "./bridgeV2CardProjection.js";
import { DiagnosticsBuilder } from "./diagnostics.js";

export interface ProjectedBridgeInspections {
  runDeck?: CardSnapshot[];
  drawPile?: CardSnapshot[];
  discardPile?: CardSnapshot[];
  exhaustPile?: CardSnapshot[];
  evidence: BridgeInspectionEvidenceSnapshot[];
  diagnostics: BridgeDiagnosticSnapshot[];
}

export function projectBridgeV2Inspections(
  capabilitiesRaw: JsonObject | undefined,
  inspectionRaw: Partial<Record<"run_deck" | "combat_piles", JsonObject>>,
  currentStateId: string | undefined,
  diagnostics: DiagnosticsBuilder
): ProjectedBridgeInspections {
  const result: ProjectedBridgeInspections = { evidence: [], diagnostics: [] };
  if (Object.keys(inspectionRaw).length === 0) return result;
  if (!capabilitiesRaw) {
    diagnostics.invalid("bridge_v2_inspections", inspectionRaw, "inspection evidence requires matching capabilities");
    return result;
  }

  let capabilities: BridgeV2Capabilities;
  try {
    capabilities = decodeBridgeV2Capabilities(capabilitiesRaw).data;
  } catch (error) {
    diagnostics.invalid("bridge_v2_inspection_capabilities", capabilitiesRaw, safeMessage(error));
    return result;
  }

  let sharedStateId = currentStateId;
  for (const kind of ["run_deck", "combat_piles"] as const) {
    const raw = inspectionRaw[kind];
    if (!raw) continue;
    let inspection: BridgeV2Inspection;
    try {
      inspection = decodeBridgeV2Inspection(raw).data;
    } catch (error) {
      diagnostics.invalid(`bridge_v2_inspections.${kind}`, raw, safeMessage(error));
      continue;
    }

    sharedStateId ??= inspection.expected_state_id;
    validateIdentity(inspection, capabilities, sharedStateId, diagnostics);
    if (inspection.kind !== kind) {
      diagnostics.invalid(`bridge_v2_inspections.${kind}.kind`, inspection.kind, "inspection key and kind differ");
      continue;
    }
    if (!capabilities.inspections.implemented_kinds.includes(kind)) {
      diagnostics.invalid(
        "bridge_v2_inspections.capability",
        kind,
        "inspection kind is not advertised by capabilities"
      );
      continue;
    }

    result.evidence.push({
      inspectionId: inspection.inspection_id,
      kind,
      expectedStateId: inspection.expected_state_id,
      observedStateId: inspection.observed_state_id,
      visibilityClass: inspection.visibility_class,
      orderingSemantics: inspection.ordering_semantics,
      playerVisibleSemantics: inspection.completeness.player_visible_semantics,
      sources: [...inspection.completeness.sources],
      missing: [...inspection.completeness.missing]
    });
    result.diagnostics.push(...inspection.diagnostics.map((item) => ({
      source: "inspection" as const,
      code: item.code,
      severity: item.severity,
      category: item.category,
      effect: item.effect,
      recoverability: item.recoverability,
      ...(item.path ? { path: item.path } : {}),
      ...(item.visibility_class ? { visibilityClass: item.visibility_class } : {}),
      ...(item.required_for_action !== null && item.required_for_action !== undefined
        ? { requiredForAction: item.required_for_action }
        : {}),
      ...(item.safe_detail ? { safeDetail: item.safe_detail } : {})
    })));

    if (inspection.content.kind === "run_deck") {
      if (inspection.content.card_count !== inspection.content.cards.length) {
        diagnostics.invalid(
          "bridge_v2_inspections.run_deck.card_count",
          inspection.content.card_count,
          "card_count does not match cards length"
        );
      }
      result.runDeck = inspection.content.cards.map(projectBridgeV2Card);
      continue;
    }

    const zones = new Map(inspection.content.zones.map((zone) => [zone.zone, zone]));
    if (zones.size !== 3 || !zones.has("draw") || !zones.has("discard") || !zones.has("exhaust")) {
      diagnostics.invalid(
        "bridge_v2_inspections.combat_piles.zones",
        inspection.content.zones,
        "combat_piles must contain exactly draw, discard, and exhaust"
      );
      continue;
    }
    for (const [zoneName, zone] of zones) {
      if (zone.card_count !== zone.cards.length) {
        diagnostics.invalid(
          `bridge_v2_inspections.combat_piles.${zoneName}.card_count`,
          zone.card_count,
          "card_count does not match cards length"
        );
      }
    }
    result.drawPile = zones.get("draw")!.cards.map(projectBridgeV2Card);
    result.discardPile = zones.get("discard")!.cards.map(projectBridgeV2Card);
    result.exhaustPile = zones.get("exhaust")!.cards.map(projectBridgeV2Card);
  }
  return result;
}

function validateIdentity(
  inspection: BridgeV2Inspection,
  capabilities: BridgeV2Capabilities,
  expectedStateId: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (inspection.expected_state_id !== expectedStateId || inspection.observed_state_id !== expectedStateId) {
    diagnostics.invalid(
      `bridge_v2_inspections.${inspection.kind}.state_id`,
      { expected: inspection.expected_state_id, observed: inspection.observed_state_id },
      "inspection is not bound to the exact current state"
    );
  }
  if (inspection.bridge.id !== capabilities.bridge.id
      || inspection.bridge.version !== capabilities.bridge.version
      || inspection.bridge.upstream_commit !== capabilities.bridge.upstream_commit
      || inspection.bridge.module_version_id !== capabilities.bridge.module_version_id
      || inspection.bridge.runtime_instance_id !== capabilities.bridge.runtime_instance_id) {
    diagnostics.invalid(
      `bridge_v2_inspections.${inspection.kind}.bridge`,
      inspection.bridge,
      "inspection and capabilities bridge identities differ"
    );
  }
  const allowedKinds = [
    ...inspection.game.compatibility.inspection_allowed_kinds,
    ...inspection.game.compatibility.inspection_canary_kinds
  ];
  const inspectionKindAllowed = inspection.game.compatibility.inspection_allowed
    && allowedKinds.includes(inspection.kind);
  if (inspection.game.version !== capabilities.game.version
      || inspection.game.commit !== capabilities.game.commit
      || inspection.game.main_assembly_hash !== capabilities.game.main_assembly_hash
      || !inspectionKindAllowed) {
    diagnostics.invalid(
      `bridge_v2_inspections.${inspection.kind}.game`,
      inspection.game,
      "inspection does not match an identity with authority for this inspection kind"
    );
  }
  if (inspection.observation_policy.id !== capabilities.observation_policy.id
      || inspection.observation_policy.includes_hidden_information) {
    diagnostics.invalid(
      `bridge_v2_inspections.${inspection.kind}.observation_policy`,
      inspection.observation_policy,
      "inspection observation policy is incompatible or exposes hidden information"
    );
  }
}

function safeMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}

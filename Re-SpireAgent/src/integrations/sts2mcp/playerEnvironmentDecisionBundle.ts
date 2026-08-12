import type {
  PlayerEnvironmentRead,
  PlayerEnvironmentReadResponse,
  PlayerEnvironmentSnapshot
} from "./playerEnvironmentProtocol.js";

export interface PlayerEnvironmentDecisionBundle {
  observation: PlayerEnvironmentSnapshot;
  reads: PlayerEnvironmentReadResponse[];
}

export type PlayerEnvironmentReadFetcher = (
  readId: string,
  expectedSnapshotId: string
) => Promise<PlayerEnvironmentReadResponse>;

/**
 * Consumer-side eager aggregation for policies that cannot issue lazy reads.
 * It adds no facts or action authority: every result must be an advertised,
 * state-bound C read from the same runtime and environment.
 */
export async function prefetchPlayerEnvironmentDecisionBundle(
  observation: PlayerEnvironmentSnapshot,
  fetchRead: PlayerEnvironmentReadFetcher,
  include: (read: PlayerEnvironmentRead) => boolean = () => true
): Promise<PlayerEnvironmentDecisionBundle> {
  const selected = observation.reads
    .filter(include)
    .sort((left, right) => left.read_id.localeCompare(right.read_id));
  const reads = await Promise.all(selected.map(async (opportunity) => {
    const read = await fetchRead(opportunity.read_id, observation.snapshot_id);
    assertCoherentRead(observation, opportunity, read);
    return read;
  }));
  return { observation, reads };
}

function assertCoherentRead(
  observation: PlayerEnvironmentSnapshot,
  opportunity: PlayerEnvironmentRead,
  read: PlayerEnvironmentReadResponse
): void {
  if (read.read_id !== opportunity.read_id
      || read.expected_snapshot_id !== observation.snapshot_id
      || read.observed_snapshot_id !== observation.snapshot_id
      || read.kind !== opportunity.kind
      || (read.target_referent_id ?? null) !== (opportunity.target_referent_id ?? null)
      || read.session.runtime_instance_id !== observation.session.runtime_instance_id
      || read.session.environment_fingerprint !== observation.session.environment_fingerprint) {
    throw new Error(`Player Environment read ${opportunity.read_id} is not coherent with snapshot ${observation.snapshot_id}`);
  }
}

/** The only executable action in the current Re production path. */
export interface ExecutableGameAction {
  kind: "bound_action";
  choiceId: string;
  expectedSnapshotId: string;
  boundActionId: string;
}

/** The only executable action in the current Re production path. */
export interface ExecutableGameAction {
  kind: "human_ui_action";
  choiceId: string;
  expectedSnapshotId: string;
  boundActionId: string;
}

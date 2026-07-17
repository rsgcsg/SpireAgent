namespace STS2_MCP.BridgeV2.Game;

internal sealed record MerchantRemovalCommitBaseline(
    int Gold,
    int Cost,
    int DeckCount,
    int CardShopRemovalsUsed);

internal sealed record MerchantRemovalCommitObservation(
    bool SelectorClosed,
    bool SelectedCardStillInDeck,
    int Gold,
    int DeckCount,
    int CardShopRemovalsUsed,
    bool ServiceUsed);

/// <summary>
/// Pure semantic postcondition for the exact v0.109 ordinary merchant-removal
/// flow. Closing the selector is only an intermediate transition; the command
/// is complete only after the game-owned transaction has committed all visible
/// effects and consumed the service.
/// </summary>
internal static class MerchantRemovalCompletionWitness
{
    public static bool IsSatisfied(
        MerchantRemovalCommitBaseline baseline,
        MerchantRemovalCommitObservation current) =>
        current.SelectorClosed
        && !current.SelectedCardStillInDeck
        && current.Gold == baseline.Gold - baseline.Cost
        && current.DeckCount == baseline.DeckCount - 1
        && current.CardShopRemovalsUsed == baseline.CardShopRemovalsUsed + 1
        && current.ServiceUsed;
}

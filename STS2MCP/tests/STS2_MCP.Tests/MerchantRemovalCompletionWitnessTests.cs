using STS2_MCP.BridgeV2.Game;

namespace STS2_MCP.Tests;

public sealed class MerchantRemovalCompletionWitnessTests
{
    private static readonly MerchantRemovalCommitBaseline Baseline = new(
        Gold: 250,
        Cost: 100,
        DeckCount: 11,
        CardShopRemovalsUsed: 0);

    [Fact]
    public void ExactSemanticPostStateCompletesMerchantRemoval()
    {
        var current = new MerchantRemovalCommitObservation(
            SelectorClosed: true,
            SelectedCardStillInDeck: false,
            Gold: 150,
            DeckCount: 10,
            CardShopRemovalsUsed: 1,
            ServiceUsed: true);

        Assert.True(MerchantRemovalCompletionWitness.IsSatisfied(Baseline, current));
    }

    [Theory]
    [InlineData(false, false, 150, 10, 1, true)]
    [InlineData(true, true, 150, 10, 1, true)]
    [InlineData(true, false, 151, 10, 1, true)]
    [InlineData(true, false, 150, 11, 1, true)]
    [InlineData(true, false, 150, 10, 0, true)]
    [InlineData(true, false, 150, 10, 1, false)]
    public void PartialOrContradictoryPostStateDoesNotMasqueradeAsCompletion(
        bool selectorClosed,
        bool selectedCardStillInDeck,
        int gold,
        int deckCount,
        int removalsUsed,
        bool serviceUsed)
    {
        var current = new MerchantRemovalCommitObservation(
            selectorClosed,
            selectedCardStillInDeck,
            gold,
            deckCount,
            removalsUsed,
            serviceUsed);

        Assert.False(MerchantRemovalCompletionWitness.IsSatisfied(Baseline, current));
    }
}

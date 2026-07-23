using STS2_MCP.BridgeV2.Game;

namespace STS2_MCP.Tests;

public sealed class RewardCardRemovalCompletionWitnessTests
{
    [Fact]
    public void RequiresExactTaskCompletionSelectorClosureAndSelectedCardRemoval()
    {
        object removed = new();
        object retained = new();
        object added = new();
        object[] baseline = { removed, retained };

        Assert.True(RewardCardRemovalCompletionWitness.IsSatisfied(
            sourceCompleted: true,
            selectorClosed: true,
            baselineDeck: baseline,
            currentDeck: new[] { retained },
            selectedCard: removed));
        Assert.False(RewardCardRemovalCompletionWitness.IsSatisfied(
            sourceCompleted: false,
            selectorClosed: true,
            baselineDeck: baseline,
            currentDeck: new[] { retained },
            selectedCard: removed));
        Assert.False(RewardCardRemovalCompletionWitness.IsSatisfied(
            sourceCompleted: true,
            selectorClosed: false,
            baselineDeck: baseline,
            currentDeck: new[] { retained },
            selectedCard: removed));
        Assert.False(RewardCardRemovalCompletionWitness.IsSatisfied(
            sourceCompleted: true,
            selectorClosed: true,
            baselineDeck: baseline,
            currentDeck: new[] { retained, added },
            selectedCard: removed));
    }
}

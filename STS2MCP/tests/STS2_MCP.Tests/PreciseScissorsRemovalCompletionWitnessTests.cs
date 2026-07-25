using STS2_MCP.BridgeV2.Game;

namespace STS2_MCP.Tests;

public sealed class PreciseScissorsRemovalCompletionWitnessTests
{
    [Fact]
    public void RequiresExactTaskCompletionSelectorClosureAndSelectedCardRemoval()
    {
        object removed = new();
        object retained = new();
        object added = new();
        object[] baseline = { removed, retained };

        Assert.True(PreciseScissorsRemovalCompletionWitness.IsSatisfied(
            sourceCompleted: true,
            selectorClosed: true,
            baselineDeck: baseline,
            currentDeck: new[] { retained },
            selectedCard: removed));
        Assert.False(PreciseScissorsRemovalCompletionWitness.IsSatisfied(
            sourceCompleted: false,
            selectorClosed: true,
            baselineDeck: baseline,
            currentDeck: new[] { retained },
            selectedCard: removed));
        Assert.False(PreciseScissorsRemovalCompletionWitness.IsSatisfied(
            sourceCompleted: true,
            selectorClosed: true,
            baselineDeck: baseline,
            currentDeck: new[] { retained, added },
            selectedCard: removed));
    }
}

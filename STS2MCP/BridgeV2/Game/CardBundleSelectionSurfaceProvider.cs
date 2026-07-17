using System;
using System.Collections.Generic;
using System.Linq;
using Godot;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Relics;
using MegaCrit.Sts2.Core.Nodes.Cards;
using MegaCrit.Sts2.Core.Nodes.Cards.Holders;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.Screens.CardSelection;
using MegaCrit.Sts2.Core.Nodes.Screens.Overlays;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;

namespace STS2_MCP.BridgeV2.Game;

/// <summary>
/// Exact two-stage protocol for choosing one visible pack of cards. A bundle
/// is one atomic reward choice; its cards are not independent actions.
/// </summary>
internal sealed class CardBundleSelectionSurfaceProvider : IBridgeSurfaceProvider
{
    private const string SurfaceKind = "card_bundle_selection";

    public string Kind => SurfaceKind;

    public BridgeSurfaceLayer Layer => BridgeSurfaceLayer.Overlay;

    public BridgeObservationDraft? TryBuild(
        ActiveSurfaceSnapshot snapshot,
        BridgeEntityRegistry entities,
        GameBuildIdentity game)
    {
        if (snapshot.TopOverlay is not NChooseABundleSelectionScreen screen)
            return null;

        Control? row = screen.GetNodeOrNull<Control>("%BundleRow");
        Control? preview = screen.GetNodeOrNull<Control>("%BundlePreviewContainer");
        Control? previewCards = screen.GetNodeOrNull<Control>("%Cards");
        NBackButton? cancel = screen.GetNodeOrNull<NBackButton>("%Cancel");
        NConfirmButton? confirm = screen.GetNodeOrNull<NConfirmButton>("%Confirm");
        NCommonBanner? banner = screen.GetNodeOrNull<NCommonBanner>("Banner");
        if (row == null || preview == null || previewCards == null || cancel == null || confirm == null || banner?.label == null)
            return BindingUnavailable(game, BridgeContextBuilder.Build(entities), "Visible card-bundle controls are unavailable.");

        NCardBundle[] allBundles = McpMod.FindAll<NCardBundle>(screen)
            .Where(McpMod.IsLiveNode)
            .OrderBy(bundle => bundle.Position.X)
            .ThenBy(bundle => bundle.Position.Y)
            .ToArray();
        if (allBundles.Length == 0 || allBundles.Any(bundle => bundle.Bundle == null || bundle.Bundle.Count == 0))
            return BindingUnavailable(game, BridgeContextBuilder.Build(entities), "No complete visible card bundles are bound.");
        CardModel[] allCards = allBundles.SelectMany(bundle => bundle.Bundle).ToArray();
        if (allCards.Length == 0
            || allCards.Any(card => !ReferenceEquals(card.Owner, allCards[0].Owner))
            || !allCards[0].Owner.Relics.Any(relic => relic is ScrollBoxes)
            || allCards.Any(card => allCards[0].Owner.Deck.Cards.Contains(card)))
        {
            return BindingUnavailable(
                game,
                BridgeContextBuilder.Build(entities),
                "The bundle selector is not the exact source-qualified Scroll Boxes add-to-deck lifecycle.");
        }

        bool previewShowing = preview.Visible;
        NCardBundle? selected = previewShowing ? ResolvePreviewedBundle(allBundles, previewCards) : null;
        if (previewShowing && selected == null)
            return BindingUnavailable(game, BridgeContextBuilder.Build(entities), "The preview cards do not identify exactly one source bundle.");

        string? prompt = ReadText(banner.label);
        NCardBundle[] exposedBundles = selected == null ? allBundles : new[] { selected };
        VisibleCardBundle[] bundles = exposedBundles.Select(bundle => new VisibleCardBundle(
            entities.GetId(bundle, "card_bundle"),
            bundle.Bundle.Select(card => BridgeContextBuilder.BuildCard(
                card,
                entities.GetId(card, "card"),
                displayPile: PileType.None)).ToArray())).ToArray();
        string? selectedId = selected == null ? null : entities.GetId(selected, "card_bundle");
        string stage = previewShowing ? "preview" : "choosing";
        var surface = new CardBundleSelectionSurface(
            SurfaceKind,
            stage,
            entities.GetId(screen, "screen"),
            prompt,
            selectedId,
            bundles);
        var actions = new List<BridgeActionDraft>();

        if (!previewShowing && row.Visible)
        {
            foreach (NCardBundle bundle in allBundles.Where(bundle =>
                         McpMod.IsNodeVisible(bundle) && bundle.Hitbox is { IsEnabled: true }))
            {
                string bundleId = entities.GetId(bundle, "card_bundle");
                string names = string.Join(", ", bundle.Bundle.Select(card =>
                    McpMod.SafeGetText(() => card.Title) ?? card.Id.Entry));
                actions.Add(new BridgeActionDraft(
                    $"preview_card_bundle:{bundleId}",
                    "preview_card_bundle",
                    "selection",
                    $"Preview bundle: {names}",
                    "NCardBundle.Hitbox+NChooseABundleSelectionScreen.OnBundleClicked",
                    () => StartPreview(screen, bundle, preview, previewCards),
                    new[] { new ActionEntityBinding("bundle", bundleId) }));
            }
        }
        else if (selected != null)
        {
            if (confirm.IsEnabled && McpMod.IsNodeVisible(confirm))
            {
                actions.Add(new BridgeActionDraft(
                    $"confirm_card_bundle:{selectedId}",
                    "confirm_card_bundle",
                    "commit",
                    "Add the previewed bundle to the run deck",
                    "NChooseABundleSelectionScreen.%Confirm+ScrollBoxes.CardPileCmd.Add(Deck)+exact-card-post-state",
                    () => StartConfirm(screen, selected, confirm),
                    new[] { new ActionEntityBinding("bundle", selectedId!) }));
            }
            if (cancel.IsEnabled && McpMod.IsNodeVisible(cancel))
            {
                actions.Add(new BridgeActionDraft(
                    $"cancel_card_bundle_preview:{selectedId}",
                    "cancel_card_bundle_preview",
                    "navigation",
                    "Return to bundle choices",
                    "NChooseABundleSelectionScreen.%Cancel+CancelSelection",
                    () => StartCancel(screen, selected, cancel, preview),
                    new[] { new ActionEntityBinding("bundle", selectedId!) }));
            }
        }

        string readiness = actions.Count > 0 ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_two_stage_visible_card_bundle_selection",
            actions.Count > 0
                ? "derived_from_current_bundle_hitboxes_or_preview_controls"
                : "temporarily_empty_while_bundle_ui_settles",
            new[]
            {
                "NChooseABundleSelectionScreen visible overlay",
                "NCardBundle.Bundle+Hitbox",
                "NChooseABundleSelectionScreen.%BundlePreviewContainer+%Cards",
                "NChooseABundleSelectionScreen.%Confirm+%Cancel",
                "ScrollBoxes.AfterObtained+CardSelectCmd.FromChooseABundleScreen+CardPileCmd.Add(Deck)"
            },
            Array.Empty<string>());
        string signature = BridgeHash.Object(new
        {
            game.Version,
            surface,
            actionKeys = actions.Select(action => action.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray()
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            BridgeContextBuilder.Build(entities),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            actions);
    }

    private static BridgeActionStartResult StartPreview(
        NChooseABundleSelectionScreen expectedScreen,
        NCardBundle expectedBundle,
        Control expectedPreview,
        Control expectedPreviewCards)
    {
        if (!IsCurrent(expectedScreen)
            || expectedPreview.Visible
            || !McpMod.FindAll<NCardBundle>(expectedScreen).Any(bundle => ReferenceEquals(bundle, expectedBundle))
            || !McpMod.IsNodeVisible(expectedBundle)
            || expectedBundle.Hitbox is not { IsEnabled: true })
        {
            return BridgeActionStartResult.Rejected("bundle_choice_changed", "The advertised bundle is no longer selectable.");
        }

        expectedBundle.Hitbox.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen)
                  && expectedPreview.Visible
                  && ReferenceEquals(ResolvePreviewedBundle(
                      McpMod.FindAll<NCardBundle>(expectedScreen).ToArray(), expectedPreviewCards), expectedBundle),
            "exact_bundle_preview_opened");
    }

    private static BridgeActionStartResult StartConfirm(
        NChooseABundleSelectionScreen expectedScreen,
        NCardBundle expectedBundle,
        NConfirmButton expectedConfirm)
    {
        Control? previewCards = expectedScreen.GetNodeOrNull<Control>("%Cards");
        CardModel[] expectedCards = expectedBundle.Bundle.ToArray();
        if (!IsCurrent(expectedScreen)
            || previewCards == null
            || !ReferenceEquals(ResolvePreviewedBundle(
                McpMod.FindAll<NCardBundle>(expectedScreen).ToArray(), previewCards), expectedBundle)
            || expectedCards.Length == 0
            || expectedCards.Any(card => !ReferenceEquals(card.Owner, expectedCards[0].Owner))
            || expectedCards.Any(card => expectedCards[0].Owner.Deck.Cards.Contains(card))
            || !expectedConfirm.IsEnabled
            || !McpMod.IsNodeVisible(expectedConfirm))
        {
            return BridgeActionStartResult.Rejected("bundle_preview_changed", "The previewed bundle is no longer confirmable.");
        }

        expectedConfirm.ForceClick();
        return BridgeActionStartResult.Started(
            () => !IsCurrent(expectedScreen) && BundleCommittedToDeck(expectedCards),
            "bundle_selection_closed_and_exact_cards_added_to_run_deck",
            allowIntermediateStateChanges: true);
    }

    private static bool BundleCommittedToDeck(IReadOnlyList<CardModel> expectedCards)
    {
        try
        {
            return expectedCards.Count > 0
                   && expectedCards.All(card => ReferenceEquals(card.Owner, expectedCards[0].Owner))
                   && expectedCards.All(card => expectedCards[0].Owner.Deck.Cards.Contains(card));
        }
        catch
        {
            return false;
        }
    }

    private static BridgeActionStartResult StartCancel(
        NChooseABundleSelectionScreen expectedScreen,
        NCardBundle expectedBundle,
        NBackButton expectedCancel,
        Control expectedPreview)
    {
        Control? previewCards = expectedScreen.GetNodeOrNull<Control>("%Cards");
        if (!IsCurrent(expectedScreen)
            || previewCards == null
            || !ReferenceEquals(ResolvePreviewedBundle(
                McpMod.FindAll<NCardBundle>(expectedScreen).ToArray(), previewCards), expectedBundle)
            || !expectedCancel.IsEnabled
            || !McpMod.IsNodeVisible(expectedCancel))
        {
            return BridgeActionStartResult.Rejected("bundle_preview_changed", "The previewed bundle is no longer cancelable.");
        }

        expectedCancel.ForceClick();
        return BridgeActionStartResult.Started(
            () => IsCurrent(expectedScreen) && !expectedPreview.Visible,
            "bundle_preview_closed_without_commit");
    }

    private static NCardBundle? ResolvePreviewedBundle(
        IReadOnlyList<NCardBundle> bundles,
        Control previewCards)
    {
        CardModel[] cards = McpMod.FindAll<NPreviewCardHolder>(previewCards)
            .Where(holder => holder.CardModel != null && McpMod.IsLiveNode(holder))
            .Select(holder => holder.CardModel)
            .OfType<CardModel>()
            .ToArray();
        if (cards.Length == 0)
            return null;
        NCardBundle[] matches = bundles.Where(bundle =>
            bundle.Bundle.Count == cards.Length
            && bundle.Bundle.Zip(cards).All(pair => ReferenceEquals(pair.First, pair.Second))).ToArray();
        return matches.Length == 1 ? matches[0] : null;
    }

    private static bool IsCurrent(NChooseABundleSelectionScreen screen) =>
        ActiveSurfaceResolver.IsVisibleActiveOverlay(screen)
        && ReferenceEquals(NOverlayStack.Instance?.Peek(), screen);

    private static string? ReadText(MegaCrit.Sts2.addons.mega_text.MegaLabel label)
    {
        try
        {
            string value = label.Text?.ToString() ?? string.Empty;
            value = McpMod.StripRichTextTags(value).Trim();
            return value.Length == 0 ? null : value;
        }
        catch
        {
            return null;
        }
    }

    private static BridgeObservationDraft BindingUnavailable(
        GameBuildIdentity game,
        IBridgeContext context,
        string reason)
    {
        var surface = new UnsupportedSurface("unsupported", SurfaceKind, reason);
        var completeness = new StateCompleteness(
            "partial",
            "empty_fail_closed",
            new[] { "NChooseABundleSelectionScreen exact-version binding" },
            new[] { "bundle_membership", "stage", "legal_actions" });
        string signature = BridgeHash.Object(new { game.Version, reason });
        return new BridgeObservationDraft(
            signature,
            "degraded",
            context,
            surface,
            completeness,
            game,
            new[] { "card_bundle_selection_binding_unavailable" },
            Array.Empty<BridgeActionDraft>())
        {
            Diagnostics = new[]
            {
                BridgeDiagnostics.Create(
                    "bridge.surface.card_bundle_selection.binding_unavailable",
                    "error",
                    "surface",
                    "actions_suppressed",
                    "update_bridge",
                    reason)
            }
        };
    }
}

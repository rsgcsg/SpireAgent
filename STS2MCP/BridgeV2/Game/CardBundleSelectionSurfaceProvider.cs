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
    internal const string PreviewCompletionWitness = "exact_bundle_preview_opened";
    internal const string ConfirmCompletionWitness =
        "bundle_selection_closed_and_exact_cards_added_to_run_deck";
    internal const string CancelPreviewCompletionWitness =
        "bundle_preview_closed_without_commit";

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
        if (!HasExactScrollBoxesSource(allBundles))
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
        string[] selectableBundleIds = !previewShowing && row.Visible
            ? allBundles.Where(bundle =>
                    McpMod.IsNodeVisible(bundle) && bundle.Hitbox is { IsEnabled: true })
                .Select(bundle => entities.GetId(bundle, "card_bundle"))
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray()
            : Array.Empty<string>();
        bool canConfirm = previewShowing
                          && confirm.IsEnabled
                          && McpMod.IsNodeVisible(confirm);
        bool canCancelPreview = previewShowing
                                && cancel.IsEnabled
                                && McpMod.IsNodeVisible(cancel);
        var surface = new CardBundleSelectionSurface(
            SurfaceKind,
            stage,
            entities.GetId(screen, "screen"),
            prompt,
            selectedId,
            selectableBundleIds,
            canConfirm,
            canCancelPreview,
            bundles);
        bool hasCurrentCommand = selectableBundleIds.Length > 0
                                 || canConfirm
                                 || canCancelPreview;
        string readiness = hasCurrentCommand ? "ready" : "settling";
        var completeness = new StateCompleteness(
            "contract_complete_for_two_stage_visible_card_bundle_selection",
            hasCurrentCommand
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
            surface
        });
        return new BridgeObservationDraft(
            signature,
            readiness,
            BridgeContextBuilder.Build(entities),
            surface,
            completeness,
            game,
            Array.Empty<string>(),
            Array.Empty<BridgeActionDraft>());
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
            PreviewCompletionWitness);
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
            ConfirmCompletionWitness,
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
            CancelPreviewCompletionWitness);
    }

    internal static BridgeActionStartResult StartDirectPreview(
        BridgeEntityRegistry entities,
        string screenId,
        string bundleId)
    {
        if (!TryResolveDirect(
                entities,
                screenId,
                bundleId,
                out NChooseABundleSelectionScreen? screen,
                out NCardBundle? bundle,
                out BridgeActionStartResult? rejection)
            || screen == null
            || bundle == null)
        {
            return rejection!;
        }
        Control? preview = screen.GetNodeOrNull<Control>("%BundlePreviewContainer");
        Control? previewCards = screen.GetNodeOrNull<Control>("%Cards");
        return preview == null || previewCards == null
            ? BridgeActionStartResult.Rejected(
                "bundle_controls_changed",
                "The exact bundle preview controls are no longer available.")
            : StartPreview(screen, bundle, preview, previewCards);
    }

    internal static BridgeActionStartResult StartDirectConfirm(
        BridgeEntityRegistry entities,
        string screenId,
        string bundleId)
    {
        if (!TryResolveDirect(
                entities,
                screenId,
                bundleId,
                out NChooseABundleSelectionScreen? screen,
                out NCardBundle? bundle,
                out BridgeActionStartResult? rejection)
            || screen == null
            || bundle == null)
        {
            return rejection!;
        }
        NConfirmButton? confirm = screen.GetNodeOrNull<NConfirmButton>("%Confirm");
        return confirm == null
            ? BridgeActionStartResult.Rejected(
                "bundle_controls_changed",
                "The exact bundle confirmation control is no longer available.")
            : StartConfirm(screen, bundle, confirm);
    }

    internal static BridgeActionStartResult StartDirectCancel(
        BridgeEntityRegistry entities,
        string screenId,
        string bundleId)
    {
        if (!TryResolveDirect(
                entities,
                screenId,
                bundleId,
                out NChooseABundleSelectionScreen? screen,
                out NCardBundle? bundle,
                out BridgeActionStartResult? rejection)
            || screen == null
            || bundle == null)
        {
            return rejection!;
        }
        NBackButton? cancel = screen.GetNodeOrNull<NBackButton>("%Cancel");
        Control? preview = screen.GetNodeOrNull<Control>("%BundlePreviewContainer");
        return cancel == null || preview == null
            ? BridgeActionStartResult.Rejected(
                "bundle_controls_changed",
                "The exact bundle cancel controls are no longer available.")
            : StartCancel(screen, bundle, cancel, preview);
    }

    private static bool TryResolveDirect(
        BridgeEntityRegistry entities,
        string screenId,
        string bundleId,
        out NChooseABundleSelectionScreen? screen,
        out NCardBundle? bundle,
        out BridgeActionStartResult? rejection)
    {
        bundle = null;
        rejection = null;
        if (!entities.TryResolve(screenId, out screen)
            || screen == null
            || !IsCurrent(screen))
        {
            rejection = BridgeActionStartResult.Rejected(
                "card_bundle_owner_changed",
                "The exact card-bundle owner is no longer current.");
            return false;
        }
        NCardBundle[] bundles = McpMod.FindAll<NCardBundle>(screen)
            .Where(McpMod.IsLiveNode)
            .ToArray();
        if (!HasExactScrollBoxesSource(bundles)
            || !entities.TryResolve(bundleId, out NCardBundle? resolvedBundle)
            || resolvedBundle == null
            || !bundles.Any(candidate => ReferenceEquals(candidate, resolvedBundle)))
        {
            rejection = BridgeActionStartResult.Rejected(
                "card_bundle_source_changed",
                "The exact Scroll Boxes bundle source or selected bundle changed.");
            return false;
        }
        bundle = resolvedBundle;
        return true;
    }

    private static bool HasExactScrollBoxesSource(IReadOnlyList<NCardBundle> bundles)
    {
        if (bundles.Count == 0 || bundles.Any(bundle => bundle.Bundle == null || bundle.Bundle.Count == 0))
            return false;
        CardModel[] cards = bundles.SelectMany(bundle => bundle.Bundle).ToArray();
        return cards.Length > 0
               && cards.All(card => ReferenceEquals(card.Owner, cards[0].Owner))
               && cards[0].Owner.Relics.Any(relic => relic is ScrollBoxes)
               && cards.All(card => !cards[0].Owner.Deck.Cards.Contains(card));
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

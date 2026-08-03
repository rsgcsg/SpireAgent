using System;
using System.Collections.Generic;
using System.Linq;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Context;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Merchant;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Nodes;
using MegaCrit.Sts2.Core.Nodes.Cards;
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.CommonUi;
using MegaCrit.Sts2.Core.Nodes.GodotExtensions;
using MegaCrit.Sts2.Core.Nodes.Rooms;
using MegaCrit.Sts2.Core.Nodes.Screens;
using MegaCrit.Sts2.Core.Nodes.Screens.Capstones;
using MegaCrit.Sts2.Core.Nodes.Screens.ScreenContext;
using MegaCrit.Sts2.Core.Nodes.Screens.Shops;
using MegaCrit.Sts2.Core.Nodes.TopBar;
using MegaCrit.Sts2.Core.Rooms;
using MegaCrit.Sts2.Core.Runs;
using STS2_MCP.BridgeV2.Game;
using STS2_MCP.BridgeV2.Protocol;
using STS2_MCP.BridgeV2.Runtime;
using STS2_MCP.ConnectorV3.Protocol;

namespace STS2_MCP.ConnectorV3.Runtime;

internal sealed record ConnectorV3HumanEquivalenceOperationResult(
    ConnectorV3HumanEquivalenceResponse? Response,
    string? ErrorCode,
    string? Detail);

internal sealed record ConnectorV3HumanEquivalenceRuntimeSnapshot(
    string StateToken,
    string RuntimeInstanceId,
    ConnectorV3HumanEquivalenceOwner Owner,
    BridgeServerIdentity Bridge,
    GameBuildIdentity Game,
    IReadOnlyList<string> InspectionKinds);

internal sealed record ConnectorV3HumanEquivalencePageResult(
    ConnectorV3HumanEquivalencePageRead? Page,
    string? ErrorCode,
    string? Detail)
{
    public static ConnectorV3HumanEquivalencePageResult Success(
        ConnectorV3HumanEquivalencePageRead page) => new(page, null, null);

    public static ConnectorV3HumanEquivalencePageResult Failure(
        string code,
        string detail) => new(null, code, detail);
}

internal interface IConnectorV3HumanEquivalenceEnvironment
{
    bool HasOwnedPage { get; }

    ConnectorV3HumanEquivalenceRuntimeSnapshot Capture();

    ConnectorV3HumanEquivalencePageResult Open(
        string kind,
        ConnectorV3HumanEquivalenceRuntimeSnapshot pre);

    ConnectorV3HumanEquivalencePageResult Read(string kind);

    ConnectorV3HumanEquivalencePageResult Return(string kind);

    void Reset();
}

internal sealed class ConnectorV3HumanEquivalenceSessionMachine
{
    internal const string RunDeckKind = "run_deck";
    internal const string CombatDrawPileKind = "combat_draw_pile";
    internal const string CombatDiscardPileKind = "combat_discard_pile";
    internal const string CombatExhaustPileKind = "combat_exhaust_pile";
    internal const string ShopCatalogKind = "shop_catalog";

    private static readonly string[] Kinds =
    {
        RunDeckKind,
        CombatDrawPileKind,
        CombatDiscardPileKind,
        CombatExhaustPileKind,
        ShopCatalogKind
    };

    private readonly IConnectorV3HumanEquivalenceEnvironment _environment;
    private bool _enabled;
    private Session? _session;

    private sealed record Session(
        string Id,
        string Kind,
        string ExpectedStateToken,
        string ExpectedRuntimeInstanceId,
        ConnectorV3HumanEquivalenceRuntimeSnapshot Pre,
        ConnectorV3HumanEquivalenceRuntimeSnapshot Current,
        ConnectorV3HumanEquivalenceRuntimeSnapshot? Post,
        ConnectorV3HumanEquivalencePageRead? Page,
        string Phase,
        string? ErrorCode,
        string? Detail);

    public ConnectorV3HumanEquivalenceSessionMachine(
        IConnectorV3HumanEquivalenceEnvironment environment)
    {
        _environment = environment;
    }

    public bool ReservesInputOwner =>
        _session != null && _session.Phase != "returned";

    public string? ActiveSessionId => ReservesInputOwner ? _session?.Id : null;

    public void Configure(bool enabled) => _enabled = enabled;

    public ConnectorV3HumanEquivalenceCapability Capability() => new(
        ConnectorV3Contract.HumanEquivalenceProfile,
        _enabled,
        Kinds,
        StateBound: true,
        RuntimeBound: true,
        DefaultInAgentFlow: false,
        CreatesActionAuthority: false,
        EntersCommandLedger: false);

    public ConnectorV3HumanEquivalenceOperationResult Open(
        ConnectorV3HumanEquivalenceOpenRequest request)
    {
        ConnectorV3HumanEquivalenceRuntimeSnapshot current = _environment.Capture();
        string profile = request.Profile ?? string.Empty;
        string kind = request.Kind ?? string.Empty;
        string expectedStateToken = request.ExpectedStateToken ?? string.Empty;
        string expectedRuntime = request.ExpectedRuntimeInstanceId ?? string.Empty;

        if (!_enabled)
            return Failure("human_equivalence_disabled", "The optional native-page evidence profile is disabled in STS2_MCP.conf.");
        if (!string.Equals(profile, ConnectorV3Contract.HumanEquivalenceProfile, StringComparison.Ordinal))
            return Failure("human_equivalence_profile_mismatch", "The request does not name the configured native-page evidence profile.");
        if (!Kinds.Contains(kind, StringComparer.Ordinal))
            return Failure("human_equivalence_kind_not_supported", "The requested native page is outside the fixed evidence profile.");
        if (ReservesInputOwner)
            return Failure("human_equivalence_session_active", "Return or recover the active native-page evidence session first.");
        if (!string.Equals(current.RuntimeInstanceId, expectedRuntime, StringComparison.Ordinal))
            return Failure("runtime_instance_changed", "The expected Gateway runtime instance is no longer loaded.");
        if (!string.Equals(current.StateToken, expectedStateToken, StringComparison.Ordinal))
            return Failure("stale_state", "The expected state token is no longer current; obtain a fresh observation before opening a native page.");

        string inspectionKind = InspectionKind(kind);
        if (!current.InspectionKinds.Contains(inspectionKind, StringComparer.Ordinal))
            return Failure("human_equivalence_not_available", "The matching semantic Inspection is not advertised for the exact current state.");

        string sessionId = CreateSessionId(
            expectedStateToken,
            expectedRuntime,
            kind);
        ConnectorV3HumanEquivalencePageResult opened = _environment.Open(kind, current);
        if (opened.Page == null)
        {
            if (!_environment.HasOwnedPage)
            {
                return Failure(
                    opened.ErrorCode ?? "human_equivalence_open_failed",
                    opened.Detail ?? "The native page failed closed before an evidence session was created.");
            }

            _session = new Session(
                sessionId,
                kind,
                expectedStateToken,
                expectedRuntime,
                current,
                current,
                null,
                null,
                "recovery_required",
                opened.ErrorCode ?? "native_page_recovery_required",
                opened.Detail ?? "The exact native page may still own input and must be returned before commands resume.");
            return Success(_session);
        }

        ConnectorV3HumanEquivalenceRuntimeSnapshot afterOpen;
        try
        {
            afterOpen = _environment.Capture();
        }
        catch (Exception exception)
        {
            ConnectorV3HumanEquivalencePageResult recovery =
                _environment.Return(kind);
            _session = new Session(
                sessionId,
                kind,
                expectedStateToken,
                expectedRuntime,
                current,
                current,
                null,
                opened.Page,
                "recovery_required",
                recovery.ErrorCode ?? "human_equivalence_open_verification_failed",
                $"Post-open runtime verification failed closed with {exception.GetType().Name}; the exact page return was requested and restoration still requires verification.");
            return Success(_session);
        }
        _session = new Session(
            sessionId,
            kind,
            expectedStateToken,
            expectedRuntime,
            current,
            afterOpen,
            null,
            opened.Page,
            "open",
            null,
            null);
        return Success(_session);
    }

    public ConnectorV3HumanEquivalenceOperationResult Read(
        string sessionId,
        string expectedRuntimeInstanceId)
    {
        ConnectorV3HumanEquivalenceOperationResult? validation =
            ValidateSession(sessionId, expectedRuntimeInstanceId);
        if (validation != null)
            return validation;

        Session session = _session!;
        ConnectorV3HumanEquivalenceRuntimeSnapshot current = _environment.Capture();
        if (IsRestored(session.Pre, current))
        {
            _environment.Reset();
            _session = session with
            {
                Current = current,
                Post = current,
                Page = null,
                Phase = "returned",
                ErrorCode = null,
                Detail = null
            };
            return Success(_session);
        }
        if (session.Phase == "returned")
            return Success(session);

        ConnectorV3HumanEquivalencePageResult read = _environment.Read(session.Kind);
        if (read.Page == null)
        {
            _session = session with
            {
                Current = current,
                Phase = "recovery_required",
                ErrorCode = read.ErrorCode ?? "human_equivalence_read_failed",
                Detail = read.Detail ?? "The exact native page is no longer readable."
            };
            return Success(_session);
        }

        _session = session with
        {
            Current = current,
            Page = read.Page,
            Phase = "open",
            ErrorCode = null,
            Detail = null
        };
        return Success(_session);
    }

    public ConnectorV3HumanEquivalenceOperationResult Return(
        string sessionId,
        ConnectorV3HumanEquivalenceReturnRequest request)
    {
        if (!string.Equals(
                request.Profile,
                ConnectorV3Contract.HumanEquivalenceProfile,
                StringComparison.Ordinal))
        {
            return Failure("human_equivalence_profile_mismatch", "The return request does not name the active evidence profile.");
        }

        ConnectorV3HumanEquivalenceOperationResult? validation =
            ValidateSession(sessionId, request.ExpectedRuntimeInstanceId ?? string.Empty);
        if (validation != null)
            return validation;

        Session session = _session!;
        ConnectorV3HumanEquivalenceRuntimeSnapshot beforeReturn = _environment.Capture();
        if (IsRestored(session.Pre, beforeReturn))
        {
            _environment.Reset();
            _session = session with
            {
                Current = beforeReturn,
                Post = beforeReturn,
                Page = null,
                Phase = "returned",
                ErrorCode = null,
                Detail = null
            };
            return Success(_session);
        }

        ConnectorV3HumanEquivalencePageResult returned = _environment.Return(session.Kind);
        if (returned.ErrorCode != null)
        {
            _session = session with
            {
                Current = beforeReturn,
                Phase = "recovery_required",
                ErrorCode = returned.ErrorCode,
                Detail = returned.Detail
            };
            return Success(_session);
        }

        ConnectorV3HumanEquivalenceRuntimeSnapshot post = _environment.Capture();
        bool restored = IsRestored(session.Pre, post);
        if (restored)
            _environment.Reset();
        _session = session with
        {
            Current = post,
            Post = restored ? post : null,
            Page = restored ? null : session.Page,
            Phase = restored ? "returned" : "recovery_required",
            ErrorCode = restored ? null : "pre_owner_not_restored",
            Detail = restored
                ? null
                : "The native return was requested, but the exact pre-page owner and state have not yet been restored. Poll or retry return; never submit a game command from this session."
        };
        return Success(_session);
    }

    public BridgeObservationDraft SuppressMutation(BridgeObservationDraft draft)
    {
        if (!ReservesInputOwner)
            return draft;
        string sessionId = _session!.Id;
        return draft with
        {
            Signature = BridgeHash.Object(new
            {
                draft.Signature,
                humanEquivalenceSession = sessionId
            }),
            Readiness = "settling",
            Surface = new NoActionSurface(
                "no_action",
                "human_equivalence_evidence_active",
                "An operator-owned native-page evidence session temporarily owns input; no game command is authorized."),
            Completeness = new StateCompleteness(
                draft.Completeness.PlayerVisibleSemantics,
                "empty_fail_closed",
                draft.Completeness.Sources
                    .Concat(new[] { "connector_v3_human_equivalence_input_reservation" })
                    .Distinct(StringComparer.Ordinal)
                    .ToArray(),
                draft.Completeness.Missing
                    .Concat(new[] { "mutation_suppressed_during_human_equivalence_evidence" })
                    .Distinct(StringComparer.Ordinal)
                    .ToArray()),
            Actions = [],
            Warnings = draft.Warnings
                .Concat(new[] { $"human_equivalence_session_active:{sessionId}" })
                .ToArray()
        };
    }

    internal static string InspectionKind(string kind) => kind switch
    {
        RunDeckKind => BridgeInspectionBuilder.RunDeckKind,
        CombatDrawPileKind or CombatDiscardPileKind or CombatExhaustPileKind =>
            BridgeInspectionBuilder.CombatPilesKind,
        ShopCatalogKind => BridgeInspectionBuilder.ShopCatalogKind,
        _ => string.Empty
    };

    private ConnectorV3HumanEquivalenceOperationResult? ValidateSession(
        string sessionId,
        string expectedRuntimeInstanceId)
    {
        if (_session == null
            || !string.Equals(_session.Id, sessionId, StringComparison.Ordinal))
        {
            return Failure("human_equivalence_session_not_found", "No matching native-page evidence session exists in this runtime.");
        }
        ConnectorV3HumanEquivalenceRuntimeSnapshot current = _environment.Capture();
        if (!string.Equals(
                _session.ExpectedRuntimeInstanceId,
                expectedRuntimeInstanceId,
                StringComparison.Ordinal)
            || !string.Equals(
                current.RuntimeInstanceId,
                expectedRuntimeInstanceId,
                StringComparison.Ordinal))
        {
            return Failure("runtime_instance_changed", "The evidence session is not bound to the currently loaded Gateway runtime.");
        }
        return null;
    }

    private static bool IsRestored(
        ConnectorV3HumanEquivalenceRuntimeSnapshot pre,
        ConnectorV3HumanEquivalenceRuntimeSnapshot current) =>
        string.Equals(pre.RuntimeInstanceId, current.RuntimeInstanceId, StringComparison.Ordinal)
        && string.Equals(pre.StateToken, current.StateToken, StringComparison.Ordinal)
        && pre.Owner == current.Owner;

    private static string CreateSessionId(
        string expectedStateToken,
        string expectedRuntime,
        string kind) =>
        "human_" + BridgeHash.Object(new
        {
            expectedStateToken,
            expectedRuntime,
            kind,
            nonce = Guid.NewGuid().ToString("N")
        })[..20];

    private static ConnectorV3HumanEquivalenceOperationResult Failure(
        string code,
        string detail) => new(null, code, detail);

    private static ConnectorV3HumanEquivalenceOperationResult Success(Session session) =>
        new(new ConnectorV3HumanEquivalenceResponse(
            ConnectorV3Contract.ProtocolVersion,
            ConnectorV3Contract.HumanEquivalenceSchema,
            session.Id,
            ConnectorV3Contract.HumanEquivalenceProfile,
            session.Kind,
            session.Phase,
            session.ExpectedStateToken,
            session.Pre.StateToken,
            session.Current.StateToken,
            session.Post?.StateToken,
            session.ExpectedRuntimeInstanceId,
            session.Current.RuntimeInstanceId,
            session.Pre.Owner,
            session.Current.Owner,
            session.Post?.Owner,
            session.Page,
            session.Current.Bridge,
            session.Current.Game,
            CreatesActionAuthority: false,
            EntersCommandLedger: false,
            session.ErrorCode,
            session.Detail), null, null);
}

internal sealed class ConnectorV3NativePageEnvironment :
    IConnectorV3HumanEquivalenceEnvironment
{
    private readonly Func<ConnectorV3Snapshot> _capture;
    private readonly BridgeEntityRegistry _entities;
    private object? _activePage;
    private IBridgeContext? _preContext;

    public ConnectorV3NativePageEnvironment(
        Func<ConnectorV3Snapshot> capture,
        BridgeEntityRegistry entities)
    {
        _capture = capture;
        _entities = entities;
    }

    public bool HasOwnedPage => _activePage != null;

    public ConnectorV3HumanEquivalenceRuntimeSnapshot Capture()
    {
        ConnectorV3Snapshot snapshot = _capture();
        return new ConnectorV3HumanEquivalenceRuntimeSnapshot(
            snapshot.Observation.StateToken,
            snapshot.Observation.Bridge.RuntimeInstanceId,
            new ConnectorV3HumanEquivalenceOwner(
                snapshot.Draft.Context.Kind,
                snapshot.Draft.Surface.Kind,
                NativeOwner(snapshot.Draft)),
            snapshot.Observation.Bridge,
            snapshot.Observation.Game,
            snapshot.Observation.InspectionCatalog
                .Select(entry => entry.Kind)
                .ToArray());
    }

    public ConnectorV3HumanEquivalencePageResult Open(
        string kind,
        ConnectorV3HumanEquivalenceRuntimeSnapshot pre)
    {
        if (_activePage != null)
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_already_owned",
                "The evidence environment already owns a native page.");

        ConnectorV3Snapshot snapshot = _capture();
        _preContext = snapshot.Draft.Context;
        try
        {
            ConnectorV3HumanEquivalencePageResult result = kind switch
            {
                ConnectorV3HumanEquivalenceSessionMachine.RunDeckKind =>
                    OpenRunDeck(),
                ConnectorV3HumanEquivalenceSessionMachine.CombatDrawPileKind =>
                    OpenCombatPile(PileType.Draw),
                ConnectorV3HumanEquivalenceSessionMachine.CombatDiscardPileKind =>
                    OpenCombatPile(PileType.Discard),
                ConnectorV3HumanEquivalenceSessionMachine.CombatExhaustPileKind =>
                    OpenCombatPile(PileType.Exhaust),
                ConnectorV3HumanEquivalenceSessionMachine.ShopCatalogKind =>
                    OpenShopCatalog(),
                _ => ConnectorV3HumanEquivalencePageResult.Failure(
                    "human_equivalence_kind_not_supported",
                    "The requested native page kind is not implemented.")
            };
            if (result.Page == null)
            {
                if (_activePage == null)
                {
                    Reset();
                }
                else if (!TryRecoverOwnedPage())
                {
                    return ConnectorV3HumanEquivalencePageResult.Failure(
                        "native_page_recovery_required",
                        $"{result.Detail ?? "Native page opening failed."} The exact page still owns input and must be returned before commands resume.");
                }
            }
            return result;
        }
        catch (Exception exception)
        {
            bool recovered = TryRecoverOwnedPage();
            return ConnectorV3HumanEquivalencePageResult.Failure(
                recovered || _activePage == null
                    ? "native_page_open_failed"
                    : "native_page_recovery_required",
                recovered || _activePage == null
                    ? $"Native page opening failed closed with {exception.GetType().Name}."
                    : $"Native page opening failed with {exception.GetType().Name}; the exact page still owns input and must be returned before commands resume.");
        }
    }

    public ConnectorV3HumanEquivalencePageResult Read(string kind)
    {
        if (_activePage == null || _preContext == null)
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_not_owned",
                "This runtime no longer owns the exact native page.");
        try
        {
            if (!IsExactCurrentPage(kind))
                return ConnectorV3HumanEquivalencePageResult.Failure(
                    "native_page_owner_changed",
                    "The exact native page is no longer the current input owner.");
            return BuildPageRead(kind);
        }
        catch (Exception exception)
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_read_failed",
                $"Native page reading failed closed with {exception.GetType().Name}.");
        }
    }

    public ConnectorV3HumanEquivalencePageResult Return(string kind)
    {
        if (_activePage == null)
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_not_owned",
                "This runtime does not own a native page to return from.");
        try
        {
            if (!IsExactCurrentPage(kind))
                return ConnectorV3HumanEquivalencePageResult.Failure(
                    "native_page_owner_changed",
                    "Return was refused because another native owner is current.");

            if (_activePage is NDeckViewScreen or NCardPileScreen)
            {
                NCapstoneContainer.Instance?.Close();
            }
            else if (_activePage is NMerchantInventory inventory)
            {
                NBackButton back = inventory.GetNode<NBackButton>("%BackButton");
                if (!back.IsEnabled || !McpMod.IsNodeVisible(back))
                {
                    return ConnectorV3HumanEquivalencePageResult.Failure(
                        "native_return_control_unavailable",
                        "The exact merchant Back control is no longer current and enabled.");
                }
                back.ForceClick();
            }
            else
            {
                return ConnectorV3HumanEquivalencePageResult.Failure(
                    "native_page_type_changed",
                    "The owned native page type is no longer recognized.");
            }

            return new ConnectorV3HumanEquivalencePageResult(null, null, null);
        }
        catch (Exception exception)
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_return_failed",
                $"Native page return failed closed with {exception.GetType().Name}.");
        }
    }

    public void Reset()
    {
        _activePage = null;
        _preContext = null;
    }

    private ConnectorV3HumanEquivalencePageResult OpenRunDeck()
    {
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        Player? player = runState == null ? null : LocalContext.GetMe(runState);
        NCapstoneContainer? capstone = NCapstoneContainer.Instance;
        NTopBarDeckButton? deckButton = NRun.Instance?.GlobalUi.TopBar.Deck;
        if (player == null
            || capstone == null
            || capstone.InUse
            || deckButton == null
            || !deckButton.IsEnabled
            || !McpMod.IsNodeVisible(deckButton))
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_not_openable",
                "The exact player Deck control is not currently openable.");
        }

        deckButton.ForceClick();
        if (capstone.CurrentCapstoneScreen is not NDeckViewScreen screen)
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_owner_not_established",
                "The native Deck page did not become the exact current owner.");
        }
        _activePage = screen;
        if (!ActiveScreenContext.Instance.IsCurrent(screen))
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_owner_not_established",
                "The native Deck page did not become the exact current owner.");
        }
        return BuildPageRead(ConnectorV3HumanEquivalenceSessionMachine.RunDeckKind);
    }

    private ConnectorV3HumanEquivalencePageResult OpenCombatPile(PileType pileType)
    {
        NCombatRoom? room = NCombatRoom.Instance;
        RunState? runState = RunManager.Instance.DebugOnlyGetState();
        Player? player = runState == null ? null : LocalContext.GetMe(runState);
        PlayerCombatState? combat = player?.PlayerCombatState;
        NCapstoneContainer? capstone = NCapstoneContainer.Instance;
        NCombatCardPile? button = pileType switch
        {
            PileType.Draw => room?.Ui.DrawPile,
            PileType.Discard => room?.Ui.DiscardPile,
            PileType.Exhaust => room?.Ui.ExhaustPile,
            _ => null
        };
        CardPile? pile = pileType switch
        {
            PileType.Draw => combat?.DrawPile,
            PileType.Discard => combat?.DiscardPile,
            PileType.Exhaust => combat?.ExhaustPile,
            _ => null
        };
        if (!CombatManager.Instance.IsInProgress
            || button == null
            || pile == null
            || pile.IsEmpty
            || capstone == null
            || capstone.InUse
            || !button.IsEnabled
            || !McpMod.IsNodeVisible(button))
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_not_openable",
                "The exact non-empty combat pile control is not currently openable.");
        }

        button.ForceClick();
        if (capstone.CurrentCapstoneScreen is not NCardPileScreen screen)
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_owner_not_established",
                "The native combat-pile page did not become the exact current owner.");
        }
        _activePage = screen;
        if (!ReferenceEquals(screen.Pile, pile)
            || !ActiveScreenContext.Instance.IsCurrent(screen))
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_owner_not_established",
                "The native combat-pile page did not become the exact current owner.");
        }
        return BuildPageRead(pileType switch
        {
            PileType.Draw => ConnectorV3HumanEquivalenceSessionMachine.CombatDrawPileKind,
            PileType.Discard => ConnectorV3HumanEquivalenceSessionMachine.CombatDiscardPileKind,
            _ => ConnectorV3HumanEquivalenceSessionMachine.CombatExhaustPileKind
        });
    }

    private ConnectorV3HumanEquivalencePageResult OpenShopCatalog()
    {
        if (!ShopSurfaceFacts.TryGetCurrent(
                out MerchantRoom? merchantRoom,
                out NMerchantRoom? room,
                out MerchantInventory? inventory)
            || merchantRoom == null
            || room == null
            || inventory == null
            || !ShopSurfaceFacts.IsCurrentRoom(merchantRoom, room, inventory)
            || room.Inventory.IsOpen
            || !room.MerchantButton.IsEnabled
            || !McpMod.IsNodeVisible(room.MerchantButton))
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_not_openable",
                "The exact merchant inventory control is not currently openable.");
        }

        room.MerchantButton.ForceClick();
        if (room.Inventory.IsOpen)
            _activePage = room.Inventory;
        if (!ShopSurfaceFacts.IsCurrentInventory(merchantRoom, room, inventory))
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                "native_page_owner_not_established",
                "The merchant inventory did not become the exact current owner.");
        }
        _activePage = room.Inventory;
        return BuildPageRead(ConnectorV3HumanEquivalenceSessionMachine.ShopCatalogKind);
    }

    private ConnectorV3HumanEquivalencePageResult BuildPageRead(string kind)
    {
        string inspectionKind =
            ConnectorV3HumanEquivalenceSessionMachine.InspectionKind(kind);
        BridgeInspectionBuildResult built = BridgeInspectionBuilder.Build(
            inspectionKind,
            _preContext!,
            _entities);
        if (built.Draft == null)
        {
            return ConnectorV3HumanEquivalencePageResult.Failure(
                built.ErrorCode ?? "native_page_semantic_read_failed",
                built.Detail ?? "The matching semantic Inspection could not be rebuilt while the native page was open.");
        }

        string[] visibleEntities = _activePage switch
        {
            NDeckViewScreen deck => VisibleGridCards(deck),
            NCardPileScreen pile => VisibleGridCards(pile),
            NMerchantInventory inventory => inventory.GetAllSlots()
                .Where(McpMod.IsNodeVisible)
                .Select(slot => _entities.GetId(slot, "shop_slot"))
                .OrderBy(value => value, StringComparer.Ordinal)
                .ToArray(),
            _ => Array.Empty<string>()
        };
        BridgeInspectionDraft draft = built.Draft;
        return ConnectorV3HumanEquivalencePageResult.Success(
            new ConnectorV3HumanEquivalencePageRead(
                _activePage!.GetType().FullName ?? _activePage.GetType().Name,
                inspectionKind,
                visibleEntities.Length,
                visibleEntities,
                draft.Content,
                draft.Completeness,
                new[]
                {
                    "exact native player control ForceClick",
                    "ActiveScreenContext exact owner verification",
                    "current native page visible holder/slot projection",
                    "matching state-bound semantic Inspection rebuilt while page is open"
                }));
    }

    private string[] VisibleGridCards(NDeckViewScreen screen) =>
        screen.GetNode<NCardGrid>("CardGrid")
            .CurrentlyDisplayedCards
            .Select(card => _entities.GetId(card, "card"))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(value => value, StringComparer.Ordinal)
            .ToArray();

    private string[] VisibleGridCards(NCardPileScreen screen) =>
        screen.GetNode<NCardGrid>("CardGrid")
            .CurrentlyDisplayedCards
            .Select(card => _entities.GetId(card, "card"))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(value => value, StringComparer.Ordinal)
            .ToArray();

    private bool IsExactCurrentPage(string kind)
    {
        if (_activePage is NDeckViewScreen deck)
        {
            return kind == ConnectorV3HumanEquivalenceSessionMachine.RunDeckKind
                   && ReferenceEquals(NCapstoneContainer.Instance?.CurrentCapstoneScreen, deck)
                   && ActiveScreenContext.Instance.IsCurrent(deck);
        }
        if (_activePage is NCardPileScreen pile)
        {
            PileType expected = kind switch
            {
                ConnectorV3HumanEquivalenceSessionMachine.CombatDrawPileKind => PileType.Draw,
                ConnectorV3HumanEquivalenceSessionMachine.CombatDiscardPileKind => PileType.Discard,
                ConnectorV3HumanEquivalenceSessionMachine.CombatExhaustPileKind => PileType.Exhaust,
                _ => PileType.None
            };
            return pile.Pile.Type == expected
                   && ReferenceEquals(NCapstoneContainer.Instance?.CurrentCapstoneScreen, pile)
                   && ActiveScreenContext.Instance.IsCurrent(pile);
        }
        if (_activePage is NMerchantInventory inventory)
        {
            return kind == ConnectorV3HumanEquivalenceSessionMachine.ShopCatalogKind
                   && ShopSurfaceFacts.TryGetCurrent(
                       out MerchantRoom? merchantRoom,
                       out NMerchantRoom? room,
                       out MerchantInventory? model)
                   && merchantRoom != null
                   && room != null
                   && model != null
                   && ReferenceEquals(room.Inventory, inventory)
                   && ShopSurfaceFacts.IsCurrentInventory(merchantRoom, room, model);
        }
        return false;
    }

    private string NativeOwner(BridgeObservationDraft draft)
    {
        ICapstoneScreen? capstone = NCapstoneContainer.Instance?.CurrentCapstoneScreen;
        if (capstone != null)
            return $"capstone:{capstone.GetType().FullName}:{_entities.GetId(capstone, "native_page")}";
        if (ShopSurfaceFacts.TryGetCurrent(
                out MerchantRoom? merchantRoom,
                out NMerchantRoom? room,
                out MerchantInventory? inventory)
            && merchantRoom != null
            && room != null
            && inventory != null
            && ShopSurfaceFacts.IsCurrentInventory(merchantRoom, room, inventory))
        {
            return $"shop_inventory:{_entities.GetId(room.Inventory, "native_page")}";
        }
        return $"semantic:{draft.Context.Kind}:{draft.Surface.Kind}";
    }

    private bool TryRecoverOwnedPage()
    {
        if (_activePage == null)
        {
            Reset();
            return true;
        }

        try
        {
            if (_activePage is NDeckViewScreen or NCardPileScreen
                && ReferenceEquals(
                    NCapstoneContainer.Instance?.CurrentCapstoneScreen,
                    _activePage))
            {
                NCapstoneContainer.Instance?.Close();
            }
            else if (_activePage is NMerchantInventory inventory
                     && inventory.IsOpen)
            {
                NBackButton back = inventory.GetNode<NBackButton>("%BackButton");
                if (back.IsEnabled && McpMod.IsNodeVisible(back))
                    back.ForceClick();
            }

            bool restored = _activePage switch
            {
                NDeckViewScreen or NCardPileScreen =>
                    !ReferenceEquals(
                        NCapstoneContainer.Instance?.CurrentCapstoneScreen,
                        _activePage),
                NMerchantInventory inventory => !inventory.IsOpen,
                _ => false
            };
            if (restored)
            {
                Reset();
                return true;
            }
        }
        catch
        {
            // Recovery never closes an owner that is not the exact page opened here.
        }
        return false;
    }
}

internal static partial class ConnectorV3Runtime
{
    public static void ConfigureHumanEquivalence(bool enabled) =>
        HumanEquivalence.Configure(enabled);

    public static ConnectorV3HumanEquivalenceOperationResult OpenHumanEquivalence(
        ConnectorV3HumanEquivalenceOpenRequest request) =>
        HumanEquivalence.Open(request);

    public static ConnectorV3HumanEquivalenceOperationResult ReadHumanEquivalence(
        string sessionId,
        string expectedRuntimeInstanceId) =>
        HumanEquivalence.Read(sessionId, expectedRuntimeInstanceId);

    public static ConnectorV3HumanEquivalenceOperationResult ReturnHumanEquivalence(
        string sessionId,
        ConnectorV3HumanEquivalenceReturnRequest request) =>
        HumanEquivalence.Return(sessionId, request);
}

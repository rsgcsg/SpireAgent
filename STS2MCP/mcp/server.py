"""Thin MCP adapter for the STS2 Agent Bridge v2.

The adapter exposes only state-bound Bridge v2 reads and opaque commands. It
does not reconstruct game legality, synthesize index actions, or expose the
retired v1 HTTP API.
"""

import argparse

import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("sts2")

_base_url: str = "http://localhost:15526"
_trust_env: bool = True
_http: httpx.AsyncClient | None = None


def _v2_url(path: str) -> str:
    return f"{_base_url}/api/v2/{path.lstrip('/')}"


def _get_client() -> httpx.AsyncClient:
    global _http
    if _http is None:
        _http = httpx.AsyncClient(
            timeout=httpx.Timeout(10),
            trust_env=_trust_env,
        )
    return _http


async def _v2_get(path: str) -> str:
    response = await _get_client().get(_v2_url(path))
    response.raise_for_status()
    return response.text


async def _v2_protocol_request(
    method: str,
    path: str,
    body: dict | None = None,
) -> str:
    response = await _get_client().request(
        method,
        _v2_url(path),
        json=body,
    )
    # Rejected, stale, unavailable, and unknown outcomes are protocol results,
    # not transport failures. Preserve their structured response bodies.
    return response.text


async def _v2_inspection_request(
    kind: str,
    expected_state_id: str,
) -> str:
    response = await _get_client().get(
        _v2_url(f"inspections/{kind}"),
        params={"expected_state_id": expected_state_id},
    )
    return response.text


async def _v2_observation_bundle_request(
    expected_state_id: str,
    inspection_kinds: list[str],
) -> str:
    response = await _get_client().post(
        _v2_url("observation-bundles"),
        json={
            "expected_state_id": expected_state_id,
            "inspections": [{"kind": kind} for kind in inspection_kinds],
        },
    )
    return response.text


def _handle_error(error: Exception) -> str:
    if isinstance(error, httpx.ConnectError):
        return (
            "Error: Cannot connect to the STS2 Gateway. "
            "Is the game running with the mod enabled?"
        )
    if isinstance(error, httpx.HTTPStatusError):
        return f"Error: HTTP {error.response.status_code} - {error.response.text}"
    return f"Error: {error}"


@mcp.tool()
async def get_agent_bridge_capabilities_v2() -> str:
    """Read exact Gateway/game/Modset identity and Bridge v2 capabilities."""
    try:
        return await _v2_get("capabilities")
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def get_agent_state_v2() -> str:
    """Read player-visible state and opaque actions for the exact current state.

    Unsupported or actionless state is a fail-closed result. Never synthesize
    an action from an entity index or a legacy state shape.
    """
    try:
        return await _v2_get("state")
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def inspect_run_deck_v2(expected_state_id: str) -> str:
    """Read the visible run deck without creating action authority."""
    try:
        return await _v2_inspection_request("run_deck", expected_state_id)
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def inspect_combat_piles_v2(expected_state_id: str) -> str:
    """Read visible combat piles without draw order or action authority."""
    try:
        return await _v2_inspection_request("combat_piles", expected_state_id)
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def inspect_shop_catalog_v2(expected_state_id: str) -> str:
    """Read the visible current-shop catalog without purchase authority."""
    try:
        return await _v2_inspection_request("shop_catalog", expected_state_id)
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def get_agent_observation_bundle_v2(
    expected_state_id: str,
    include_run_deck: bool = False,
    include_combat_piles: bool = False,
    include_shop_catalog: bool = False,
) -> str:
    """Read one coherent state plus selected state-bound Inspections."""
    inspection_kinds = []
    if include_run_deck:
        inspection_kinds.append("run_deck")
    if include_combat_piles:
        inspection_kinds.append("combat_piles")
    if include_shop_catalog:
        inspection_kinds.append("shop_catalog")
    try:
        return await _v2_observation_bundle_request(
            expected_state_id,
            inspection_kinds,
        )
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def submit_agent_action_v2(
    request_id: str,
    expected_state_id: str,
    action_id: str,
) -> str:
    """Submit one opaque action advertised by the exact current state.

    Reuse request_id only when polling or resending the exact same request.
    A started response is not completion.
    """
    try:
        return await _v2_protocol_request(
            "POST",
            "commands",
            {
                "request_id": request_id,
                "expected_state_id": expected_state_id,
                "action_id": action_id,
            },
        )
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def get_agent_command_v2(request_id: str) -> str:
    """Poll a submitted command.

    A timed-out command has unknown outcome and must not be retried.
    """
    try:
        return await _v2_protocol_request("GET", f"commands/{request_id}")
    except Exception as error:
        return _handle_error(error)


def main() -> None:
    parser = argparse.ArgumentParser(description="STS2 Bridge v2 MCP adapter")
    parser.add_argument(
        "--port",
        type=int,
        default=15526,
        help="Gateway HTTP port",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="localhost",
        help="Gateway HTTP host",
    )
    parser.add_argument(
        "--no-trust-env",
        action="store_true",
        help="Ignore HTTP_PROXY and HTTPS_PROXY",
    )
    args = parser.parse_args()

    global _base_url, _trust_env
    _base_url = f"http://{args.host}:{args.port}"
    _trust_env = not args.no_trust_env
    _get_client()
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()

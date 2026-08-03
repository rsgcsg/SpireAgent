"""Thin MCP adapter for the STS2 Semantic Connector v3.

The adapter exposes state-bound V3 observations and parameterized commands. It
does not reconstruct game legality, synthesize index actions, or expose the
retired v1 or V2 action APIs.
"""

import argparse
import asyncio
from datetime import datetime
import json
import time
from typing import Literal
from urllib.parse import quote
import uuid

import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("sts2")

_base_url: str = "http://localhost:15526"
_trust_env: bool = True
_http: httpx.AsyncClient | None = None
_control_lock: asyncio.Lock | None = None
_control: dict | None = None
_V3_PROTOCOL = "3.0-preview.11"
_V3_CONTROL_SCHEMA = "sts2.connector.v3/control-1"


def _v3_url(path: str) -> str:
    return f"{_base_url}/api/v3/{path.lstrip('/')}"


def _get_client() -> httpx.AsyncClient:
    global _http
    if _http is None:
        _http = httpx.AsyncClient(
            timeout=httpx.Timeout(10),
            trust_env=_trust_env,
        )
    return _http


async def _v3_get(path: str) -> str:
    response = await _get_client().get(_v3_url(path))
    response.raise_for_status()
    return response.text


async def _v3_protocol_request(
    method: str,
    path: str,
    body: dict | None = None,
) -> str:
    response = await _get_client().request(
        method,
        _v3_url(path),
        json=body,
    )
    # Rejected, stale, unavailable, and unknown outcomes are protocol results,
    # not transport failures. Preserve their structured response bodies.
    return response.text


def _get_control_lock() -> asyncio.Lock:
    global _control_lock
    if _control_lock is None:
        _control_lock = asyncio.Lock()
    return _control_lock


def _expiry_monotonic(expires_at: str) -> float:
    expires = datetime.fromisoformat(expires_at.replace("Z", "+00:00")).timestamp()
    return time.monotonic() + max(0.0, expires - time.time())


async def _control_request(path: str, body: dict) -> dict:
    response = await _get_client().post(_v3_url(path), json=body)
    try:
        payload = response.json()
    except ValueError as error:
        raise RuntimeError(f"Gateway control endpoint returned invalid JSON: {error}") from error
    if not response.is_success:
        status = payload.get("status") if isinstance(payload, dict) else None
        detail = payload.get("detail") if isinstance(payload, dict) else None
        raise RuntimeError(
            f"Gateway control request {path} rejected: {status or response.status_code} {detail or ''}".strip()
        )
    if not isinstance(payload, dict):
        raise RuntimeError("Gateway control response must be a JSON object")
    if payload.get("protocol_version") != _V3_PROTOCOL:
        raise RuntimeError("Gateway control response protocol does not match this MCP adapter")
    if payload.get("schema") != _V3_CONTROL_SCHEMA:
        raise RuntimeError("Gateway control response schema does not match this MCP adapter")
    return payload


async def _ensure_controller() -> dict:
    global _control
    async with _get_control_lock():
        if _control is None:
            client_instance_id = f"mcp-adapter-{uuid.uuid4()}"
            registration = await _control_request(
                "clients/register",
                {
                    "client_instance_id": client_instance_id,
                    "product_id": "sts2mcp-python-adapter",
                    "product_name": "STS2MCP Python Adapter",
                    "product_version": "0.5.0-dev",
                },
            )
            _control = {
                "client_instance_id": client_instance_id,
                "client_session_id": registration["client"]["client_session_id"],
                "runtime_instance_id": registration["runtime_instance_id"],
            }

        lease = _control.get("lease")
        if lease is not None and lease["expires_monotonic"] - time.monotonic() > 10:
            return _control

        if lease is not None:
            try:
                renewed = await _control_request(
                    "controller/renew",
                    {
                        "client_session_id": _control["client_session_id"],
                        "controller_lease_id": lease["controller_lease_id"],
                        "controller_generation": lease["controller_generation"],
                    },
                )
                controller = renewed["controller"]
                _control["lease"] = {
                    **controller,
                    "expires_monotonic": _expiry_monotonic(controller["expires_at"]),
                }
                return _control
            except RuntimeError:
                _control.pop("lease", None)

        acquired = await _control_request(
            "controller/acquire",
            {"client_session_id": _control["client_session_id"]},
        )
        controller = acquired["controller"]
        _control["lease"] = {
            **controller,
            "expires_monotonic": _expiry_monotonic(controller["expires_at"]),
        }
        return _control


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
async def get_sts2_connector_capabilities_v3() -> str:
    """Read exact Gateway/game/Modset identity and Connector V3 capabilities."""
    try:
        return await _v3_get("capabilities")
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def get_sts2_observation_v3() -> str:
    """Read player-visible state and the exact current parameterized interaction.

    A visible-but-unsupported interaction remains visible without command
    authority. Never synthesize an operand or command not present here.
    """
    try:
        return await _v3_get("observation")
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def inspect_sts2_visible_state_v3(
    kind: Literal["run_deck", "combat_piles", "shop_catalog"],
    expected_state_token: str,
) -> str:
    """Read one advertised player-visible detail without granting action authority.

    The kind must appear in the current observation inspection_catalog. The
    expected_state_token binds the read to that exact observation; on drift,
    request a fresh observation instead of reusing this call.
    """
    try:
        encoded_kind = quote(kind, safe="")
        encoded_token = quote(expected_state_token, safe="")
        return await _v3_get(
            f"inspections/{encoded_kind}?expected_state_token={encoded_token}"
        )
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def get_sts2_surface_card_detail_v3(
    entity_id: str,
    expected_state_token: str,
) -> str:
    """Read one card from the current state-bound linked-detail catalog.

    The entity must be advertised as a surface_card by the same observation.
    This read is non-authorizing and never accepts arbitrary fields or methods.
    """
    try:
        encoded_entity = quote(entity_id, safe="")
        encoded_token = quote(expected_state_token, safe="")
        return await _v3_get(
            f"linked-details/{encoded_entity}?expected_state_token={encoded_token}"
        )
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def submit_sts2_command_v3(
    request_id: str,
    expected_state_token: str,
    interaction_id: str,
    command: str,
    operands_json: str = "{}",
) -> str:
    """Submit one parameterized command from the exact current interaction.

    operands_json must contain only the exact entity/control identities offered
    by the observation. A pending receipt is not completion.
    """
    try:
        operands = json.loads(operands_json)
        if not isinstance(operands, dict) or any(
            not isinstance(key, str) or not isinstance(value, str)
            for key, value in operands.items()
        ):
            raise ValueError("operands_json must be an object of string values")
        control = await _ensure_controller()
        lease = control["lease"]
        return await _v3_protocol_request(
            "POST",
            "commands",
            {
                "request_id": request_id,
                "expected_state_token": expected_state_token,
                "interaction_id": interaction_id,
                "command": command,
                "operands": operands,
                "client_session_id": control["client_session_id"],
                "controller_lease_id": lease["controller_lease_id"],
                "controller_generation": lease["controller_generation"],
                "consumer": {
                    "profile": "mcp_tool_consumer_v1",
                    "agent_id": "sts2mcp-python-adapter",
                    "agent_version": "0.6.0-dev",
                },
            },
        )
    except Exception as error:
        return _handle_error(error)


@mcp.tool()
async def get_sts2_command_receipt_v3(request_id: str) -> str:
    """Poll a submitted command.

    A timed-out command has unknown outcome and must not be retried.
    """
    try:
        return await _v3_protocol_request("GET", f"commands/{request_id}")
    except Exception as error:
        return _handle_error(error)


def main() -> None:
    parser = argparse.ArgumentParser(description="STS2 Connector v3 MCP adapter")
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

import asyncio
import logging
from typing import Any, Dict, List

from fastapi import WebSocket


logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # { home_id: [WebSocket, WebSocket, ...] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

        # FastAPI main event loop
        self.main_loop: asyncio.AbstractEventLoop | None = None

    # ========================================================
    # EVENT LOOP
    # ========================================================

    def set_event_loop(
        self,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        """
        Store the FastAPI main event loop.

        MQTT callbacks and synchronous backend services may run
        outside the main async event loop.
        """
        self.main_loop = loop

    # ========================================================
    # CONNECT
    # ========================================================

    async def connect(
        self,
        websocket: WebSocket,
        home_id: str,
    ) -> None:
        """
        Register a WebSocket connection for a home.
        """

        await websocket.accept()

        if home_id not in self.active_connections:
            self.active_connections[home_id] = []

        self.active_connections[home_id].append(websocket)

        logger.info(
            "[WS CONNECTED] Home ID: %s | Total clients: %s",
            home_id,
            len(self.active_connections[home_id]),
        )

    # ========================================================
    # DISCONNECT
    # ========================================================

    def disconnect(
        self,
        websocket: WebSocket,
        home_id: str,
    ) -> None:
        """
        Remove a WebSocket connection from a home.
        """

        if home_id not in self.active_connections:
            return

        if websocket in self.active_connections[home_id]:
            self.active_connections[home_id].remove(websocket)

            logger.info(
                "[WS DISCONNECTED] Home ID: %s",
                home_id,
            )

        if not self.active_connections[home_id]:
            del self.active_connections[home_id]

    # ========================================================
    # ASYNC BROADCAST
    # ========================================================

    async def broadcast_to_home(
        self,
        home_id: str,
        message: dict[str, Any],
    ) -> None:
        """
        Send a real-time message to all clients connected
        to the specified home.
        """

        connections = self.active_connections.get(home_id)

        if not connections:
            return

        disconnected: list[WebSocket] = []

        for connection in list(connections):
            try:
                await connection.send_json(message)

            except Exception as exc:
                logger.warning(
                    "[WS ERROR] Failed to send message to home=%s: %s",
                    home_id,
                    exc,
                )

                disconnected.append(connection)

        # Remove dead connections
        for connection in disconnected:
            self.disconnect(
                connection,
                home_id,
            )

    # ========================================================
    # THREAD-SAFE BROADCAST
    # ========================================================

    def broadcast_from_sync(
        self,
        home_id: str | None,
        message: dict[str, Any],
    ) -> None:
        """
        Thread-safe WebSocket broadcast.

        Used by synchronous code such as:
        - MQTT callbacks
        - command services
        - database services
        """

        if not home_id:
            return

        loop = self.main_loop

        if loop is None or not loop.is_running():
            logger.warning(
                "[WS] Main event loop unavailable. "
                "Broadcast skipped for home=%s",
                home_id,
            )
            return

        try:
            asyncio.run_coroutine_threadsafe(
                self.broadcast_to_home(
                    str(home_id),
                    message,
                ),
                loop,
            )

        except Exception:
            logger.exception(
                "[WS] Failed to schedule broadcast for home=%s",
                home_id,
            )


manager = ConnectionManager()
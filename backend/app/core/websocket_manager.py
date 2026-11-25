import logging
from typing import Dict, List

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # { home_id: [WebSocket, WebSocket, ...] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, home_id: str) -> None:
        await websocket.accept()
        home_key = str(home_id)
        if home_key not in self.active_connections:
            self.active_connections[home_key] = []
        self.active_connections[home_key].append(websocket)
        logger.info(
            "[WS CONNECTED] Home ID: %s | Total clients: %s",
            home_key,
            len(self.active_connections[home_key]),
        )

    def disconnect(self, websocket: WebSocket, home_id: str) -> None:
        home_key = str(home_id)
        connections = self.active_connections.get(home_key)
        if not connections:
            return
        if websocket in connections:
            connections.remove(websocket)
            logger.info("[WS DISCONNECTED] Home ID: %s", home_key)
        if not connections:
            del self.active_connections[home_key]

    async def broadcast_to_home(self, home_id: str, message: dict) -> None:
        """নির্দিষ্ট হোমের সব কানেক্টেড ক্লায়েন্টকে রিয়েল-টাইম আপডেট পাঠায়।"""
        home_key = str(home_id)
        connections = list(self.active_connections.get(home_key, []))
        if not connections:
            return

        stale_connections: List[WebSocket] = []
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error("[WS ERROR] Failed to send message to home %s: %s", home_key, e)
                stale_connections.append(connection)

        for stale in stale_connections:
            self.disconnect(stale, home_key)


manager = ConnectionManager()
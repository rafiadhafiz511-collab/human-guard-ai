import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # { home_id: [WebSocket, WebSocket, ...] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, home_id: str):
        await websocket.accept()
        if home_id not in self.active_connections:
            self.active_connections[home_id] = []
        self.active_connections[home_id].append(websocket)
        logger.info(f"[WS CONNECTED] Home ID: {home_id} | Total clients: {len(self.active_connections[home_id])}")

    def disconnect(self, websocket: WebSocket, home_id: str):
        if home_id in self.active_connections:
            if websocket in self.active_connections[home_id]:
                self.active_connections[home_id].remove(websocket)
                logger.info(f"[WS DISCONNECTED] Home ID: {home_id}")
            if not self.active_connections[home_id]:
                del self.active_connections[home_id]

    async def broadcast_to_home(self, home_id: str, message: dict):
        """নির্দিষ্ট হোম-এর সকল অ্যাপ/ওয়েব ক্লায়েন্টকে রিয়েল-টাইম ডাটা পাঠায়"""
        if home_id in self.active_connections:
            for connection in self.active_connections[home_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"[WS ERROR] Failed to send message: {e}")


manager = ConnectionManager()
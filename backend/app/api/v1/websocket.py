import logging
import asyncio
import json
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from app.core.websocket_manager import manager

router = APIRouter()
logger = logging.getLogger(__name__)

# WebSocket heartbeat interval (seconds)
HEARTBEAT_INTERVAL = 30


@router.websocket("/ws/homes/{home_id}")
async def websocket_endpoint(websocket: WebSocket, home_id: str):
    """
    WebSocket endpoint for real-time device updates.
    Includes heartbeat (ping/pong) to maintain connection stability.
    """
    await manager.connect(websocket, home_id)
    heartbeat_task = None
    
    try:
        # Start heartbeat task
        heartbeat_task = asyncio.create_task(
            send_heartbeat(websocket, home_id)
        )
        
        while True:
            try:
                # Receive message from client (keep-alive or data)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=HEARTBEAT_INTERVAL + 10  # Allow some buffer
                )
                
                # Process incoming message
                try:
                    message = json.loads(data)
                    logger.debug(f"[WS RECEIVED] Home: {home_id} | Data: {message}")
                    
                    # Echo back for keep-alive / pong
                    if message.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                        
                except json.JSONDecodeError:
                    logger.warning(f"[WS] Invalid JSON from {home_id}")
                    
            except asyncio.TimeoutError:
                # Client is silent, but we're still connected
                # Heartbeat will keep the connection alive
                continue
                
    except WebSocketDisconnect:
        logger.info(f"[WS DISCONNECTED] Home: {home_id}")
        manager.disconnect(websocket, home_id)
        
    except Exception as e:
        logger.error(f"[WS EXCEPTION] Home: {home_id} | Error: {e}")
        manager.disconnect(websocket, home_id)
        
    finally:
        # Clean up heartbeat task
        if heartbeat_task:
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass
        
        # Ensure disconnection
        try:
            await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
        except Exception:
            pass
        manager.disconnect(websocket, home_id)


async def send_heartbeat(websocket: WebSocket, home_id: str):
    """
    Send periodic heartbeat (ping) to keep WebSocket connection alive.
    """
    while True:
        try:
            await asyncio.sleep(HEARTBEAT_INTERVAL)
            await websocket.send_json({
                "type": "ping",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            logger.debug(f"[WS HEARTBEAT] Sent to home {home_id}")
            
        except Exception as e:
            logger.debug(f"[WS HEARTBEAT FAILED] Home: {home_id} | Error: {e}")
            break


@router.websocket("/ws/devices")
async def websocket_devices_endpoint(websocket: WebSocket):
    """
    Global WebSocket endpoint for all device updates and automation triggers.
    Broadcasts to all connected clients.
    """
    await websocket.accept()
    logger.info("[WS DEVICES] Client connected")
    heartbeat_task = None
    
    try:
        # Start heartbeat task
        heartbeat_task = asyncio.create_task(
            send_global_heartbeat(websocket)
        )
        
        while True:
            try:
                # Receive message from client
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=HEARTBEAT_INTERVAL + 10
                )
                
                try:
                    message = json.loads(data)
                    logger.debug(f"[WS DEVICES RECEIVED] Data: {message}")
                    
                    if message.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                        
                except json.JSONDecodeError:
                    logger.warning("[WS DEVICES] Invalid JSON received")
                    
            except asyncio.TimeoutError:
                continue
                
    except WebSocketDisconnect:
        logger.info("[WS DEVICES] Client disconnected")
        
    except Exception as e:
        logger.error(f"[WS DEVICES EXCEPTION] Error: {e}")
        
    finally:
        if heartbeat_task:
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass
        
        try:
            await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
        except Exception:
            pass


async def send_global_heartbeat(websocket: WebSocket):
    """
    Send periodic heartbeat to the global devices endpoint.
    """
    while True:
        try:
            await asyncio.sleep(HEARTBEAT_INTERVAL)
            await websocket.send_json({
                "type": "ping",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            logger.debug("[WS DEVICES HEARTBEAT] Sent ping")
            
        except Exception as e:
            logger.debug(f"[WS DEVICES HEARTBEAT FAILED] Error: {e}")
            break

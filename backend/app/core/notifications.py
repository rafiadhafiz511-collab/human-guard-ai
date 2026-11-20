from firebase_admin import messaging
import logging

logger = logging.getLogger(__name__)

def send_push_notification(
    fcm_token: str, 
    title: str, 
    body: str, 
    data: dict = None
):
    """
    নির্দিষ্ট ইউজারের মোবাইল ডিভাইসে Firebase Push Notification পাঠায়
    """
    if not fcm_token:
        return

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data={k: str(v) for k, v in (data or {}).items()},
            token=fcm_token,
        )
        response = messaging.send(message)
        logger.info(f"FCM Notification Sent Successfully: {response}")
        return response
    except Exception as e:
        logger.error(f"Failed to send FCM Notification: {str(e)}")
        return None
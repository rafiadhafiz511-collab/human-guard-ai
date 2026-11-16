DEVICE_ID = "CAM001"

API_KEY = "f45f924466f8a46fabbdfc8ff8b1d59b4e09738a67bb63d2fad81d5f690522e4"

SERVER_URL = "http://127.0.0.1:8000"

FIRMWARE_VERSION = "1.0.0"

import requests

def send_heartbeat():
    url = f"{SERVER_URL}/api/v1/devices/heartbeat"

    headers = {
        "X-API-Key": API_KEY,
    }

    data = {
        "firmware_version": FIRMWARE_VERSION,
    }

    response = requests.post(
        url,
        headers=headers,
        json=data,
    )

    result = response.json()

    print("Status:", response.status_code)
    print("Response:", result)

    command = result.get("command")

    if command:
        command_id = command.get("command_id")
        command_name = command.get("command")

        print("Command received!")
        print("Command ID:", command_id)
        print("Command:", command_name)

        if command_name == "PUMP_ON":
            print(">>> SIMULATED RELAY: ON")

        elif command_name == "PUMP_OFF":
            print(">>> SIMULATED RELAY: OFF")

        else:
            print(">>> Unknown command:", command_name)

        ack_url = (
            f"{SERVER_URL}/api/v1/devices/"
            f"{DEVICE_ID}/command/{command_id}/ack"
        )

        ack_data = {
            "status": "completed",
        }

        ack_response = requests.post(
            ack_url,
            headers=headers,
            json=ack_data,
        )

        print("ACK Status:", ack_response.status_code)
        print("ACK Response:", ack_response.json())

if __name__ == "__main__":
    send_heartbeat()
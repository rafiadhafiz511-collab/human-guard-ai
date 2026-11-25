import api from "./client";

export interface ValidateClaimTokenResponse {
  valid: boolean;
  device_id: string;
  device_name?: string | null;
  device_type?: string | null;
  claim_status?: string | null;
  lifecycle_status?: string | null;
  expires_at?: string | null;
}

export interface ClaimDevicePayload {
  token: string;
  home_id: string;
}

export interface ClaimDeviceResponse {
  success: boolean;
  claim_id?: string | null;
  device_id: string;
}

export async function validateClaimTokenApi(
  token: string
): Promise<ValidateClaimTokenResponse> {
  const response = await api.post<ValidateClaimTokenResponse>(
    "/device-claims/validate",
    { token: token.trim() }
  );
  return response.data;
}

export async function claimDeviceApi(
  payload: ClaimDevicePayload
): Promise<ClaimDeviceResponse> {
  const response = await api.post<ClaimDeviceResponse>(
    "/device-claims/claim",
    {
      token: payload.token.trim(),
      home_id: payload.home_id,
    }
  );
  return response.data;
}
import api from "./client";

// ============================================================
// TYPES
// ============================================================
export type RepeatValue = "ONCE" | "DAILY" | "WEEKDAYS" | "WEEKENDS";

export type Schedule = {
  id: string;
  name: string;
  device_id: string;
  action: "ON" | "OFF";
  time: string;
  repeat: RepeatValue;
  active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateSchedulePayload = {
  name: string;
  device_id: string;
  action: "ON" | "OFF";
  time: string;
  repeat: RepeatValue;
  active: boolean;
};

export type UpdateSchedulePayload = Partial<CreateSchedulePayload>;

export type DeleteScheduleResponse = {
  success: boolean;
  message: string;
  schedule_id: string;
};

// ============================================================
// GET ALL SCHEDULES
// ============================================================

export async function getSchedules(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _deviceId?: string
): Promise<Schedule[]> {
  const response = await api.get("/schedules/");

  const data = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data)
      ? response.data.data
      : [];

  return data;
}

// ============================================================
// GET SINGLE SCHEDULE BY ID
// ============================================================

export async function getScheduleById(
  scheduleId: string
): Promise<Schedule> {
  const response = await api.get(`/schedules/${scheduleId}`);
  return response.data;
}

// ============================================================
// CREATE SCHEDULE
// ============================================================

export async function createSchedule(
  data: CreateSchedulePayload
): Promise<Schedule> {
  const response = await api.post("/schedules/", data);
  return response.data;
}

// ============================================================
// UPDATE SCHEDULE (PATCH)
// ============================================================

export async function updateSchedule(
  scheduleId: string,
  data: UpdateSchedulePayload
): Promise<Schedule> {
  const response = await api.patch(`/schedules/${scheduleId}`, data);
  return response.data;
}

// ============================================================
// TOGGLE SCHEDULE
// ============================================================

export async function toggleSchedule(
  scheduleId: string
): Promise<Schedule> {
  const response = await api.patch(`/schedules/${scheduleId}/toggle`);
  return response.data;
}

// ============================================================
// DELETE SCHEDULE
// ============================================================

export async function deleteSchedule(
  scheduleId: string
): Promise<void> {
  await api.delete(`/schedules/${scheduleId}`);
}
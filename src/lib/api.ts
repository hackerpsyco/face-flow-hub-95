const API_BASE_URL = "http://localhost:5000/api";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("presence_token");
  const apiKey = localStorage.getItem("presence_device_key") || "fa_live_northwind_kiosk_key";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!headers["X-API-Key"]) {
    headers["X-API-Key"] = apiKey;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || errorData.message || "API request failed");
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[API] Fallback for ${endpoint}:`, err.message);
    throw err;
  }
}

// Specific API helper functions matching exact backend endpoint contract
export const api = {
  health: () => fetchApi<{ status: string }>("/health"),

  login: (email: string, password: string) =>
    fetchApi<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  scanAttendance: (deviceId: string, imageBase64: string) =>
    fetchApi<{
      matched: boolean;
      employee_name?: string;
      confidence: number;
      timestamp: string;
      employee?: any;
      attendance?: any;
      message?: string;
    }>("/attendance/scan", {
      method: "POST",
      body: JSON.stringify({ device_id: deviceId, image_base64: imageBase64 }),
    }),

  getEmployees: (query = "", dept = "all", status = "all") =>
    fetchApi<any[]>(`/employees?query=${encodeURIComponent(query)}&department=${dept}&status=${status}`),

  createEmployee: (name: string, employeeId: string, department: string) =>
    fetchApi<any>("/employees", {
      method: "POST",
      body: JSON.stringify({ name, employeeId, department }),
    }),

  enrollEmployee: (employeeId: string, images: string[]) =>
    fetchApi<{ success: boolean; embedding_id: string; employee: any; message: string }>(
      "/employees/enroll",
      {
        method: "POST",
        body: JSON.stringify({ employee_id: employeeId, images }),
      }
    ),

  deleteEmployee: (id: string) =>
    fetchApi<{ success: boolean }>(`/employees/${id}`, { method: "DELETE" }),

  getAttendanceLogs: (date = "", dept = "all", status = "all") =>
    fetchApi<any[]>(`/attendance/logs?date=${date}&department=${dept}&status=${status}`),

  getDevices: () => fetchApi<any[]>("/devices"),

  registerDevice: (deviceName: string, location: string) =>
    fetchApi<{ device_id: string; api_key: string; name: string; location: string }>(
      "/devices/register",
      {
        method: "POST",
        body: JSON.stringify({ device_name: deviceName, location }),
      }
    ),

  getDashboardStats: () => fetchApi<any>("/dashboard/stats"),
};

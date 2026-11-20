# Frontend Automation System - Quick Start Guide

## 🚀 Setup Instructions

### 1. Install Dependencies (if not already done)
```bash
cd FRONTEND/human-guard-dashboard
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update `.env.local` with your backend URL:
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1/ws/devices
```

### 3. Start Development Server
```bash
npm run dev
```

This will start the Vite dev server at `http://localhost:5173`

## 📋 Features Overview

### Dashboard Header
- **Home Status**: Real-time device online/offline count
- **⚙️ Automation Rules Button**: Opens automation management drawer

### Automation Rules Drawer
Located in the right sidebar when opened:

#### Create New Rules
Fill out the form:
- **Rule Name**: e.g., "Auto Crop Watering"
- **Sensor Type**: SOIL_MOISTURE, TEMPERATURE, WATER_LEVEL
- **Operator**: `<` (Less Than), `>` (Greater Than), `==` (Equals)
- **Threshold**: Numeric value (e.g., 30)
- **Target Device**: Select which device to control
- **Action**: PUMP_ON, PUMP_OFF, LIGHT_ON, LIGHT_OFF
- Click "+ Add Rule"

#### Manage Rules
For each existing rule:
- View the condition summary (e.g., "IF SOIL_MOISTURE < 30 ➔ PUMP_ON")
- **ACTIVE** / **PAUSED** button to toggle
- **🗑️** button to delete

## 🔗 Backend API Requirements

The following endpoints must be implemented in FastAPI:

### Automation Rules Endpoints
```typescript
// GET all rules
GET /api/v1/automation/rules
Response: AutomationRule[]

// Create new rule
POST /api/v1/automation/rules
Body: {
  rule_name: string;
  sensor_type: string;
  threshold: number;
  operator: "<" | ">" | "==";
  target_device_id: string;
  action: string;
  is_active: boolean;
}

// Toggle rule active status
PATCH /api/v1/automation/rules/{id}
Body: { is_active: boolean }

// Delete rule
DELETE /api/v1/automation/rules/{id}
```

### WebSocket Endpoint
```
WS /api/v1/ws/devices
Message format:
{
  type: "AUTOMATION_TRIGGERED" | "DEVICE_UPDATE",
  device: {
    device_id: string,
    device_name: string,
    status: string,
    state: string,
    // ... other device fields
  }
}
```

## 🔧 TypeScript Types

All types are properly defined in `src/types.ts`:

```typescript
export type AutomationRule = {
  id: string;
  rule_name: string;
  sensor_type: string;
  threshold: number;
  operator: ">" | "<" | "==";
  target_device_id: string;
  action: "PUMP_ON" | "PUMP_OFF" | "LIGHT_ON" | "LIGHT_OFF";
  is_active: boolean;
};

export type Device = {
  // ... existing fields ...
  is_auto?: boolean; // New field
};
```

## 🧪 Testing

### Manual Testing Steps
1. Open Dashboard
2. Click "⚙️ Automation Rules" button
3. Create a test rule with valid device
4. Verify in browser DevTools Network tab that POST request succeeds
5. Check if rule appears in "Active Automation Engine Rules" list
6. Toggle rule on/off and verify state changes
7. Check WebSocket connection in browser DevTools

### Console Logs
Watch browser console (F12) for:
- `WebSocket connected` - successful connection
- `WebSocket disconnected` - connection lost
- `AUTOMATION_TRIGGERED` messages - rule executed
- Error messages for debugging

## 📦 Build for Production

```bash
npm run build
npm run preview
```

## 🐛 Troubleshooting

### WebSocket Connection Failed
- Check `VITE_WS_URL` environment variable
- Ensure backend WebSocket endpoint is running
- Check browser console for connection errors
- Verify backend CORS settings allow frontend origin

### API Requests Failing
- Check `VITE_API_URL` in `.env.local`
- Verify backend is running on correct port
- Check Authentication header (JWT token in localStorage)
- Review network requests in DevTools

### Rules Not Showing
- Verify `GET /automation/rules` endpoint returns data
- Check TypeScript types match backend response
- Review network response in DevTools

### Styling Issues
- Project uses Tailwind CSS (pre-configured)
- Custom theme variables: `text-text-main`, `bg-card`, `border-theme-border`, etc.
- Update `tailwind.config.js` if needed

## 📚 Related Files

- Component: [src/components/AutomationRulesDrawer.tsx](src/components/AutomationRulesDrawer.tsx)
- Dashboard: [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)
- Types: [src/types.ts](src/types.ts)
- API Client: [src/api/client.ts](src/api/client.ts)
- Config: [.env.example](.env.example)

## ✅ Implementation Checklist

- [x] API client with environment variables
- [x] TypeScript types for AutomationRule and Device
- [x] AutomationRulesDrawer component
- [x] Dashboard integration
- [x] WebSocket with reconnection logic
- [x] Error handling and loading states
- [x] Environment configuration guide

## 🚀 Next Steps

1. Implement backend API endpoints (if not already done)
2. Test WebSocket connection
3. Verify device list populates correctly
4. Create and test automation rules
5. Monitor real-time updates via WebSocket

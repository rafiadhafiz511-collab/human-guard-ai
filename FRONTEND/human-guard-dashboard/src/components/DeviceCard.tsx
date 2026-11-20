import React, { useState } from 'react';

export interface Device {
  id: string;
  device_id: string; // e.g. PUMP001 / CAM001
  name: string;
  type: 'SWITCH' | 'SENSOR' | 'CAMERA' | string;
  is_on?: boolean;
  is_online?: boolean;
  value?: string;
}

interface DeviceCardProps {
  device: Device;
  onToggle: (id: string, currentState: boolean) => Promise<void> | void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onToggle }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(device.id, !!device.is_on);
    } finally {
      setIsToggling(false);
    }
  };

  const renderTypeDetails = () => {
    switch (device.type) {
      case 'SWITCH':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          label: 'Switch / Relay',
        };
      case 'SENSOR':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          label: 'Sensor',
        };
      case 'CAMERA':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ),
          badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          label: 'Camera',
        };
      default:
        return {
          icon: null,
          badgeBg: 'bg-slate-500/10 text-slate-600',
          label: 'Device',
        };
    }
  };

  const typeDetails = renderTypeDetails();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${device.is_on ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'} transition-all`}>
            {typeDetails.icon}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
              {device.name}
            </h4>
            <span className="text-xs font-mono text-slate-400 tracking-wider">
              {device.device_id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${device.is_online ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'}`} />
          <span className="text-xs text-slate-400">{device.is_online ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Type & Sensor Data */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
        <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${typeDetails.badgeBg}`}>
          {typeDetails.label}
        </span>

        {device.type === 'SENSOR' && (
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {device.value ?? '28°C'}
          </span>
        )}

        {device.type === 'CAMERA' && (
          <span className="text-xs font-medium text-blue-500 hover:underline cursor-pointer">
            Live View →
          </span>
        )}
      </div>

      {/* Control Switch */}
      {device.type === 'SWITCH' && (
        <div className="mt-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 -mx-5 -mb-5 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Status: <strong className={device.is_on ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>{device.is_on ? 'POWER ON' : 'POWER OFF'}</strong>
          </span>

          <button
            onClick={handleToggle}
            disabled={isToggling || !device.is_online}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${device.is_on ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${device.is_on ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      )}
    </div>
  );
};
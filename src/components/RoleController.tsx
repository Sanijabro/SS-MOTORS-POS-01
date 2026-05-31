import React from "react";
import { ShieldCheck, Wifi, WifiOff, RefreshCw, User, Database, Cpu } from "lucide-react";

interface RoleControllerProps {
  currentRole: string;
  setRole: (role: string) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  syncQueueCount: number;
  onSync: () => void;
  isSyncing: boolean;
}

export default function RoleController({
  currentRole,
  setRole,
  isOnline,
  setIsOnline,
  syncQueueCount,
  onSync,
  isSyncing
}: RoleControllerProps) {
  return (
    <div className="w-full bg-zinc-900 border-b border-zinc-800 text-zinc-100 px-4 py-3 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Branding & Core Mode */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg tracking-tight text-white shadow-inner">
            S
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">SS MOTORS</h1>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider leading-none">Tuk Tuk &amp; Bicycle Spare Parts Specialist</p>
          </div>
        </div>

        {/* Center: System Status Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Network Connection Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              isOnline
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50"
                : "bg-amber-950/60 text-amber-500 border border-amber-500/30 hover:bg-amber-900/50 animate-pulse"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi size={14} className="text-emerald-400" />
                <span>Online (Lanka Net)</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-amber-500" />
                <span>Offline mode active</span>
              </>
            )}
          </button>

          {/* Offline Sync Status Button */}
          {syncQueueCount > 0 && (
            <button
              onClick={onSync}
              disabled={isSyncing || !isOnline}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                isOnline
                  ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-500"
                  : "bg-zinc-800 text-zinc-400 cursor-not-allowed"
              }`}
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
              <span>Sync Queue ({syncQueueCount})</span>
            </button>
          )}

  // Active Persona / RBAC Selection with clear Sign Out action
          <div className="flex items-center space-x-3 bg-zinc-850 border border-zinc-750 rounded-lg px-3 py-1">
            <div className="flex items-center space-x-1.5 cursor-default">
              <User size={13} className="text-zinc-400" />
              <span className="text-[11px] font-mono uppercase text-zinc-300">
                {currentRole === "super-admin" ? "Rohan (Admin)" : currentRole === "store-manager" ? "Bandara (Mgr)" : "Chinthaka (Csr)"}
              </span>
            </div>
            <button
              onClick={() => setRole("")}
              className="bg-red-950/60 hover:bg-red-900 border border-red-500/30 hover:border-red-500/55 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
              title="Sign out of current active workstation session"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Right: Security Warning / Indicator */}
        <div className="flex items-center space-x-2 text-right">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-[11px] text-zinc-400">
            {currentRole === "super-admin" && "Full Master Access Granted"}
            {currentRole === "store-manager" && "Manager Access (No margin insight)"}
            {currentRole === "cashier" && "Billing Terminal Cashier Access Locked"}
          </span>
        </div>
      </div>
    </div>
  );
}

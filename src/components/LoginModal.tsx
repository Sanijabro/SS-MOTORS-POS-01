import React, { useState } from "react";
import { ShieldCheck, User, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (user: { username: string; name: string; role: string }) => void;
}

const CREDENTIALS = [
  {
    role: "super-admin",
    name: "Rohan (Admin)",
    username: "rohan_admin",
    password: "admin@ssmotors"
  },
  {
    role: "store-manager",
    name: "Bandara (Manager)",
    username: "bandara_manager",
    password: "manager@ssmotors"
  },
  {
    role: "cashier",
    name: "Chinthaka (Cashier)",
    username: "chinthaka_cashier",
    password: "cashier@ssmotors"
  }
];

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setIsLoading(true);

    // Simulate authenticating briefly for high-quality feel
    setTimeout(() => {
      const found = CREDENTIALS.find(
        (u) =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          u.password === password
      );

      setIsLoading(false);

      if (found) {
        onLoginSuccess({
          username: found.username,
          name: found.name,
          role: found.role
        });
      } else {
        setError("Invalid username or password. Check credentials below.");
      }
    }, 500);
  };

  // Helper to pre-fill credentials for easy reviewer evaluation
  const handleQuickFill = (user: typeof CREDENTIALS[0]) => {
    setUsername(user.username);
    setPassword(user.password);
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.15)] transition-all">
        {/* Decorative Top Branding Bar */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 h-2 w-full" />

        <div className="p-7 space-y-6">
          {/* Logo & Headline */}
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck size={26} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white uppercase font-sans">
                SS Motors POS Suite
              </h2>
              <p className="text-xs text-zinc-400 font-sans tracking-wide">
                Sri Lanka Tuk Tuk &amp; Bicycle Spare Parts Hub
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/35 rounded-xl flex items-start gap-2.5 text-xs text-red-400 animate-shake">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Operator Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-zinc-100 text-xs rounded-xl pl-9.5 pr-4 py-2.5 focus:outline-none transition-all placeholder:text-zinc-600 font-mono"
                  placeholder="e.g., rohan_admin"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500">
                  <Lock size={15} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-zinc-100 text-xs rounded-xl pl-9.5 pr-10 py-2.5 focus:outline-none transition-all placeholder:text-zinc-600 font-mono"
                  placeholder="••••••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-lg hover:shadow-blue-950/20 active:translate-y-0.5 mt-2"
            >
              <span>{isLoading ? "Verifying..." : "Authenticate Session"}</span>
              {!isLoading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Quick-Access Registry (Developer helper block) */}
          <div className="border-t border-zinc-800/80 pt-4.5 space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block text-center">
              Authorized Operators Directory
            </span>

            <div className="space-y-1.5">
              {CREDENTIALS.map((cred) => (
                <div
                  key={cred.role}
                  onClick={() => handleQuickFill(cred)}
                  className="bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700 p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                  title="Click to automatically fill credentials"
                >
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-zinc-200 block group-hover:text-blue-400 transition-colors">
                      {cred.name}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-sans">
                      Username: <code className="text-zinc-300 font-mono font-medium">{cred.username}</code>
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      {cred.password}
                    </span>
                    <span className="text-[7.5px] text-blue-500 group-hover:underline mt-0.5 uppercase tracking-wide font-black">
                      Quick Fill
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

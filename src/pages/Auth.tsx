import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"boot" | "login" | "processing" | "granted" | "denied" | "notfound">("boot");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [inputType, setInputType] = useState<"username" | "password">("username");
  const [username, setUsername] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Boot sequence
  useEffect(() => {
    const bootSequence = [
      { text: "╔══════════════════════════════════════════════════════════════╗", delay: 0 },
      { text: "║          NELTECH SECURITY SYSTEM v2.0.4                      ║", delay: 50 },
      { text: "║          ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀                         ║", delay: 100 },
      { text: "╚══════════════════════════════════════════════════════════════╝", delay: 150 },
      { text: "", delay: 200 },
      { text: "[INIT] Starting secure boot sequence...", delay: 400 },
      { text: "[LOAD] Kernel modules ████████████████████ 100%", delay: 700 },
      { text: "[LOAD] Security protocols ██████████████████ 100%", delay: 1000 },
      { text: "[LOAD] Encryption engine ████████████████████ 100%", delay: 1300 },
      { text: "", delay: 1400 },
      { text: "[✓] AES-256-GCM encryption: ACTIVE", delay: 1600 },
      { text: "[✓] TLS 1.3 connection: SECURED", delay: 1800 },
      { text: "[✓] Firewall: ARMED", delay: 2000 },
      { text: "[✓] Intrusion detection: MONITORING", delay: 2200 },
      { text: "", delay: 2400 },
      { text: "┌──────────────────────────────────────────────────────────────┐", delay: 2600 },
      { text: "│           SECURE CLOUD STORAGE TERMINAL                     │", delay: 2700 },
      { text: "│           ═══════════════════════════════                   │", delay: 2800 },
      { text: "│                                                              │", delay: 2900 },
      { text: "│   ⚠  AUTHORIZED PERSONNEL ONLY                              │", delay: 3000 },
      { text: "│   ⚠  All access attempts are logged and monitored           │", delay: 3100 },
      { text: "│                                                              │", delay: 3200 },
      { text: "└──────────────────────────────────────────────────────────────┘", delay: 3300 },
      { text: "", delay: 3400 },
    ];

    let timeouts: NodeJS.Timeout[] = [];

    bootSequence.forEach(({ text, delay }) => {
      const timeout = setTimeout(() => {
        setTerminalLines(prev => [...prev, text]);
      }, delay);
      timeouts.push(timeout);
    });

    const finalTimeout = setTimeout(() => {
      setPhase("login");
      setTerminalLines(prev => [...prev, "[SYS] Authentication required. Enter credentials:", ""]);
    }, 3600);
    timeouts.push(finalTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Focus input when login phase starts
  useEffect(() => {
    if ((phase === "login" || phase === "notfound") && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase, inputType]);

  // Check if user exists (attempt sign in with wrong password to check)
  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      // Try to sign in with a random password - if user doesn't exist, we get a specific error
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'check_user_exists_random_' + Math.random()
      });
      
      // If error message indicates invalid credentials, user exists
      // If it says user not found or similar, user doesn't exist
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          return true; // User exists but wrong password
        }
        if (msg.includes('user not found') || msg.includes('no user found') || msg.includes('email not confirmed')) {
          return false;
        }
        // Default assume exists if we get other errors
        return true;
      }
      return true;
    } catch {
      return true; // Assume exists on error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInput.trim()) return;

    if (inputType === "username") {
      const email = currentInput.trim();
      setUsername(email);
      setTerminalLines(prev => [...prev, `> Email: ${email}`, ""]);
      
      if (mode === "login") {
        // Check if user exists
        setPhase("processing");
        setTerminalLines(prev => [...prev, "[AUTH] Scanning user database..."]);
        
        const exists = await checkUserExists(email);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (exists) {
          setTerminalLines(prev => [...prev, "[✓] User found in database", "", "[AUTH] Enter password to continue:", ""]);
          setPhase("login");
          setInputType("password");
        } else {
          setTerminalLines(prev => [
            ...prev, 
            "",
            "┌──────────────────────────────────────────────┐",
            "│  ⚠  USER NOT FOUND IN DATABASE              │",
            "└──────────────────────────────────────────────┘",
            "",
            "[WARN] No account exists with this email.",
            "[INFO] Options:",
            "       • Press [R] to register a new account",
            "       • Press [T] to try a different email",
            ""
          ]);
          setPhase("notfound");
        }
      } else {
        // Register mode - go directly to password
        setTerminalLines(prev => [...prev, "[AUTH] Creating new account...", "[AUTH] Enter a secure password (min 6 chars):", ""]);
        setInputType("password");
        setPhase("login");
      }
      setCurrentInput("");
    } else {
      // Password phase
      const pwd = currentInput;
      setTerminalLines(prev => [...prev, `> Password: ${"•".repeat(pwd.length)}`, ""]);
      setPhase("processing");
      
      if (mode === "login") {
        setTerminalLines(prev => [...prev, "[AUTH] Verifying credentials..."]);
        
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: username,
            password: pwd
          });

          if (error) throw error;

          await new Promise(resolve => setTimeout(resolve, 600));
          setTerminalLines(prev => [...prev, "[AUTH] Decrypting access tokens...", "[AUTH] Establishing secure session..."]);
          await new Promise(resolve => setTimeout(resolve, 400));
          
          setPhase("granted");
          setTerminalLines(prev => [
            ...prev,
            "",
            "╔══════════════════════════════════════════════════════════════╗",
            "║                                                              ║",
            "║   █████╗  ██████╗ ██████╗███████╗███████╗███████╗            ║",
            "║  ██╔══██╗██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝            ║",
            "║  ███████║██║     ██║     █████╗  ███████╗███████╗            ║",
            "║  ██╔══██║██║     ██║     ██╔══╝  ╚════██║╚════██║            ║",
            "║  ██║  ██║╚██████╗╚██████╗███████╗███████║███████║            ║",
            "║  ╚═╝  ╚═╝ ╚═════╝ ╚═════╝╚══════╝╚══════╝╚══════╝            ║",
            "║                                                              ║",
            "║              ✓ ACCESS GRANTED ✓                              ║",
            "║                                                              ║",
            "╚══════════════════════════════════════════════════════════════╝",
            "",
            `[SYS] Welcome, ${username.split('@')[0]}`,
            "[SYS] Redirecting to secure terminal...",
          ]);

          toast.success("Access granted!");
          setTimeout(() => navigate("/dashboard"), 2000);

        } catch (error: any) {
          await new Promise(resolve => setTimeout(resolve, 500));
          setPhase("denied");
          setTerminalLines(prev => [
            ...prev,
            "",
            "╔══════════════════════════════════════════════════════════════╗",
            "║                                                              ║",
            "║  ██████╗ ███████╗███╗   ██╗██╗███████╗██████╗                ║",
            "║  ██╔══██╗██╔════╝████╗  ██║██║██╔════╝██╔══██╗               ║",
            "║  ██║  ██║█████╗  ██╔██╗ ██║██║█████╗  ██║  ██║               ║",
            "║  ██║  ██║██╔══╝  ██║╚██╗██║██║██╔══╝  ██║  ██║               ║",
            "║  ██████╔╝███████╗██║ ╚████║██║███████╗██████╔╝               ║",
            "║  ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝╚═════╝                ║",
            "║                                                              ║",
            "║              ✗ ACCESS DENIED ✗                               ║",
            "║                                                              ║",
            "╚══════════════════════════════════════════════════════════════╝",
            "",
            `[ERROR] ${error.message || "Invalid credentials"}`,
            "[WARN] This incident has been logged.",
            "",
          ]);

          toast.error("Access denied!");
          
          setTimeout(() => {
            resetToLogin();
          }, 2500);
        }
      } else {
        // Register mode
        if (pwd.length < 6) {
          setTerminalLines(prev => [...prev, "[ERROR] Password must be at least 6 characters", ""]);
          setPhase("login");
          setCurrentInput("");
          return;
        }

        setTerminalLines(prev => [...prev, "[AUTH] Creating new user account...", "[AUTH] Generating encryption keys..."]);

        try {
          const { error } = await supabase.auth.signUp({
            email: username,
            password: pwd,
            options: { emailRedirectTo: `${window.location.origin}/` }
          });

          if (error) throw error;

          await new Promise(resolve => setTimeout(resolve, 800));
          setPhase("granted");
          setTerminalLines(prev => [
            ...prev,
            "",
            "╔══════════════════════════════════════════════════════════════╗",
            "║              ✓ ACCOUNT CREATED SUCCESSFULLY ✓                ║",
            "╚══════════════════════════════════════════════════════════════╝",
            "",
            "[SYS] User registered successfully.",
            "[SYS] Initializing user workspace...",
            "[SYS] Redirecting to secure terminal...",
          ]);

          toast.success("Account created!");
          setTimeout(() => navigate("/dashboard"), 2000);

        } catch (error: any) {
          setPhase("denied");
          setTerminalLines(prev => [
            ...prev,
            "",
            `[ERROR] ${error.message || "Registration failed"}`,
            "",
          ]);
          toast.error(error.message || "Registration failed");
          
          setTimeout(() => resetToLogin(), 2000);
        }
      }
      setCurrentInput("");
    }
  };

  const resetToLogin = () => {
    setPhase("login");
    setInputType("username");
    setUsername("");
    setCurrentInput("");
    setMode("login");
    setTerminalLines(prev => [...prev, "[SYS] Authentication required. Enter credentials:", ""]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (phase === "notfound") {
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        setMode("register");
        setTerminalLines(prev => [...prev, "", "[MODE] Switching to REGISTER mode...", "[AUTH] Enter a secure password (min 6 chars):", ""]);
        setInputType("password");
        setPhase("login");
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setUsername("");
        setCurrentInput("");
        setTerminalLines(prev => [...prev, "", "[MODE] Try again with different email:", ""]);
        setInputType("username");
        setPhase("login");
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      toast.error("Enter your email first");
      return;
    }

    setTerminalLines(prev => [...prev, "", "[AUTH] Initiating password reset...", "[AUTH] Sending secure reset link..."]);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(username, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      setTerminalLines(prev => [...prev, "[✓] Reset link sent to your email.", "[INFO] Check your inbox and spam folder.", ""]);
      toast.success("Reset link sent!");
    } catch (error: any) {
      setTerminalLines(prev => [...prev, `[ERROR] ${error.message}`, ""]);
      toast.error(error.message);
    }
  };

  const switchMode = () => {
    const newMode = mode === "login" ? "register" : "login";
    setMode(newMode);
    setUsername("");
    setCurrentInput("");
    setInputType("username");
    setPhase("login");
    setTerminalLines(prev => [
      ...prev, 
      "", 
      `[MODE] Switching to ${newMode.toUpperCase()} mode...`,
      `[SYS] Enter ${newMode === "register" ? "email for new account" : "credentials"}:`,
      ""
    ]);
  };

  return (
    <div 
      className="min-h-screen bg-[#0a0a0a] text-[#00ff00] font-mono overflow-hidden relative cursor-text select-none"
      onClick={() => inputRef.current?.focus()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Enhanced CRT effects */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <div 
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 3px)',
          }}
        />
      </div>

      {/* Glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,0,0.1) 0%, transparent 50%)',
        }}
      />

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Matrix rain - more columns on larger screens */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08]">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute text-[#00ff00] text-[10px] sm:text-xs whitespace-nowrap"
            style={{
              left: `${(i * 100) / 30}%`,
              animation: `matrix-rain ${15 + Math.random() * 15}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          >
            {[...Array(80)].map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
          </div>
        ))}
      </div>

      {/* Terminal container */}
      <div className="relative z-20 min-h-screen flex flex-col max-w-4xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-[#00ff00]/30 bg-[#0a0a0a]/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          <span className="text-[10px] sm:text-xs text-[#00ff00]/80 hidden sm:block">
            neltech@secure-terminal ~ {mode === "register" ? "REGISTER" : "LOGIN"}
          </span>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[#00ff00]/60">
            <span className="hidden sm:inline">TLS 1.3</span>
            <span className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.8)]" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Terminal output */}
        <div 
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-3 sm:p-6 pb-32 sm:pb-40"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ff0030 transparent' }}
        >
          {terminalLines.map((line, index) => (
            <div 
              key={index} 
              className={`whitespace-pre-wrap leading-5 sm:leading-6 text-xs sm:text-sm ${
                line.includes("ACCESS GRANTED") || line.includes("✓") ? "text-[#00ff00] drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]" :
                line.includes("ACCESS DENIED") || line.includes("✗") || line.includes("[ERROR]") ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" :
                line.includes("[WARN]") || line.includes("⚠") ? "text-yellow-400" :
                line.includes("[✓]") || line.includes("[OK]") ? "text-emerald-400" :
                line.includes("[INIT]") || line.includes("[LOAD]") || line.includes("[AUTH]") || line.includes("[SYS]") || line.includes("[INFO]") || line.includes("[MODE]") ? "text-cyan-400" :
                line.includes("═") || line.includes("─") || line.includes("│") || line.includes("╔") || line.includes("╗") || line.includes("╚") || line.includes("╝") || line.includes("┌") || line.includes("┐") || line.includes("└") || line.includes("┘") ? "text-[#00ff00]/70" :
                "text-[#00ff00]"
              }`}
            >
              {line}
            </div>
          ))}

          {/* Input line */}
          {phase === "login" && (
            <div className="flex items-center mt-2 text-xs sm:text-sm">
              <span className="text-cyan-400 mr-2 shrink-0">
                {inputType === "username" ? "Email:" : "Password:"}
              </span>
              <form onSubmit={handleSubmit} className="flex-1 flex items-center min-w-0">
                <span className="text-[#00ff00] break-all">
                  {inputType === "password" ? "•".repeat(currentInput.length) : currentInput}
                </span>
                <span 
                  className={`w-2 h-4 sm:h-5 bg-[#00ff00] ml-0.5 shrink-0 shadow-[0_0_8px_rgba(0,255,0,0.8)] ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                />
                <input
                  ref={inputRef}
                  type={inputType === "password" ? "password" : "text"}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                  autoComplete={inputType === "username" ? "email" : "current-password"}
                />
              </form>
            </div>
          )}

          {/* Not found - waiting for key press */}
          {phase === "notfound" && (
            <div className="flex items-center mt-2 text-xs sm:text-sm">
              <span className="text-yellow-400 animate-pulse">Waiting for input...</span>
              <span 
                className={`w-2 h-4 sm:h-5 bg-yellow-400 ml-2 shadow-[0_0_8px_rgba(234,179,8,0.8)] ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          )}

          {/* Processing indicator */}
          {phase === "processing" && (
            <div className="flex items-center mt-2 text-xs sm:text-sm">
              <span className="text-cyan-400">Processing</span>
              <span className="ml-1 text-cyan-400 animate-pulse">█░░</span>
            </div>
          )}
        </div>

        {/* Command bar */}
        {(phase === "login" || phase === "notfound") && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 border-t border-[#00ff00]/30 p-3 sm:p-4 z-50 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center text-[10px] sm:text-xs">
                {phase === "notfound" ? (
                  <>
                    <button 
                      onClick={() => {
                        setMode("register");
                        setTerminalLines(prev => [...prev, "", "[MODE] Switching to REGISTER mode...", "[AUTH] Enter a secure password (min 6 chars):", ""]);
                        setInputType("password");
                        setPhase("login");
                      }}
                      className="text-emerald-400 border border-emerald-400/50 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-emerald-400/20 transition-all hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] active:scale-95"
                    >
                      [R] Register
                    </button>
                    <button 
                      onClick={() => {
                        setUsername("");
                        setCurrentInput("");
                        setTerminalLines(prev => [...prev, "", "[MODE] Try again with different email:", ""]);
                        setInputType("username");
                        setPhase("login");
                      }}
                      className="text-cyan-400 border border-cyan-400/50 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-cyan-400/20 transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-95"
                    >
                      [T] Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleSubmit}
                      className="text-[#00ff00] border border-[#00ff00]/50 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-[#00ff00]/20 transition-all hover:shadow-[0_0_15px_rgba(0,255,0,0.3)] active:scale-95"
                    >
                      [↵] {mode === "register" ? "Register" : "Login"}
                    </button>
                    <button 
                      onClick={switchMode}
                      className="text-purple-400 border border-purple-400/50 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-purple-400/20 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
                    >
                      [M] {mode === "register" ? "Login" : "Register"}
                    </button>
                    {inputType === "password" && mode === "login" && (
                      <button 
                        onClick={handleForgotPassword}
                        className="text-yellow-400 border border-yellow-400/50 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-yellow-400/20 transition-all hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] active:scale-95"
                      >
                        [F1] Forgot
                      </button>
                    )}
                  </>
                )}
              </div>
              
              {/* Status bar */}
              <div className="flex justify-center gap-3 sm:gap-6 mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-[#00ff00]/50">
                <span>MODE: {mode.toUpperCase()}</span>
                <span>•</span>
                <span>ENCRYPTION: AES-256</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">CONNECTION: SECURED</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#00ff00]/[0.03] to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default Auth;

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"boot" | "login" | "processing" | "granted" | "denied">("boot");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [inputType, setInputType] = useState<"username" | "password">("username");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
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
      { text: "NELTECH SECURITY SYSTEM v2.0.4", delay: 0 },
      { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 100 },
      { text: "", delay: 200 },
      { text: "[BOOT] Initializing kernel modules...", delay: 300 },
      { text: "[BOOT] Loading security protocols...", delay: 600 },
      { text: "[BOOT] Establishing encrypted connection...", delay: 900 },
      { text: "[OK] AES-256 encryption active", delay: 1200 },
      { text: "[OK] Firewall status: ACTIVE", delay: 1400 },
      { text: "[OK] Intrusion detection: ARMED", delay: 1600 },
      { text: "", delay: 1800 },
      { text: "╔══════════════════════════════════════════════╗", delay: 2000 },
      { text: "║     NELTECH SECURE CLOUD STORAGE SYSTEM      ║", delay: 2100 },
      { text: "║          AUTHORIZED PERSONNEL ONLY           ║", delay: 2200 },
      { text: "╚══════════════════════════════════════════════╝", delay: 2300 },
      { text: "", delay: 2400 },
      { text: "[SYS] Authentication required to proceed...", delay: 2600 },
      { text: "", delay: 2800 },
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
      setTerminalLines(prev => [...prev, "Enter credentials to access the system:", ""]);
    }, 3000);
    timeouts.push(finalTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Focus input when login phase starts
  useEffect(() => {
    if (phase === "login" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, inputType]);

  const typeText = async (text: string, delay = 30) => {
    setIsTyping(true);
    for (let i = 0; i <= text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setTerminalLines(prev => {
        const newLines = [...prev];
        newLines[newLines.length - 1] = text.slice(0, i);
        return newLines;
      });
    }
    setIsTyping(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputType === "username") {
      setUsername(currentInput);
      setTerminalLines(prev => [...prev, `> Username: ${currentInput}`, ""]);
      setCurrentInput("");
      setInputType("password");
    } else {
      setPassword(currentInput);
      setTerminalLines(prev => [...prev, `> Password: ${"•".repeat(currentInput.length)}`, ""]);
      setPhase("processing");
      
      // Add processing animation
      setTerminalLines(prev => [...prev, "[AUTH] Verifying credentials..."]);
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password: currentInput
        });

        if (error) throw error;

        // Success
        await new Promise(resolve => setTimeout(resolve, 800));
        setTerminalLines(prev => [...prev, "[AUTH] Decrypting access tokens...", ""]);
        await new Promise(resolve => setTimeout(resolve, 600));
        setTerminalLines(prev => [...prev, "[AUTH] Validating session...", ""]);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        setPhase("granted");
        setTerminalLines(prev => [
          ...prev,
          "",
          "╔══════════════════════════════════════════════╗",
          "║                                              ║",
          "║        █████╗  ██████╗ ██████╗███████╗███████╗       ║",
          "║       ██╔══██╗██╔════╝██╔════╝██╔════╝██╔════╝       ║",
          "║       ███████║██║     ██║     █████╗  ███████╗       ║",
          "║       ██╔══██║██║     ██║     ██╔══╝  ╚════██║       ║",
          "║       ██║  ██║╚██████╗╚██████╗███████╗███████║       ║",
          "║       ╚═╝  ╚═╝ ╚═════╝ ╚═════╝╚══════╝╚══════╝       ║",
          "║                                              ║",
          "║            ✓ ACCESS GRANTED ✓               ║",
          "║                                              ║",
          "╚══════════════════════════════════════════════╝",
          "",
          "[SYS] Welcome, authorized user.",
          "[SYS] Redirecting to secure terminal...",
        ]);

        toast.success("Access granted!");
        setTimeout(() => navigate("/dashboard"), 2000);

      } catch (error: any) {
        // Failed
        await new Promise(resolve => setTimeout(resolve, 800));
        setPhase("denied");
        setTerminalLines(prev => [
          ...prev,
          "",
          "╔══════════════════════════════════════════════╗",
          "║                                              ║",
          "║       ██████╗ ███████╗███╗   ██╗██╗███████╗██████╗  ║",
          "║       ██╔══██╗██╔════╝████╗  ██║██║██╔════╝██╔══██╗ ║",
          "║       ██║  ██║█████╗  ██╔██╗ ██║██║█████╗  ██║  ██║ ║",
          "║       ██║  ██║██╔══╝  ██║╚██╗██║██║██╔══╝  ██║  ██║ ║",
          "║       ██████╔╝███████╗██║ ╚████║██║███████╗██████╔╝ ║",
          "║       ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝╚═════╝  ║",
          "║                                              ║",
          "║            ✗ ACCESS DENIED ✗                ║",
          "║                                              ║",
          "╚══════════════════════════════════════════════╝",
          "",
          `[ERROR] ${error.message || "Invalid credentials"}`,
          "[WARN] This incident will be logged.",
          "",
        ]);

        toast.error("Access denied!");
        
        // Reset after delay
        setTimeout(() => {
          setPhase("login");
          setInputType("username");
          setUsername("");
          setPassword("");
          setCurrentInput("");
          setTerminalLines(prev => [...prev, "Enter credentials to access the system:", ""]);
        }, 2500);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      // Switch to register mode - navigate to register view
    }
  };

  const handleRegister = async () => {
    if (phase !== "login") return;
    
    if (!username || currentInput.length < 6) {
      toast.error("Enter email and password (min 6 chars)");
      return;
    }

    setPhase("processing");
    setTerminalLines(prev => [...prev, `> Password: ${"•".repeat(currentInput.length)}`, "", "[AUTH] Creating new user account..."]);

    try {
      const { error } = await supabase.auth.signUp({
        email: username,
        password: currentInput,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      await new Promise(resolve => setTimeout(resolve, 800));
      setPhase("granted");
      setTerminalLines(prev => [
        ...prev,
        "",
        "╔══════════════════════════════════════════════╗",
        "║            ✓ ACCOUNT CREATED ✓              ║",
        "╚══════════════════════════════════════════════╝",
        "",
        "[SYS] User registered successfully.",
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
      
      setTimeout(() => {
        setPhase("login");
        setInputType("username");
        setUsername("");
        setPassword("");
        setCurrentInput("");
        setTerminalLines(prev => [...prev, "Enter credentials to access the system:", ""]);
      }, 2000);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      toast.error("Enter your email first");
      return;
    }

    setTerminalLines(prev => [...prev, "", "[AUTH] Sending password reset link..."]);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(username, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      setTerminalLines(prev => [...prev, "[OK] Reset link sent to your email.", ""]);
      toast.success("Reset link sent!");
    } catch (error: any) {
      setTerminalLines(prev => [...prev, `[ERROR] ${error.message}`, ""]);
      toast.error(error.message);
    }
  };

  return (
    <div 
      className="min-h-screen bg-black text-[#00ff00] font-mono overflow-hidden relative cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* CRT scanline effect */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <div 
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
          }}
        />
      </div>

      {/* CRT flicker effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-40 animate-pulse opacity-[0.03]"
        style={{ background: 'linear-gradient(transparent 50%, rgba(0,255,0,0.1) 50%)' }}
      />

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Matrix rain background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-[#00ff00] text-xs whitespace-nowrap animate-matrix-rain"
            style={{
              left: `${i * 5}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          >
            {[...Array(50)].map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
          </div>
        ))}
      </div>

      {/* Terminal container */}
      <div className="relative z-20 min-h-screen p-4 md:p-8 flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4 border-b border-[#00ff00]/30 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-[#00ff00]/60">neltech@secure-terminal:~</span>
          <span className="text-xs text-[#00ff00]/60">{new Date().toLocaleTimeString()}</span>
        </div>

        {/* Terminal output */}
        <div 
          ref={terminalRef}
          className="flex-1 overflow-y-auto pb-24 scrollbar-thin scrollbar-thumb-[#00ff00]/30 scrollbar-track-transparent"
        >
          {terminalLines.map((line, index) => (
            <div 
              key={index} 
              className={`whitespace-pre-wrap leading-6 ${
                line.includes("ACCESS GRANTED") || line.includes("✓") ? "text-[#00ff00] animate-pulse" :
                line.includes("ACCESS DENIED") || line.includes("✗") || line.includes("[ERROR]") ? "text-red-500" :
                line.includes("[WARN]") ? "text-yellow-500" :
                line.includes("[OK]") ? "text-[#00ff00]" :
                line.includes("[BOOT]") || line.includes("[AUTH]") || line.includes("[SYS]") ? "text-cyan-400" :
                "text-[#00ff00]"
              }`}
            >
              {line}
            </div>
          ))}

          {/* Input line */}
          {phase === "login" && (
            <div className="flex items-center mt-2">
              <span className="text-cyan-400 mr-2">
                {inputType === "username" ? "Username:" : "Password:"}
              </span>
              <form onSubmit={handleSubmit} className="flex-1 flex items-center">
                <span className="text-[#00ff00]">
                  {inputType === "password" ? "•".repeat(currentInput.length) : currentInput}
                </span>
                <span 
                  className={`w-2 h-5 bg-[#00ff00] ml-0.5 ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transition: 'opacity 0.1s' }}
                />
                <input
                  ref={inputRef}
                  type={inputType === "password" ? "password" : "text"}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="absolute opacity-0 w-0 h-0"
                  autoComplete={inputType === "username" ? "email" : "current-password"}
                  autoFocus
                />
              </form>
            </div>
          )}

          {/* Processing indicator */}
          {phase === "processing" && (
            <div className="flex items-center mt-2">
              <span className="text-cyan-400 animate-pulse">Processing</span>
              <span className="ml-1 animate-pulse">...</span>
            </div>
          )}
        </div>

        {/* Command hints */}
        {phase === "login" && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-[#00ff00]/30 p-4 z-50">
            <div className="flex flex-wrap gap-4 justify-center text-xs">
              <button 
                onClick={handleSubmit}
                className="text-[#00ff00] hover:text-white transition-colors border border-[#00ff00]/50 px-3 py-1 hover:bg-[#00ff00]/20"
              >
                [ENTER] Login
              </button>
              <button 
                onClick={handleRegister}
                disabled={inputType === "username"}
                className="text-cyan-400 hover:text-white transition-colors border border-cyan-400/50 px-3 py-1 hover:bg-cyan-400/20 disabled:opacity-50"
              >
                [TAB] Register
              </button>
              <button 
                onClick={handleForgotPassword}
                className="text-yellow-400 hover:text-white transition-colors border border-yellow-400/50 px-3 py-1 hover:bg-yellow-400/20"
              >
                [F1] Forgot Password
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Glow effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#00ff00]/5 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default Auth;

import React, { useState } from "react"
import api from "../utils/api"
import { ShieldAlert, User, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"

interface LoginProps {
  onLoginSuccess: (token: string, username: string, role: string) => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setErrorMsg("请输入用户名和密码")
      return
    }

    try {
      setLoading(true)
      setErrorMsg(null)
      setSuccessMsg(null)

      // Send login request to FastAPI backend
      const res = await api.post("/auth/login", {
        username: username.trim(),
        password: password
      })

      const { token, username: retUsername, role } = res.data
      
      setSuccessMsg("登录成功！正在进入系统...")
      
      // Delay slightly for smooth transition animation
      setTimeout(() => {
        onLoginSuccess(token, retUsername, role)
      }, 800)
    } catch (err: any) {
      console.error("Login error:", err)
      const details = err.response?.data?.detail || "无法连接到后端服务器，请确认 API 服务已启动 (http://127.0.0.1:8000)"
      setErrorMsg(details)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden px-4 select-none">
      {/* Dynamic Aesthetic Glowing Background Ambient Rings */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[90px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/8 blur-[100px] pointer-events-none" />

      {/* Main Glassmorphism Form Card */}
      <div className="w-full max-w-md bg-card/85 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-8 relative z-10 transition-all duration-300 hover:border-primary/20">
        
        {/* Branding & Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-4 animate-bounce">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">个税申报与管理中心</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Enterprise Tax Management Center (TAX-CENTER)
          </p>
        </div>

        {/* Action Status Feedbacks */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-2.5 animate-shake">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground tracking-wide block">用户名</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground pointer-events-none">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="请输入您的账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full text-sm pl-10 pr-4 py-2.5 bg-background border border-border/80 focus:border-primary/50 rounded-xl focus:outline-none transition-all placeholder:text-muted-foreground/50 disabled:opacity-50 text-foreground"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground tracking-wide block">登录密码</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground pointer-events-none">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="请输入您的密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full text-sm pl-10 pr-10 py-2.5 bg-background border border-border/80 focus:border-primary/50 rounded-xl focus:outline-none transition-all placeholder:text-muted-foreground/50 disabled:opacity-50 text-foreground font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                正在验证身份...
              </>
            ) : (
              "验证并登录"
            )}
          </button>
        </form>

        {/* Footer info & Rules */}
        <div className="mt-8 text-center border-t border-border/50 pt-5">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            密码强度要求：长度不低于 6 位，且必须包含字母和数字。<br />
            默认管理员凭据已在后台启动时自动初始化。
          </p>
        </div>
      </div>
    </div>
  )
}

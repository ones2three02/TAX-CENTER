import React, { useState, useEffect } from "react"
import "./App.css"

// Import pages
import Dashboard from "./pages/Dashboard"
import CompanyManager from "./pages/CompanyManager"
import ImportCenter from "./pages/ImportCenter"
import TaskCenter from "./pages/TaskCenter"
import EmployeeCenter from "./pages/EmployeeCenter"
import RiskCenter from "./pages/RiskCenter"
import ArchiveCenter from "./pages/ArchiveCenter"
import Login from "./pages/Login"

// Import Toast service
import { toast, type ToastEvent } from "./utils/toast"

// Import Lucide icons
import { 
  LayoutDashboard, FileSpreadsheet, Building2, Users, 
  AlertOctagon, Archive, CheckSquare, Moon, Sun, 
  LogOut, CalendarDays, CheckCircle2, AlertTriangle, Info, AlertCircle, X
} from "lucide-react"

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("tax_token"))
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem("tax_username"))
  const [role, setRole] = useState<string | null>(localStorage.getItem("tax_role"))
  
  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const [currentMonth, setCurrentMonth] = useState<string>("2026-07")
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // Toast notification state
  const [toasts, setToasts] = useState<ToastEvent[]>([])

  // Subscribe to Toast service
  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast])
      
      // Auto-remove toast after its duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      }, newToast.duration || 3000)
    })
    return unsubscribe
  }, [])

  // Initialize theme
  useEffect(() => {
    // Default to light theme per user request
    document.documentElement.classList.add("light")
    document.documentElement.classList.remove("dark")
  }, [])

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
      toast.info("已切换至白天明亮模式 ☀️")
    } else {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
      toast.info("已切换至暗黑霓虹模式 🌙")
    }
    setIsDarkMode(!isDarkMode)
  }

  const handleLoginSuccess = (userToken: string, username: string, userRole: string) => {
    localStorage.setItem("tax_token", userToken)
    localStorage.setItem("tax_username", username)
    localStorage.setItem("tax_role", userRole)
    setToken(userToken)
    setCurrentUser(username)
    setRole(userRole)
    // Delay slightly to match the page animation
    setTimeout(() => {
      toast.success(`欢迎回来，${username}！系统安全会话已建立。`)
    }, 200)
  }

  const handleLogout = () => {
    localStorage.removeItem("tax_token")
    localStorage.removeItem("tax_username")
    localStorage.removeItem("tax_role")
    setToken(null)
    setCurrentUser(null)
    setRole(null)
    toast.info("您的会话已注销，请重新登录。")
  }

  // Intercept and render Login page if not authenticated
  if (!token) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        {/* Render Toast container on login screen as well */}
        <ToastContainer toasts={toasts} setToasts={setToasts} />
      </>
    )
  }

  const menuItems = [
    { id: "dashboard", label: "看板 Dashboard", icon: LayoutDashboard },
    { id: "import", label: "大表法人拆分", icon: FileSpreadsheet },
    { id: "declare", label: "申报任务台账", icon: CheckSquare },
    { id: "employee", label: "人员税务管理", icon: Users },
    { id: "risk", label: "风险合规警报", icon: AlertOctagon },
    { id: "archive", label: "税务电子档案", icon: Archive },
    { id: "company", label: "集团公司设置", icon: Building2 },
  ]

  const monthsList = [
    "2026-07", "2026-06", "2026-05", "2026-04", 
    "2026-03", "2026-02", "2026-01"
  ]

  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard currentMonth={currentMonth} />
      case "import":
        return <ImportCenter currentMonth={currentMonth} currentUser={currentUser || "Admin"} />
      case "declare":
        return <TaskCenter currentMonth={currentMonth} currentUser={currentUser || "Admin"} />
      case "employee":
        return <EmployeeCenter currentMonth={currentMonth} />
      case "risk":
        return <RiskCenter currentMonth={currentMonth} />
      case "archive":
        return <ArchiveCenter currentMonth={currentMonth} />
      case "company":
        return <CompanyManager />
      default:
        return <Dashboard currentMonth={currentMonth} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* 1. Left Sidebar */}
      <aside className="w-64 border-r border-white/5 glass-panel flex flex-col justify-between shrink-0 animate-fade-in">
        <div className="p-6">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-lg glow-purple">
              <span className="text-white font-black text-lg tracking-wider">T</span>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-foreground m-0 uppercase">TAX-CENTER</h1>
              <span className="text-[10px] text-muted-foreground font-semibold">企业集团税务申报中心</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "bg-primary text-white shadow-md shadow-primary/20 glow-purple" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer info - Operators & Logout */}
        <div className="p-4 border-t border-white/5 bg-white/2 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 select-none">
              {currentUser ? currentUser.substring(0, 1).toUpperCase() : "财"}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate">{currentUser}</p>
              <p className="text-[9px] text-muted-foreground truncate">{role === "ADMIN" ? "系统管理员" : "财务人员"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="退出登录"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* 2. Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/95">
        
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 glass-panel px-8 flex justify-between items-center shrink-0">
          
          {/* Breadcrumb info */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted-foreground font-medium">集团税务共享</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold capitalize">{activeTab}</span>
          </div>

          {/* Controls: Month Select & Theme Toggle */}
          <div className="flex items-center space-x-4">
            
            {/* Monthly Dropdown Selector */}
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">申报期:</span>
              <div className="relative">
                <select
                  value={currentMonth}
                  onChange={(e) => {
                    setCurrentMonth(e.target.value)
                    toast.success(`切换当前申报期为: ${e.target.value}`)
                  }}
                  className="bg-transparent border-0 text-xs font-bold text-foreground focus:outline-none pr-4 cursor-pointer"
                >
                  {monthsList.map(m => (
                    <option key={m} value={m} className="bg-card text-foreground">{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="切换主题"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Content Pane - Includes automatic page slide/fade transition key */}
        <div key={activeTab} className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {renderActivePage()}
        </div>
      </main>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastEvent[]
  setToasts: React.Dispatch<React.SetStateAction<ToastEvent[]>>
}

function ToastContainer({ toasts, setToasts }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => {
        const config = {
          success: { bg: "bg-green-500/10 dark:bg-green-500/5 border-green-500/30 text-green-700 dark:text-green-400", icon: CheckCircle2 },
          error: { bg: "bg-destructive/10 dark:bg-destructive/5 border-destructive/30 text-destructive", icon: AlertCircle },
          warning: { bg: "bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-400", icon: AlertTriangle },
          info: { bg: "bg-primary/10 dark:bg-primary/5 border-primary/30 text-primary-foreground dark:text-primary", icon: Info },
        }[t.type] || { bg: "bg-card border-border text-foreground", icon: Info }
        
        const Icon = config.icon
        
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-in ${config.bg}`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="text-xs font-semibold leading-relaxed truncate-2-lines">{t.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="ml-4 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

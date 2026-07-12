import React, { useEffect, useState } from "react"
import api from "../utils/api"
import { AlertOctagon, CheckCircle2, ShieldCheck, EyeOff, AlertCircle } from "lucide-react"

interface RiskAlert {
  id: number
  month: string
  company_name: string
  alert_type: string
  alert_level: string
  message: string
  status: string
  created_at: string
}

interface RiskCenterProps {
  currentMonth: string
}

export default function RiskCenter({ currentMonth }: RiskCenterProps) {
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchAlerts() {
    try {
      setLoading(true)
      const res = await api.get(`/risk/alerts?month=${currentMonth}`)
      setAlerts(res.data)
    } catch (err) {
      console.error("加载风险警告失败:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [currentMonth])

  const handleResolve = async (id: number, status: "RESOLVED" | "IGNORED") => {
    try {
      await api.put(`/risk/alerts/${id}/resolve`, { status })
      fetchAlerts()
    } catch (err) {
      alert("处理失败")
    }
  }

  const runRiskCheck = async () => {
    try {
      setLoading(true)
      await api.post(`/risk/check?month=${currentMonth}`)
      fetchAlerts()
    } catch (err) {
      alert("执行风险检测失败")
      setLoading(false)
    }
  }

  const unresolvedAlerts = alerts.filter(a => a.status === "UNRESOLVED")
  const resolvedAlerts = alerts.filter(a => a.status !== "UNRESOLVED")

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center space-x-2">
            <AlertOctagon className="h-5 w-5 text-destructive-foreground" />
            <span>税务风险智能检查中心</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">自动分析工资及个税申报合理性，防范漏申报、错误申报及离职发薪漏洞</p>
        </div>
        <button
          onClick={runRiskCheck}
          disabled={loading}
          className="bg-primary hover:bg-primary/95 text-white font-medium text-xs py-2 px-4 rounded-xl shadow-lg glow-purple transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          立即执行检测
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active alerts */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">待核查警告 ({unresolvedAlerts.length})</h3>
            
            {unresolvedAlerts.length === 0 ? (
              <div className="glass-panel p-10 rounded-2xl text-center flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-green-500/10 text-green-400 rounded-full">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">未检测到税务风险</p>
                  <p className="text-xs text-muted-foreground mt-1">所有工资数据与人员状态均处于合规范围</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {unresolvedAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`glass-panel p-5 rounded-2xl border-l-4 flex justify-between items-start transition-all ${
                      alert.alert_level === "ERROR" ? "border-l-red-500" : "border-l-yellow-500"
                    }`}
                  >
                    <div className="space-y-1.5 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-foreground text-xs">{alert.company_name}</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          alert.alert_level === "ERROR" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {alert.alert_level === "ERROR" ? "高风险" : "中风险"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                      <p className="text-[10px] text-muted-foreground/50">检测时间: {new Date(alert.created_at).toLocaleString()}</p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolve(alert.id, "RESOLVED")}
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-400 p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-green-500/20 transition-all cursor-pointer"
                        title="已核对"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">已核对</span>
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id, "IGNORED")}
                        className="bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground p-2 rounded-lg text-xs border border-white/5 transition-all cursor-pointer"
                        title="忽略警告"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">忽略</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History / Resolved alerts */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">已处理记录</h3>
            <div className="glass-panel p-4 rounded-2xl space-y-3 h-fit max-h-[500px] overflow-y-auto pr-1">
              {resolvedAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic text-center py-6">暂无已处理记录</p>
              ) : (
                resolvedAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-white/2 rounded-xl border border-white/5 text-xs space-y-1.5 opacity-60">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">{alert.company_name}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {alert.status === "RESOLVED" ? "已核实" : "已忽略"}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-normal">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

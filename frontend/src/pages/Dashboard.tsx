import React, { useEffect, useState } from "react"
import api from "../utils/api"
import { 
  Building2, Users, Receipt, AlertTriangle, CheckCircle, 
  ArrowUpRight, TrendingUp, HelpCircle 
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts"

interface OverviewData {
  total_companies: int
  filed_companies: int
  unfiled_companies: int
  total_tax_amount: number
  total_headcount: number
  active_risk_alerts: int
  completion_rate: number
  month: string
}

interface DashboardProps {
  currentMonth: string
}

export default function Dashboard({ currentMonth }: DashboardProps) {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true)
        const res = await api.get(`/dashboard/overview?month=${currentMonth}`)
        setOverview(res.data)
        
        // Mocking/Simulating monthly trend for Recharts
        const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月"]
        const amountMapping: Record<string, number> = {
          "1月": 300000, "2月": 280000, "3月": 320000, "4月": 450000,
          "5月": 470000, "6月": 490000, "7月": res.data.total_tax_amount || 500000
        }
        
        const trend = months.map(m => ({
          name: m,
          "税额 (元)": amountMapping[m],
          "申报人数": 1000 + Math.floor(Math.random() * 200)
        }))
        setChartData(trend)
      } catch (err) {
        console.error("加载首页看板数据失败:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOverview()
  }, [currentMonth])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const kpis = [
    {
      title: "集团法人企业",
      value: overview?.total_companies || 0,
      sub: "活跃税务主体",
      icon: Building2,
      color: "from-blue-500/20 to-cyan-500/20 text-blue-400",
    },
    {
      title: "申报进度",
      value: `${overview?.filed_companies || 0} / ${overview?.total_companies || 0}`,
      sub: `完成率 ${overview?.completion_rate || 0}%`,
      icon: CheckCircle,
      color: "from-green-500/20 to-emerald-500/20 text-green-400",
    },
    {
      title: "应纳个税总额",
      value: `¥${(overview?.total_tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      sub: "集团汇总税额",
      icon: Receipt,
      color: "from-purple-500/20 to-indigo-500/20 text-purple-400",
    },
    {
      title: "本月申报人头",
      value: overview?.total_headcount || 0,
      sub: "在册算税员工",
      icon: Users,
      color: "from-amber-500/20 to-orange-500/20 text-amber-400",
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Risk Notification Banner */}
      {overview && overview.active_risk_alerts > 0 && (
        <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-xl glow-purple animate-pulse">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
            <div>
              <p className="font-semibold text-sm text-foreground">发现 {overview.active_risk_alerts} 项税务合规风险</p>
              <p className="text-xs text-muted-foreground">包含离职员工发薪或薪资波动异常，请立即前往“风险检查”查看明细。</p>
            </div>
          </div>
          <button className="text-xs font-semibold hover:underline flex items-center space-x-1 text-primary">
            <span>立即处理</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div 
            key={idx} 
            className="glass-panel p-6 rounded-2xl hover:scale-[1.02] transition-all duration-300 hover:shadow-xl relative overflow-hidden group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                <h3 className="text-2xl font-bold mt-2 tracking-tight">{kpi.value}</h3>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            {/* Hover Background Accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">个税申报趋势</h3>
              <p className="text-xs text-muted-foreground">集团各月应纳个税额及报税人头变化</p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>本期呈稳步上升趋势</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(17,17,22,0.9)", 
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff"
                  }} 
                />
                <Area type="monotone" dataKey="税额 (元)" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorTax)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Declaration Status circular-like gauge */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">本月任务清单进度</h3>
            <p className="text-xs text-muted-foreground">包含20家公司报税、扣款等流程跟进</p>
          </div>
          
          <div className="flex flex-col items-center justify-center my-6 space-y-4">
            {/* Dial Representation */}
            <div className="relative flex items-center justify-center">
              {/* Simple CSS Circular indicator */}
              <svg className="w-36 h-36 transform -rotate-90">
                <circle 
                  cx="72" cy="72" r="60" 
                  stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" 
                />
                <circle 
                  cx="72" cy="72" r="60" 
                  stroke="#8b5cf6" strokeWidth="12" fill="transparent" 
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * (overview?.completion_rate || 0)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-foreground">{overview?.completion_rate || 0}%</span>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">申报完成率</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                已完成 {overview?.filed_companies || 0} 家，待处理 {overview?.unfiled_companies || 0} 家
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs text-muted-foreground">
            <span className="flex items-center space-x-1">
              <HelpCircle className="h-3 w-3" />
              <span>本期计算截止至月末</span>
            </span>
            <span className="text-primary hover:underline cursor-pointer">管理任务</span>
          </div>
        </div>
      </div>
    </div>
  )
}

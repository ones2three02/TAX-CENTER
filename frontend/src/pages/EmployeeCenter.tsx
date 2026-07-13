import React, { useEffect, useState } from "react"
import api from "../utils/api"
import { Users, Search, RefreshCw, UserCheck, UserMinus, ArrowLeftRight } from "lucide-react"

interface Employee {
  id: number
  company_name: string
  name: string
  id_card: string
  employee_status: string
  phone: string | null
}

interface ChangeDetail {
  name: string
  id_card: string
  phone: string | null
  company_name: string
  change_type: string
  details: string | null
}

interface ChangesResponse {
  month: string
  compare_month: string
  new_hires: ChangeDetail[]
  resigned: ChangeDetail[]
  transferred: ChangeDetail[]
  total_new_hires: number
  total_resigned: number
  total_transferred: number
}

interface EmployeeCenterProps {
  currentMonth: string
}

export default function EmployeeCenter({ currentMonth }: EmployeeCenterProps) {
  const [activeTab, setActiveTab] = useState<"list" | "compare">("compare")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [changes, setChanges] = useState<ChangesResponse | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  async function fetchEmployees() {
    try {
      setLoading(true)
      const res = await api.get("/employees")
      setEmployees(res.data)
    } catch (err) {
      console.error("加载人员失败:", err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchChanges() {
    try {
      setLoading(true)
      const res = await api.get(`/employees/changes?month=${currentMonth}`)
      setChanges(res.data)
    } catch (err) {
      console.error("加载变动数据失败:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "list") {
      fetchEmployees()
    } else {
      fetchChanges()
    }
  }, [activeTab, currentMonth])

  const filteredEmployees = employees.filter(emp => 
    emp.name.includes(searchQuery) || emp.id_card.includes(searchQuery)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>人员税务管理中心</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">管理报税员工档案，并自动分析本月较上月的人员流转状态</p>
        </div>
        
        {/* Tab Selector */}
        <div className="bg-white/5 p-1 rounded-xl flex space-x-1 border border-white/5">
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "compare" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
            }`}
          >
            本月变动分析
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
            }`}
          >
            在册花名册
          </button>
        </div>
      </div>

      {activeTab === "list" ? (
        // 花名册 Tab
        <div className="space-y-4">
          <div className="flex items-center space-x-3 glass-panel px-4 py-2 rounded-xl max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索姓名或身份证号..."
              className="bg-transparent border-0 text-sm focus:outline-none w-full text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          {loading ? (
            <div className="glass-panel border border-border rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="grid grid-cols-5 gap-4 pb-4 border-b border-border">
                <div className="h-4 bg-muted/40 rounded-md"></div>
                <div className="h-4 bg-muted/40 rounded-md col-span-2"></div>
                <div className="h-4 bg-muted/40 rounded-md"></div>
                <div className="h-4 bg-muted/40 rounded-md text-right"></div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b border-border/50 last:border-0">
                  <div className="h-3.5 bg-muted/20 rounded-md"></div>
                  <div className="h-3.5 bg-muted/20 rounded-md col-span-2"></div>
                  <div className="h-3.5 bg-muted/20 rounded-md"></div>
                  <div className="h-3.5 bg-muted/20 rounded-md text-right"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel border border-border rounded-2xl overflow-y-auto max-h-[calc(100vh-320px)] relative shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-bold text-foreground uppercase tracking-wider sticky top-0 bg-card z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                    <th className="py-3 px-6 sticky top-0 bg-card border-b border-border">姓名</th>
                    <th className="py-3 px-6 sticky top-0 bg-card border-b border-border">身份证号</th>
                    <th className="py-3 px-6 sticky top-0 bg-card border-b border-border">所属分公司</th>
                    <th className="py-3 px-6 sticky top-0 bg-card border-b border-border">状态</th>
                    <th className="py-3 px-6 text-right sticky top-0 bg-card border-b border-border">联系方式</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 px-6 text-center text-muted-foreground">
                        未匹配到人员记录
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-foreground">{emp.name}</td>
                        <td className="py-3.5 px-6 font-mono text-muted-foreground">{emp.id_card}</td>
                        <td className="py-3.5 px-6">{emp.company_name}</td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            emp.employee_status === "在职" 
                              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {emp.employee_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-muted-foreground">{emp.phone || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // 变动分析 Tab
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-[40vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : !changes || (changes.total_new_hires === 0 && changes.total_resigned === 0 && changes.total_transferred === 0) ? (
            <div className="glass-panel p-10 rounded-2xl text-center text-muted-foreground">
              <p>暂无本月与上月的人员变动数据。</p>
              <p className="text-xs text-muted-foreground/60 mt-1">请确保已导入本月和上月的工资表以供系统对比分析。</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-green-500">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">本月新入职人头</span>
                    <UserCheck className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold mt-2 text-foreground">+{changes.total_new_hires}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">相较于 {changes.compare_month} 增加</p>
                </div>

                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-red-500">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">本月减员人头</span>
                    <UserMinus className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold mt-2 text-foreground">-{changes.total_resigned}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">相较于 {changes.compare_month} 减少</p>
                </div>

                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-yellow-500">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">跨分公司调动</span>
                    <ArrowLeftRight className="h-5 w-5 text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-bold mt-2 text-foreground">{changes.total_transferred}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">跨法人主体转移人员</p>
                </div>
              </div>

              {/* Detailed Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* New Hires */}
                <div className="glass-panel p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-green-400 flex items-center space-x-1.5 pb-2 border-b border-white/5">
                    <UserCheck className="h-4 w-4" />
                    <span>入职新进名单 (+{changes.total_new_hires})</span>
                  </h4>
                  <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
                    {changes.new_hires.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/60 italic py-4 text-center">无新增员工</p>
                    ) : (
                      changes.new_hires.map((emp, i) => (
                        <div key={i} className="p-3 bg-white/2 rounded-xl border border-white/5 hover:border-white/10 transition-all text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-foreground">{emp.name}</span>
                            <span className="text-muted-foreground font-mono">{emp.id_card.slice(-4)}</span>
                          </div>
                          <p className="text-muted-foreground mt-1.5">{emp.company_name}</p>
                          <p className="text-[10px] text-green-400/80 mt-1">{emp.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Resigned */}
                <div className="glass-panel p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-red-400 flex items-center space-x-1.5 pb-2 border-b border-white/5">
                    <UserMinus className="h-4 w-4" />
                    <span>离职减员名单 (-{changes.total_resigned})</span>
                  </h4>
                  <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
                    {changes.resigned.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/60 italic py-4 text-center">无离职减员</p>
                    ) : (
                      changes.resigned.map((emp, i) => (
                        <div key={i} className="p-3 bg-white/2 rounded-xl border border-white/5 hover:border-white/10 transition-all text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-foreground">{emp.name}</span>
                            <span className="text-muted-foreground font-mono">{emp.id_card.slice(-4)}</span>
                          </div>
                          <p className="text-muted-foreground mt-1.5">{emp.company_name}</p>
                          <p className="text-[10px] text-red-400/80 mt-1">{emp.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Transferred */}
                <div className="glass-panel p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-yellow-400 flex items-center space-x-1.5 pb-2 border-b border-white/5">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>法人调动名单 ({changes.total_transferred})</span>
                  </h4>
                  <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
                    {changes.transferred.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/60 italic py-4 text-center">无调动记录</p>
                    ) : (
                      changes.transferred.map((emp, i) => (
                        <div key={i} className="p-3 bg-white/2 rounded-xl border border-white/5 hover:border-white/10 transition-all text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-foreground">{emp.name}</span>
                            <span className="text-muted-foreground font-mono">{emp.id_card.slice(-4)}</span>
                          </div>
                          <p className="text-[10px] text-yellow-400/90 mt-2 leading-normal">{emp.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

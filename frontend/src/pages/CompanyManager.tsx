import React, { useEffect, useState } from "react"
import api from "../utils/api"
import { Building2, Plus, Edit2, Check, X, ShieldAlert, Sparkles, Search } from "lucide-react"
import { toast } from "../utils/toast"

interface Company {
  id: number
  company_code: string | null
  company_name: string
  tax_number: string | null
  credit_code: string | null
  bank_name: string | null
  bank_account: string | null
  status: string
  created_at: string
}

export default function CompanyManager() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  
  // Form fields
  const [companyName, setCompanyName] = useState("")
  const [taxNumber, setTaxNumber] = useState("")
  const [creditCode, setCreditCode] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [status, setStatus] = useState("ACTIVE")

  async function fetchCompanies() {
    try {
      setLoading(true)
      const res = await api.get("/companies")
      setCompanies(res.data)
    } catch (err) {
      console.error("获取公司列表失败:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const openAddModal = () => {
    setEditingCompany(null)
    setCompanyName("")
    setTaxNumber("")
    setCreditCode("")
    setBankName("")
    setBankAccount("")
    setStatus("ACTIVE")
    setShowModal(true)
  }

  const openEditModal = (comp: Company) => {
    setEditingCompany(comp)
    setCompanyName(comp.company_name)
    setTaxNumber(comp.tax_number || "")
    setCreditCode(comp.credit_code || "")
    setBankName(comp.bank_name || "")
    setBankAccount(comp.bank_account || "")
    setStatus(comp.status)
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      toast.warning("公司名称不能为空")
      return
    }

    const payload = {
      company_name: companyName,
      tax_number: taxNumber || null,
      credit_code: creditCode || null,
      bank_name: bankName || null,
      bank_account: bankAccount || null,
      status
    }

    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, payload)
      } else {
        await api.post("/companies", payload)
      }
      toast.success(editingCompany ? "修改法人主体信息成功！" : "添加新法人公司成功！")
      setShowModal(false)
      fetchCompanies()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "保存失败")
    }
  }

  const toggleCompanyStatus = async (comp: Company) => {
    const nextStatus = comp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await api.put(`/companies/${comp.id}`, { status: nextStatus })
      toast.success(`已成功${nextStatus === "ACTIVE" ? "启用" : "停用"}法人公司 [${comp.company_name}]`)
      fetchCompanies()
    } catch (err) {
      toast.error("更新状态失败")
    }
  }

  const filteredCompanies = companies.filter(comp => 
    comp.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (comp.credit_code && comp.credit_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (comp.tax_number && comp.tax_number.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span>集团企业管理</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">管理集团旗下的各个独立法人公司及银行、税务主体参数</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-primary hover:bg-primary/90 text-white font-medium text-sm py-2.5 px-4 rounded-xl flex items-center space-x-2 shadow-lg glow-purple transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>新增法人公司</span>
        </button>
      </div>

      {/* Search Filter Toolbar */}
      <div className="flex items-center space-x-2 bg-card border border-border p-3.5 rounded-2xl w-full max-w-md shadow-sm">
        <Search className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="搜索法人公司名称、税号、信用代码..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent border-0 text-foreground focus:outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {loading ? (
        <div className="glass-panel border border-border rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="grid grid-cols-6 gap-4 pb-4 border-b border-border">
            <div className="h-4 bg-muted/40 rounded-md col-span-2"></div>
            <div className="h-4 bg-muted/40 rounded-md"></div>
            <div className="h-4 bg-muted/40 rounded-md"></div>
            <div className="h-4 bg-muted/40 rounded-md"></div>
            <div className="h-4 bg-muted/40 rounded-md text-right"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 py-3 border-b border-border/50 last:border-0">
              <div className="h-3.5 bg-muted/20 rounded-md col-span-2"></div>
              <div className="h-3.5 bg-muted/20 rounded-md"></div>
              <div className="h-3.5 bg-muted/20 rounded-md"></div>
              <div className="h-3.5 bg-muted/20 rounded-md"></div>
              <div className="h-3.5 bg-muted/20 rounded-md text-right"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="glass-panel border border-border rounded-2xl overflow-y-auto max-h-[calc(100vh-280px)] relative shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-bold text-foreground uppercase tracking-wider sticky top-0 bg-card z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                  <th className="py-4 px-6 sticky top-0 bg-card border-b border-border">法人公司名称</th>
                  <th className="py-4 px-6 sticky top-0 bg-card border-b border-border">统一社会信用代码</th>
                  <th className="py-4 px-6 sticky top-0 bg-card border-b border-border">纳税人识别号</th>
                  <th className="py-4 px-6 sticky top-0 bg-card border-b border-border">开户银行及账号</th>
                  <th className="py-4 px-6 sticky top-0 bg-card border-b border-border">状态</th>
                  <th className="py-4 px-6 text-right sticky top-0 bg-card border-b border-border">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-6 text-center text-muted-foreground">
                      {searchQuery ? "未匹配到任何法人公司" : "暂无法人企业数据，请点击右上角新增"}
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((comp) => (
                    <tr key={comp.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-4 px-6 font-semibold text-foreground">{comp.company_name}</td>
                      <td className="py-4 px-6 font-mono text-muted-foreground">{comp.credit_code || "-"}</td>
                      <td className="py-4 px-6 font-mono text-muted-foreground">{comp.tax_number || "-"}</td>
                      <td className="py-4 px-6">
                        {comp.bank_name ? (
                          <div className="space-y-0.5">
                            <p className="text-foreground text-xs font-semibold">{comp.bank_name}</p>
                            <p className="text-muted-foreground font-mono text-[10px]">{comp.bank_account}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => toggleCompanyStatus(comp)}
                          className={`inline-flex items-center space-x-1.5 py-1 px-2.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            comp.status === "ACTIVE" 
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" 
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${comp.status === "ACTIVE" ? "bg-green-500" : "bg-muted-foreground"}`} />
                          <span>{comp.status === "ACTIVE" ? "启用" : "禁用"}</span>
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => openEditModal(comp)}
                          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                          title="修改信息"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Statistics */}
          <div className="text-[11px] text-muted-foreground px-2 flex justify-between items-center select-none font-medium">
            <span>共筛选出 {filteredCompanies.length} 家法人企业（总计 {companies.length} 家）</span>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-primary hover:underline text-xs cursor-pointer font-semibold"
              >
                清除搜索
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-up border border-border flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <h3 className="font-bold text-foreground text-base">
                  {editingCompany ? "修改法人主体信息" : "添加新法人公司"}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[60vh] pr-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">法人公司名称 *</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="如: 武汉山道文化传播有限公司"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">统一社会信用代码</label>
                    <input 
                      type="text" 
                      value={creditCode}
                      onChange={(e) => setCreditCode(e.target.value)}
                      placeholder="18位信用代码"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">纳税人识别号</label>
                    <input 
                      type="text" 
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      placeholder="纳税申报税号"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">开户银行</label>
                    <input 
                      type="text" 
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="如: 招商银行武汉光谷支行"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">银行账号</label>
                    <input 
                      type="text" 
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="银行转账主账号"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">运行状态</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 text-sm text-foreground cursor-pointer">
                      <input 
                        type="radio" 
                        name="modalStatus" 
                        value="ACTIVE"
                        checked={status === "ACTIVE"}
                        onChange={() => setStatus("ACTIVE")}
                        className="text-primary focus:ring-primary bg-transparent border-white/10"
                      />
                      <span>启用</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-foreground cursor-pointer">
                      <input 
                        type="radio" 
                        name="modalStatus" 
                        value="INACTIVE"
                        checked={status === "INACTIVE"}
                        onChange={() => setStatus("INACTIVE")}
                        className="text-primary focus:ring-primary bg-transparent border-white/10"
                      />
                      <span>停用</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 p-6 border-t border-border bg-card shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-foreground font-medium text-sm py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white font-medium text-sm py-2 px-5 rounded-xl shadow-lg glow-purple transition-all cursor-pointer"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

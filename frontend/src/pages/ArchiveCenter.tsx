import React, { useEffect, useState } from "react"
import api from "../utils/api"
import { Archive as ArchiveIcon, Search, Eye, Download, Image as ImageIcon, FileSpreadsheet, Layers } from "lucide-react"

interface Archive {
  id: number
  company_name: string
  month: string
  archive_type: string
  file_name: string
  file_path: string
  uploaded_at: string
}

interface Company {
  id: number
  company_name: string
}

interface ArchiveCenterProps {
  currentMonth: string
}

const typeMapping: Record<string, { label: string; color: string }> = {
  PAYROLL_FILE: { label: "原始大表", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  EXCEL_TEMPLATE: { label: "个税申报表", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  DECLARE_SCREENSHOT: { label: "申报截图", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  RECEIPT_FILE: { label: "申报回执", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  PAYMENT_VOUCHER: { label: "扣款凭证", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
}

export default function ArchiveCenter({ currentMonth }: ArchiveCenterProps) {
  const [archives, setArchives] = useState<Archive[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [filterCompany, setFilterCompany] = useState("")
  const [filterType, setFilterType] = useState("")

  async function fetchInitData() {
    try {
      setLoading(true)
      const [archivesRes, compRes] = await Promise.all([
        api.get(`/archive?month=${currentMonth}`),
        api.get("/companies")
      ])
      setArchives(archivesRes.data)
      setCompanies(compRes.data)
    } catch (err) {
      console.error("加载档案中心失败:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitData()
  }, [currentMonth])

  const getFileUrl = (filePath: string) => {
    const idx = filePath.indexOf('/uploads/')
    if (idx !== -1) {
      return `http://localhost:8000${filePath.substring(idx)}`
    }
    // Fallback split
    const parts = filePath.split('/')
    const name = parts[parts.length - 1]
    const subFolder = filePath.includes('/exports/') ? 'exports' : 'archives'
    return `http://localhost:8000/uploads/${subFolder}/${currentMonth}/${name}`
  }

  const filteredArchives = archives.filter(arc => {
    const matchCompany = filterCompany ? String(arc.company_name) === filterCompany : true
    const matchType = filterType ? arc.archive_type === filterType : true
    return matchCompany && matchType
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center space-x-2">
          <ArchiveIcon className="h-5 w-5 text-primary" />
          <span>税务电子档案中心</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">按月、按法人公司归档个税大表、税局申报模版、回执单及缴款凭证，永久可查</p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 glass-panel p-4 rounded-xl items-center">
        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase">筛选法人主体</label>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
          >
            <option value="" className="bg-card">全部公司</option>
            {companies.map(c => (
              <option key={c.id} value={c.company_name} className="bg-card">{c.company_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase">筛选档案类型</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
          >
            <option value="" className="bg-card">全部类型</option>
            <option value="PAYROLL_FILE" className="bg-card">原始大表</option>
            <option value="EXCEL_TEMPLATE" className="bg-card">个税申报表</option>
            <option value="DECLARE_SCREENSHOT" className="bg-card">申报截图</option>
            <option value="RECEIPT_FILE" className="bg-card">申报回执</option>
            <option value="PAYMENT_VOUCHER" className="bg-card">扣款凭证</option>
          </select>
        </div>

        <div className="flex h-full items-end pt-3 md:pt-0 justify-end">
          <button 
            onClick={fetchInitData}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold py-1.5 px-4 rounded-lg text-foreground transition-all cursor-pointer"
          >
            刷新档案库
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArchives.length === 0 ? (
            <div className="col-span-full glass-panel p-12 text-center text-muted-foreground rounded-2xl">
              暂无匹配的电子档案文件。
              <p className="text-xs text-muted-foreground/60 mt-1">您可在申报任务台账中上传申报截图或回执来生成档案记录。</p>
            </div>
          ) : (
            filteredArchives.map((arc) => {
              const tm = typeMapping[arc.archive_type] || { label: "未知档案", color: "bg-muted text-muted-foreground border-white/5" }
              const isImage = arc.file_name.toLowerCase().endsWith(".png") || 
                              arc.file_name.toLowerCase().endsWith(".jpg") || 
                              arc.file_name.toLowerCase().endsWith(".jpeg")
              
              return (
                <div 
                  key={arc.id}
                  className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-all group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-foreground text-xs truncate max-w-[70%]">{arc.company_name}</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold border ${tm.color}`}>
                        {tm.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-white/2 rounded-xl border border-white/5">
                      {isImage ? (
                        <ImageIcon className="h-8 w-8 text-emerald-400 shrink-0" />
                      ) : (
                        <FileSpreadsheet className="h-8 w-8 text-purple-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate" title={arc.file_name}>
                          {arc.file_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">归档月: {arc.month}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-[10px] text-muted-foreground">
                    <span>{new Date(arc.uploaded_at).toLocaleDateString()} 归档</span>
                    
                    <div className="flex space-x-2">
                      <a 
                        href={getFileUrl(arc.file_path)}
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-foreground rounded-lg transition-all cursor-pointer"
                        title="查看原图/文件"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                      <a 
                        href={getFileUrl(arc.file_path)}
                        download={arc.file_name}
                        className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all cursor-pointer"
                        title="直接下载"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

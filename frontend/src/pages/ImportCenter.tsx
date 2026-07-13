import React, { useEffect, useState, useRef } from "react"
import api from "../utils/api"
import { FileSpreadsheet, Upload, History, CheckCircle, AlertCircle, RefreshCw, HelpCircle, X } from "lucide-react"
import { toast } from "../utils/toast"

interface Batch {
  id: number
  filename: string
  month: string
  total_rows: number
  valid_rows: number
  status: string
  operator: string
  ignored_records: string | null
  created_at: string
}

interface ImportCenterProps {
  currentMonth: string
  currentUser?: string
}

export default function ImportCenter({ currentMonth, currentUser }: ImportCenterProps) {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  
  // Upload States
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  // Results Notification
  const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null)
  
  // Ignored Modal States
  const [showIgnoredModal, setShowIgnoredModal] = useState(false)
  const [selectedIgnoredList, setSelectedIgnoredList] = useState<any[]>([])
  const [selectedBatchName, setSelectedBatchName] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchHistory() {
    try {
      setLoadingHistory(true)
      const res = await api.get("/import/batches")
      setBatches(res.data)
    } catch (err) {
      console.error("加载导入历史失败:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const ext = droppedFile.name.split('.').pop()?.toLowerCase()
      if (ext === 'xlsx' || ext === 'xls') {
        setFile(droppedFile)
        setResult(null)
      } else {
        setResult({ type: "error", msg: "仅支持 .xlsx 或 .xls 格式的 Excel 工资表" })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!file) return
    
    const formData = new FormData()
    formData.append("file", file)
    formData.append("month", currentMonth)
    formData.append("operator", currentUser || "集团财务主管")
    
    try {
      setUploading(true)
      setResult(null)
      const res = await api.post("/import/payroll", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      
      const batchData = res.data
      const ignoredCount = getIgnoredCount(batchData.ignored_records)
      
      let successMsg = `成功导入工资表！解析 ${batchData.total_rows} 条记录，成功入库 ${batchData.valid_rows} 人并按法人自动分流！`
      if (ignoredCount > 0) {
        successMsg += ` 检测到 Excel 中有 ${ignoredCount} 行被标记为红色背景，系统已按合规规则自动忽略导入（详见下方导入日志）。`
      }
      
      setResult({
        type: "success",
        msg: successMsg
      })
      setFile(null)
      fetchHistory()
      toast.success("个税大表分流解析完成！")
    } catch (err: any) {
      console.error("上传失败详情:", err)
      const errMsg = err.response?.data?.detail || 
                    (err.message === "Network Error" ? "与后端服务器连接失败，可能服务正在重启，请等待几秒后重试 (http://127.0.0.1:8000)" : err.message) || 
                    "文件解析出错，请核对表头列名格式（需包含姓名、身份证、分公司）"
      setResult({
        type: "error",
        msg: errMsg
      })
      toast.error("大表导入失败")
    } finally {
      setUploading(false)
    }
  }

  const getIgnoredCount = (ignoredRecordsStr: string | null | undefined) => {
    if (!ignoredRecordsStr) return 0
    try {
      const list = JSON.parse(ignoredRecordsStr)
      return Array.isArray(list) ? list.length : 0
    } catch (e) {
      return 0
    }
  }

  const openIgnoredModal = (batch: Batch) => {
    if (!batch.ignored_records) return
    try {
      const list = JSON.parse(batch.ignored_records)
      if (Array.isArray(list)) {
        setSelectedIgnoredList(list)
        setSelectedBatchName(batch.filename)
        setShowIgnoredModal(true)
      }
    } catch (e) {
      console.error("解析忽略记录失败:", e)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <span>个税大表导入与法人拆分</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          上传集团工资汇总表（如包含多家分公司的主大表），系统将按照“分公司”列**自动拆分**并在各法人名下生成个税申报任务
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2 space-y-4">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`glass-panel p-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all min-h-[300px] ${
              dragActive ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20"
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="p-4 bg-primary/10 rounded-full mb-4 text-primary glow-purple">
              <Upload className="h-8 w-8" />
            </div>

            {file ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">大小: {(file.size / 1024).toFixed(1)} KB</p>
                
                <div className="flex justify-center space-x-3 pt-2">
                  <button 
                    onClick={() => setFile(null)}
                    disabled={uploading}
                    className="bg-white/5 hover:bg-white/10 text-xs font-semibold py-1.5 px-3 rounded-lg text-foreground disabled:opacity-50 cursor-pointer"
                  >
                    重新选择
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-primary hover:bg-primary/95 text-xs font-semibold py-1.5 px-4 rounded-lg text-white flex items-center space-x-1.5 shadow-lg glow-purple disabled:opacity-50 cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>自动解析拆分中...</span>
                      </>
                    ) : (
                      <span>开始拆分</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-foreground font-medium">
                  拖拽集团工资 Excel 文件至此，或{" "}
                  <span 
                    onClick={triggerFileSelect} 
                    className="text-primary hover:underline cursor-pointer font-semibold"
                  >
                    点击上传
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">支持格式: .xlsx, .xls</p>
                <div className="pt-2 text-xs text-muted-foreground/60 max-w-sm mx-auto flex items-start space-x-1.5 justify-center">
                  <HelpCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-0.5" />
                  <p className="text-left">
                    表头必须包含“分公司”（对应法人公司）、“姓名”、“身份证号”、“报税工资”列。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Results Alert */}
          {result && (
            <div className={`p-4 rounded-xl flex items-start space-x-3 border ${
              result.type === "success" 
                ? "bg-green-500/10 border-green-500/20 text-green-400" 
                : "bg-destructive/10 border-destructive/20 text-destructive-foreground"
            }`}>
              {result.type === "success" ? (
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold">{result.type === "success" ? "操作成功" : "导入失败"}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{result.msg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions Sidecard */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 h-fit">
          <h3 className="text-sm font-semibold text-foreground">大表法人自动拆分说明</h3>
          <div className="text-xs space-y-3 text-muted-foreground leading-relaxed">
            <div className="space-y-1">
              <span className="text-foreground font-medium">1. 所属月份关联</span>
              <p>导入时系统会自动解析对应月份的 Sheet（如 '7月' 对应 2026-07 批次）。并在后台建立工资档案副本。</p>
            </div>
            <div className="space-y-1">
              <span className="text-foreground font-medium">2. 自动建档与注册</span>
              <p>如果 Excel 中出现的“分公司”在系统里未录入，系统将自动创建该法人；如果出现的身份证号为新进员工，将自动归入人员名录。</p>
            </div>
            <div className="space-y-1">
              <span className="text-foreground font-medium">3. 标红特殊项自动忽略</span>
              <p className="text-amber-400 font-medium">如果 Excel 数据行中，员工“姓名”单元格被填充为红色背景，系统将自动标记该行为排除项，直接忽略导入并提供详细日志供您核对。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Import History Table */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center space-x-2">
          <History className="h-4 w-4 text-primary" />
          <span>数据导入日志</span>
        </h3>
        
        {loadingHistory ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[40vh] border border-border rounded-xl relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-bold text-foreground uppercase tracking-wider sticky top-0 bg-card z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                  <th className="py-3 px-4 sticky top-0 bg-card border-b border-border">原始文件名</th>
                  <th className="py-3 px-4 sticky top-0 bg-card border-b border-border">申报月份</th>
                  <th className="py-3 px-4 sticky top-0 bg-card border-b border-border">解析总行数</th>
                  <th className="py-3 px-4 sticky top-0 bg-card border-b border-border">成功入库</th>
                  <th className="py-3 px-4 sticky top-0 bg-card border-b border-border">标红忽略人头</th>
                  <th className="py-3 px-4 sticky top-0 bg-card border-b border-border">操作人</th>
                  <th className="py-3 px-4 sticky top-0 bg-card border-b border-border">状态</th>
                  <th className="py-3 px-4 text-right sticky top-0 bg-card border-b border-border">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 px-4 text-center text-muted-foreground">
                      暂无导入历史记录
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => {
                    const ignoredCount = getIgnoredCount(batch.ignored_records)
                    return (
                      <tr key={batch.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground max-w-[180px] truncate" title={batch.filename}>
                          {batch.filename}
                        </td>
                        <td className="py-3 px-4 font-semibold text-primary">{batch.month}</td>
                        <td className="py-3 px-4">{batch.total_rows}</td>
                        <td className="py-3 px-4 text-green-400">{batch.valid_rows}</td>
                        <td className="py-3 px-4 font-semibold">
                          {ignoredCount > 0 ? (
                            <button
                              onClick={() => openIgnoredModal(batch)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 text-[10px] cursor-pointer font-bold transition-all"
                              title="点击查看标红忽略的人员名单"
                            >
                              {ignoredCount} 人被忽略
                            </button>
                          ) : (
                            <span className="text-muted-foreground/60">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{batch.operator}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            batch.status === "SUCCESS" 
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : batch.status === "PROCESSING"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {batch.status === "SUCCESS" ? "已完成" : batch.status === "PROCESSING" ? "导入中" : "失败"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {new Date(batch.created_at).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ignored Records Dialog Modal */}
      {showIgnoredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-scale-up border border-border">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-gradient-to-r from-amber-500/10 to-transparent">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="h-5 w-5 text-amber-400 animate-pulse" />
                <div>
                  <h3 className="font-bold text-foreground text-base">Excel标红忽略人员名单一览</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">来源表: {selectedBatchName}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIgnoredModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-xl text-xs text-amber-200 leading-relaxed">
                <span className="font-bold text-white">📌 自动忽略提示：</span>
                以下员工在您上传的集团大表中，被手动标记为红色背景。系统已将其智能识别为“特殊排除行”，在导入时自动予以忽略，**不计入**各分公司的个税申报应纳税款和申报人头，确保您的申报数据符合人工复核状态。
              </div>

              <div className="overflow-y-auto max-h-[300px] border border-white/5 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2 font-semibold text-muted-foreground">
                      <th className="py-2.5 px-4">姓名</th>
                      <th className="py-2.5 px-4 font-mono">证件号码</th>
                      <th className="py-2.5 px-4">原始归属分公司</th>
                      <th className="py-2.5 px-4 text-right">工资额</th>
                      <th className="py-2.5 px-4 text-right">个税额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[11px] text-muted-foreground">
                    {selectedIgnoredList.map((emp, i) => (
                      <tr key={i} className="hover:bg-white/1 flex-row transition-colors">
                        <td className="py-2.5 px-4 font-bold text-foreground">{emp.name}</td>
                        <td className="py-2.5 px-4 font-mono">{emp.id_card}</td>
                        <td className="py-2.5 px-4 text-foreground">{emp.company_name}</td>
                        <td className="py-2.5 px-4 text-right font-mono">¥{emp.salary.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-purple-400">¥{emp.tax_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-white/5 bg-white/2">
              <button 
                onClick={() => setShowIgnoredModal(false)}
                className="bg-primary hover:bg-primary/90 text-white font-medium text-xs py-2 px-5 rounded-xl shadow-lg glow-purple cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from "react"
import api, { downloadFile } from "../utils/api"
import { 
  Building2, Download, UploadCloud, RefreshCw, CheckCircle, 
  Clock, AlertCircle, FileText, CheckSquare, Eye, X, Image as ImageIcon
} from "lucide-react"

interface DeclareTask {
  id: number
  month: string
  company_id: number
  company_name: string
  status: string
  declare_tax: number
  headcount: number
  operator: string
  declared_at: string | null
  paid_at: string | null
}

interface Archive {
  id: number
  archive_type: string
  file_name: string
  file_path: string
}

interface TaskCenterProps {
  currentMonth: string
  currentUser?: string
}

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  INIT: { label: "初始状态", class: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: Clock },
  DATA_READY: { label: "数据就绪", class: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock },
  WAIT_DECLARE: { label: "待申报", class: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  DECLARED: { label: "已申报", class: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: CheckCircle },
  PAYMENT_PENDING: { label: "待缴款", class: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: Clock },
  FINISHED: { label: "申报完成", class: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckSquare },
  FAILED: { label: "申报失败", class: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertCircle },
}

export default function TaskCenter({ currentMonth, currentUser }: TaskCenterProps) {
  const [tasks, setTasks] = useState<DeclareTask[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshingId, setRefreshingId] = useState<number | null>(null)
  
  // Dialog State
  const [showModal, setShowModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<DeclareTask | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [archiveType, setArchiveType] = useState("DECLARE_SCREENSHOT")
  const [archivesList, setArchivesList] = useState<Archive[]>([])
  const [loadingArchives, setLoadingArchives] = useState(false)

  async function fetchTasks() {
    try {
      setLoading(true)
      const res = await api.get(`/declare/tasks?month=${currentMonth}`)
      setTasks(res.data)
    } catch (err) {
      console.error("加载申报任务失败:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [currentMonth])

  const handleExport = async (task: DeclareTask) => {
    try {
      setRefreshingId(task.id)
      const filename = `${task.company_name}_${currentMonth}_个税申报标准模板.xls`
      await downloadFile(`/declare/tasks/${task.id}/export`, filename)
      
      // Auto upgrade status to WAIT_DECLARE (or DATA_READY -> WAIT_DECLARE)
      if (task.status === "DATA_READY") {
        await api.put(`/declare/tasks/${task.id}/status`, { status: "WAIT_DECLARE" })
        fetchTasks()
      }
    } catch (err) {
      alert("生成和下载报税模版失败，请稍后重试")
    } finally {
      setRefreshingId(null)
    }
  }

  const openStatusModal = async (task: DeclareTask) => {
    setSelectedTask(task)
    setSelectedStatus(task.status)
    setUploadFile(null)
    setArchiveType("DECLARE_SCREENSHOT")
    setShowModal(true)
    
    // Fetch uploaded archives for this company and month
    try {
      setLoadingArchives(true)
      const res = await api.get(`/archive?company_id=${task.company_id}&month=${currentMonth}`)
      setArchivesList(res.data)
    } catch (err) {
      console.error("获取归档附件失败:", err)
    } finally {
      setLoadingArchives(false)
    }
  }

  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask) return

    try {
      // 1. If file uploaded, do upload archive
      if (uploadFile) {
        const formData = new FormData()
        formData.append("file", uploadFile)
        formData.append("company_id", String(selectedTask.company_id))
        formData.append("month", currentMonth)
        formData.append("archive_type", archiveType)
        await api.post("/archive/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      }

      await api.put(`/declare/tasks/${selectedTask.id}/status`, {
        status: selectedStatus,
        operator: currentUser || "集团财务主管"
      })

      setShowModal(false)
      fetchTasks()
    } catch (err) {
      alert("保存失败")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span>月度申报任务台账</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            实时查看本月集团所有子公司的算税及个税申报进度，支持一键下载标准模版、上传凭证回档
          </p>
        </div>
        <button 
          onClick={fetchTasks}
          className="p-2.5 bg-white/5 hover:bg-white/10 text-foreground rounded-xl flex items-center justify-center cursor-pointer transition-colors"
          title="刷新数据"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-4 px-6">申报法人主体</th>
                <th className="py-4 px-6 text-center">报税人数</th>
                <th className="py-4 px-6">应纳税款</th>
                <th className="py-4 px-6">当前进度</th>
                <th className="py-4 px-6">核对人</th>
                <th className="py-4 px-6 text-right">操作栏</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-muted-foreground">
                    本月暂无生成申报任务，请前往“个税拆分导入”上传工资汇总表
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const sc = statusConfig[task.status] || statusConfig.INIT
                  const StatusIcon = sc.icon
                  return (
                    <tr key={task.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 px-6 font-semibold text-foreground">{task.company_name}</td>
                      <td className="py-4 px-6 text-center font-semibold">{task.headcount} 人</td>
                      <td className="py-4 px-6 font-mono text-purple-400 font-semibold">
                        ¥{task.declare_tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center space-x-1.5 py-1 px-3 rounded-full text-xs font-medium border ${sc.class}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{sc.label}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-muted-foreground">{task.operator}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => handleExport(task)}
                            disabled={refreshingId === task.id}
                            className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-foreground text-xs font-medium py-1.5 px-3 rounded-xl flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            title="导出税局可以直接导入的报税表格"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{refreshingId === task.id ? "导出中..." : "导出报税模版"}</span>
                          </button>
                          
                          <button
                            onClick={() => openStatusModal(task)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-foreground text-xs font-medium py-1.5 px-3 rounded-xl flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                          >
                            <UploadCloud className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>回填与凭证</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-card w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-scale-up border border-border">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div>
                <h3 className="font-bold text-foreground text-base">{selectedTask.company_name}</h3>
                <p className="text-xs text-muted-foreground mt-1">所属月份: {currentMonth} | 个税总额: ¥{selectedTask.declare_tax.toFixed(2)}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadAndSave} className="p-6 space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">修改申报流程状态</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                >
                  <option value="DATA_READY" className="bg-card">数据就绪</option>
                  <option value="WAIT_DECLARE" className="bg-card">待申报</option>
                  <option value="DECLARED" className="bg-card">已申报</option>
                  <option value="PAYMENT_PENDING" className="bg-card">待缴款</option>
                  <option value="FINISHED" className="bg-card">已缴款/完成归档</option>
                  <option value="FAILED" className="bg-card">申报失败</option>
                </select>
              </div>

              {/* Upload Attachment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">归档类型</label>
                  <select
                    value={archiveType}
                    onChange={(e) => setArchiveType(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="DECLARE_SCREENSHOT" className="bg-card">申报截图</option>
                    <option value="RECEIPT_FILE" className="bg-card">申报回执单</option>
                    <option value="PAYMENT_VOUCHER" className="bg-card">税局扣款凭证</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">上传并归档文件</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Archive Checklist */}
              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">已归档历史附件 ({archivesList.length})</p>
                {loadingArchives ? (
                  <p className="text-xs text-muted-foreground">加载附件列表中...</p>
                ) : archivesList.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 italic">暂无归档的凭证截图或回执</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                    {archivesList.map((arc) => (
                      <a 
                        key={arc.id}
                        href={`http://localhost:8000/uploads/archives/${currentMonth}/${arc.file_path.split('/').pop()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 p-2 bg-white/2 rounded-lg border border-white/5 hover:bg-white/5 text-xs text-muted-foreground hover:text-foreground truncate transition-colors"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{arc.file_name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
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
                  保存更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

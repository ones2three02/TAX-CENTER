import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 60000,
})

// Request interceptor to dynamically inject Authorization Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tax_token")
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to intercept 401 Unauthorized errors and force redirect to login
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("身份凭证已失效或过期，正在清除会话并重定向至登录页...")
      localStorage.removeItem("tax_token")
      localStorage.removeItem("tax_username")
      localStorage.removeItem("tax_role")
      // Reload page to trigger router redirection to Login view
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

// Add helper for file downloads
export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob'
    })
    const blob = new Blob([response.data], { type: response.headers['content-type'] })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error("下载文件出错:", error)
    throw error;
  }
}

export default api

import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 60000,
})

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

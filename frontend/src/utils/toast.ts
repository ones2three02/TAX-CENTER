type ToastType = "success" | "error" | "info" | "warning"

export interface ToastEvent {
  id: number
  message: string
  type: ToastType
  duration?: number
}

type ToastCallback = (event: ToastEvent) => void
const listeners = new Set<ToastCallback>()

export const toast = {
  subscribe(callback: ToastCallback) {
    listeners.add(callback)
    return () => listeners.delete(callback)
  },
  show(message: string, type: ToastType = "info", duration = 3000) {
    const event: ToastEvent = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration
    }
    listeners.forEach(cb => cb(event))
  },
  success(message: string, duration = 3000) {
    this.show(message, "success", duration)
  },
  error(message: string, duration = 4000) {
    this.show(message, "error", duration)
  },
  info(message: string, duration = 3000) {
    this.show(message, "info", duration)
  },
  warning(message: string, duration = 3000) {
    this.show(message, "warning", duration)
  }
}

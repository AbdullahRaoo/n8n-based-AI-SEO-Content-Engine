// Simple error logging utility
export class ErrorLogger {
  private static logs: Array<{ timestamp: string; level: string; message: string; data?: any }> = []

  static log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    }
    
    this.logs.push(logEntry)
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100)
    }
    
    // Also log to console
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    consoleMethod(`[${level.toUpperCase()}] ${message}`, data)
  }
  
  static getLogs() {
    return [...this.logs]
  }
  
  static clearLogs() {
    this.logs = []
  }
  
  static info(message: string, data?: any) {
    this.log('info', message, data)
  }
  
  static warn(message: string, data?: any) {
    this.log('warn', message, data)
  }
  
  static error(message: string, data?: any) {
    this.log('error', message, data)
  }
}

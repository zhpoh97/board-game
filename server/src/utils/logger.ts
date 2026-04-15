export function log(context: string, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${context}] ${message}`, data !== undefined ? data : '');
}

export function logError(context: string, message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${context}] ERROR: ${message}`, error !== undefined ? error : '');
}

import { useRef, useCallback } from 'react'

export interface ImportProgress {
  current: number
  total: number
  article: string
}

export interface ImportResult {
  success: number
  errors: string[]
  total: number
}

export function useImportWorker() {
  const workerRef = useRef<Worker | null>(null)

  const startImport = useCallback((
    jsonContent: string,
    onProgress?: (progress: ImportProgress) => void,
    onComplete?: (result: ImportResult) => void,
    onError?: (error: string) => void
  ) => {
    // Clean up existing worker
    if (workerRef.current) {
      workerRef.current.terminate()
    }

    try {
      // Create new worker
      workerRef.current = new Worker('/import-worker.js')
      
      workerRef.current.onmessage = (e) => {
        const { type, progress, result, error } = e.data
        
        switch (type) {
          case 'PROGRESS':
            onProgress?.(progress)
            break
          case 'COMPLETE':
            onComplete?.(result)
            // Clean up worker
            if (workerRef.current) {
              workerRef.current.terminate()
              workerRef.current = null
            }
            break
          case 'ERROR':
            onError?.(error)
            // Clean up worker
            if (workerRef.current) {
              workerRef.current.terminate()
              workerRef.current = null
            }
            break
        }
      }

      workerRef.current.onerror = (error) => {
        onError?.(`Worker error: ${error.message}`)
        if (workerRef.current) {
          workerRef.current.terminate()
          workerRef.current = null
        }
      }

      // Start the import
      workerRef.current.postMessage({
        type: 'IMPORT_ARTICLES',
        data: { jsonContent }
      })

    } catch (error) {
      onError?.(`Failed to create worker: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  return { startImport, cleanup }
}

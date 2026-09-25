import { useRef, useState } from 'react'
import { FileUp, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { importProjects } from '../../api/import.api'

export default function ImportProjectsModal({
  open,
  onClose,
  onImported,
}) {
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!open) return null

  const handleClose = () => {
    if (loading) return

    setFile(null)
    setError('')
    setSuccess('')
    onClose()
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]

    setError('')
    setSuccess('')

    if (!selectedFile) {
      setFile(null)
      return
    }

    const isCsv =
      selectedFile.name.toLowerCase().endsWith('.csv') ||
      selectedFile.type === 'text/csv'

    if (!isCsv) {
      setFile(null)
      setError('Please select a CSV file.')
      event.target.value = ''
      return
    }

    setFile(selectedFile)
  }

  const handleImport = async () => {
    if (!file) {
      setError('Please select a CSV file first.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await importProjects(file)

      const message =
        result?.message ||
        'Projects imported successfully.'

      setSuccess(message)

      if (onImported) {
        await onImported(result)
      }

      setTimeout(() => {
        setFile(null)
        setSuccess('')
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Project import failed:', err)

      setError(
        err?.message ||
          'Failed to import projects. Please check the CSV file and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <FileUp className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-800">
                Import Projects
              </h2>

              <p className="text-xs text-gray-400">
                Upload a CSV file containing project data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-5">
          {/* Upload area */}
          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center transition hover:border-primary/40 hover:bg-primary-50/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
              <Upload className="h-6 w-6" />
            </span>

            {file ? (
              <>
                <p className="text-sm font-semibold text-gray-800">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-700">
                  Choose CSV file
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Click here to select a .csv file
                </p>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Information */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-700">
              CSV Import
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              The CSV will be processed by the backend import service.
              Projects created through CSV import will not receive an ML
              prediction at this stage. Risk prediction will happen later
              when the project is assigned to a Project Manager.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2.5 text-xs text-green-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!file || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />

            {loading ? 'Importing…' : 'Import Projects'}
          </button>
        </div>
      </div>
    </div>
  )
}
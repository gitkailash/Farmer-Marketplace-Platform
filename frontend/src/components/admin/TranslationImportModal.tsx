import React, { useState, useRef } from 'react'
import { translationService, ImportResult } from '../../services/translationService'
import { Modal, Button, LoadingSpinner } from '../UI'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'

interface TranslationImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

const TranslationImportModal: React.FC<TranslationImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validate file type
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension === 'json') {
      setFormat('json')
    } else if (extension === 'csv') {
      setFormat('csv')
    } else {
      alert('Please select a JSON or CSV file')
      return
    }

    setSelectedFile(file)
    setImportResult(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setImporting(true)
    setImportResult(null)

    try {
      const response = await translationService.importTranslations(selectedFile, format)
      if (response.success && response.data) {
        setImportResult(response.data)
        if (response.data.success) {
          // Auto-close after successful import
          setTimeout(() => {
            onImportComplete()
            handleClose()
          }, 2000)
        }
      } else {
        setImportResult({
          success: false,
          imported: 0,
          errors: [response.message || 'Import failed'],
          warnings: []
        })
      }
    } catch (err) {
      console.error('Import error:', err)
      setImportResult({
        success: false,
        imported: 0,
        errors: ['An unexpected error occurred during import'],
        warnings: []
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setFormat('json')
    setImporting(false)
    setImportResult(null)
    setDragOver(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Translations"
      size="lg"
    >
      <div className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Translation File
          </label>
          
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : selectedFile 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="mx-auto text-green-600" size={48} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)} • {format.toUpperCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="inline-flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800"
                >
                  <X size={12} className="mr-1" />
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto text-gray-400" size={48} />
                <div>
                  <p className="text-sm text-gray-600">
                    Drop your translation file here, or{' '}
                    <span className="text-blue-600 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports JSON and CSV formats
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Format
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">JSON</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">CSV</span>
            </label>
          </div>
        </div>

        {/* Format Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            {format === 'json' ? 'JSON Format' : 'CSV Format'}
          </h4>
          {format === 'json' ? (
            <div className="text-sm text-blue-800">
              <p className="mb-2">Expected JSON structure:</p>
              <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "exportDate": "2024-01-10T00:00:00.000Z",
  "translations": [
    {
      "key": "common.buttons.save",
      "namespace": "common",
      "en": "Save",
      "ne": "सेभ गर्नुहोस्",
      "context": "Button text",
      "isRequired": true
    }
  ]
}`}
              </pre>
            </div>
          ) : (
            <div className="text-sm text-blue-800">
              <p className="mb-2">Expected CSV columns:</p>
              <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
key,namespace,en,ne,context,isRequired
common.buttons.save,common,Save,सेभ गर्नुहोस्,Button text,true
              </pre>
            </div>
          )}
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`
            border rounded-md p-4
            ${importResult.success 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
            }
          `}>
            <div className="flex items-center mb-2">
              {importResult.success ? (
                <CheckCircle className="text-green-600 mr-2" size={20} />
              ) : (
                <AlertCircle className="text-red-600 mr-2" size={20} />
              )}
              <h4 className={`font-medium ${
                importResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {importResult.success ? 'Import Successful' : 'Import Failed'}
              </h4>
            </div>
            
            <div className={`text-sm ${
              importResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              <p className="mb-2">
                {importResult.imported} translation{importResult.imported !== 1 ? 's' : ''} imported
              </p>
              
              {importResult.errors.length > 0 && (
                <div className="mb-2">
                  <p className="font-medium mb-1">Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="text-xs">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.warnings.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Warnings:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index} className="text-xs">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={importing}
          >
            {importResult?.success ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importing}
          >
            {importing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Importing...
              </>
            ) : (
              'Import Translations'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default TranslationImportModal
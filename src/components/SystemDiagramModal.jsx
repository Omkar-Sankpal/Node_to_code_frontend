import React from 'react'
import axios from 'axios'
import API_BASE_URL from '../apiConfig'
import mermaid from 'mermaid'
import { AnimatePresence, motion } from 'framer-motion'

const DIAGRAM_OPTIONS = [
  { label: 'Get uml', value: 'UML' },
  { label: 'Get useCase', value: 'USE_CASE' },
  { label: 'Get EntityRelationship', value: 'ENTITY_RELATIONSHIP' },
]

let mermaidInitialized = false

function ensureMermaidInit() {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'dark',
    suppressErrorRendering: true,
  })
  mermaidInitialized = true
}

export default function SystemDiagramModal({
  open,
  onClose,
  contextType,
  title,
  description,
  language,
  code,
}) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [activeType, setActiveType] = React.useState('')
  const [mermaidText, setMermaidText] = React.useState('')
  const [renderedSvg, setRenderedSvg] = React.useState('')

  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const safeName = `${(title || 'diagram').replace(/[^a-z0-9-_]+/gi, '_').toLowerCase()}_${(activeType || 'diagram').toLowerCase()}`

  const downloadSvg = () => {
    if (!renderedSvg) return
    downloadFile(`${safeName}.svg`, renderedSvg, 'image/svg+xml;charset=utf-8')
  }

  const downloadMermaid = () => {
    if (!mermaidText) return
    downloadFile(`${safeName}.mmd`, mermaidText, 'text/plain;charset=utf-8')
  }

  const generateDiagram = async (diagramType) => {
    setLoading(true)
    setError('')
    setActiveType(diagramType)
    setRenderedSvg('')

    try {
      const res = await axios.post(`${API_BASE_URL}/api/diagrams/system`, {
        diagramType,
        contextType,
        title: title || '',
        description: description || '',
        language: language || '',
        code: code || '',
      })

      const nextMermaid = String(res?.data?.mermaid || '').trim()
      if (!nextMermaid) {
        throw new Error('The LLM returned an empty diagram.')
      }
      setMermaidText(nextMermaid)
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Failed to generate diagram'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!open || !mermaidText) return
    let cancelled = false

    const renderDiagram = async () => {
      try {
        ensureMermaidInit()
        const id = `diag-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        const { svg } = await mermaid.render(id, mermaidText)
        if (!cancelled) {
          setRenderedSvg(svg)
          setError('')
        }
      } catch {
        if (!cancelled) {
          setRenderedSvg('')
          setError('Mermaid rendering failed for this output. Try another diagram type or regenerate.')
        }
      }
    }

    renderDiagram()

    return () => {
      cancelled = true
    }
  }, [open, mermaidText])

  React.useEffect(() => {
    if (!open) {
      setLoading(false)
      setError('')
      setActiveType('')
      setMermaidText('')
      setRenderedSvg('')
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-[#111] border border-white/10 rounded-2xl w-[94vw] max-w-5xl max-h-[85vh] flex flex-col shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white/80">System Diagram Generator</h3>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white/80 transition p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-3 border-b border-white/10 flex flex-wrap gap-2">
              {DIAGRAM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => generateDiagram(opt.value)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-md text-xs border transition ${
                    activeType === opt.value
                      ? 'bg-indigo-600/30 border-indigo-400/40 text-indigo-200'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              ))}
              {!loading && !error && renderedSvg && (
                <>
                  <button
                    onClick={downloadSvg}
                    className="px-3 py-1.5 rounded-md text-xs border bg-emerald-600/20 border-emerald-400/30 text-emerald-200 hover:bg-emerald-600/30 transition"
                  >
                    Download SVG
                  </button>
                  <button
                    onClick={downloadMermaid}
                    className="px-3 py-1.5 rounded-md text-xs border bg-white/5 border-white/10 text-white/70 hover:text-white transition"
                  >
                    Download Mermaid
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 overflow-auto p-5 custom-scrollbar">
              {!activeType && !loading && !error && (
                <div className="h-full min-h-40 flex items-center justify-center text-sm text-white/40">
                  Choose a diagram type to generate from your current code.
                </div>
              )}

              {loading && (
                <div className="h-full min-h-40 flex items-center justify-center gap-2 text-sm text-white/60">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating diagram...
                </div>
              )}

              {error && (
                <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  {error}
                </div>
              )}

              {!loading && !error && renderedSvg && (
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 overflow-auto">
                  <div className="min-w-[480px]" dangerouslySetInnerHTML={{ __html: renderedSvg }} />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

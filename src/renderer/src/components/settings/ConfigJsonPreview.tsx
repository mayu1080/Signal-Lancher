import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import { ui } from '../../uiLabels'

interface ConfigJsonPreviewProps {
  refreshToken?: number
}

export function ConfigJsonPreview({ refreshToken }: ConfigJsonPreviewProps) {
  const [jsonText, setJsonText] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus(null)
    try {
      const config = await api.getConfig()
      setJsonText(JSON.stringify(config, null, 2))
    } catch {
      setStatus(ui.settings.jsonPreviewFailed)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, refreshToken])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText)
      setStatus(ui.settings.jsonCopySuccess)
    } catch {
      setStatus(ui.settings.jsonCopyFailed)
    }
  }

  return (
    <section className="panel config-json-preview">
      <div className="panel-header-row">
        <h2>{ui.settings.jsonPreviewTitle}</h2>
        <div className="json-preview-actions">
          <button type="button" className="btn small" onClick={() => void load()}>
            {ui.settings.jsonRefresh}
          </button>
          <button type="button" className="btn small" onClick={() => void onCopy()} disabled={!jsonText}>
            {ui.settings.jsonCopy}
          </button>
        </div>
      </div>
      <p className="field-hint">{ui.settings.jsonPreviewHint}</p>
      <pre className="config-json-pre">{jsonText || '—'}</pre>
      {status && <p className="settings-status">{status}</p>}
    </section>
  )
}

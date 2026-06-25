import { ui } from '../../uiLabels'

export interface OscArgRow {
  type: 'number' | 'string' | 'boolean'
  value: string
}

interface OscArgsEditorProps {
  args: OscArgRow[]
  onChange: (args: OscArgRow[]) => void
}

export function parseOscArgsFromJson(json: string | undefined): OscArgRow[] {
  try {
    const parsed = JSON.parse(json?.trim() || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => {
      if (typeof item === 'number') return { type: 'number' as const, value: String(item) }
      if (typeof item === 'boolean') return { type: 'boolean' as const, value: String(item) }
      return { type: 'string' as const, value: String(item) }
    })
  } catch {
    return []
  }
}

export function oscArgsToJsonArray(args: OscArgRow[]): unknown[] {
  return args.map((row) => {
    if (row.type === 'number') {
      const n = Number(row.value)
      return Number.isNaN(n) ? 0 : n
    }
    if (row.type === 'boolean') return row.value === 'true'
    return row.value
  })
}

export function OscArgsEditor({ args, onChange }: OscArgsEditorProps) {
  const update = (index: number, patch: Partial<OscArgRow>) => {
    onChange(args.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <div className="osc-args-editor">
      <span className="form-label">{ui.triggersManage.oscArgs}</span>
      {args.length === 0 && <p className="field-hint">{ui.triggersManage.oscArgsEmpty}</p>}
      {args.map((row, index) => (
        <div key={index} className="osc-arg-row">
          <select
            value={row.type}
            onChange={(e) =>
              update(index, { type: e.target.value as OscArgRow['type'] })
            }
          >
            <option value="number">{ui.triggersManage.argTypeNumber}</option>
            <option value="string">{ui.triggersManage.argTypeString}</option>
            <option value="boolean">{ui.triggersManage.argTypeBoolean}</option>
          </select>
          {row.type === 'boolean' ? (
            <select
              value={row.value}
              onChange={(e) => update(index, { value: e.target.value })}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              type={row.type === 'number' ? 'number' : 'text'}
              value={row.value}
              onChange={(e) => update(index, { value: e.target.value })}
            />
          )}
          <button type="button" className="btn small" onClick={() => onChange(args.filter((_, i) => i !== index))}>
            {ui.triggersManage.removeAction}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn small"
        onClick={() => onChange([...args, { type: 'number', value: '1' }])}
      >
        {ui.triggersManage.addOscArg}
      </button>
    </div>
  )
}

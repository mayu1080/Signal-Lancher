import type { Trigger } from '../types'
import { ui } from '../uiLabels'

interface TriggerPanelProps {
  triggers: Trigger[]
  compact?: boolean
  showShortcuts?: boolean
  onFire: (triggerId: string) => void
}

const DEFAULT_GROUP = 'Default'

function displayGroup(group: string | undefined): string {
  if (!group || group === DEFAULT_GROUP) return ui.triggers.defaultGroup
  return group
}

export function TriggerPanel({ triggers, compact, showShortcuts, onFire }: TriggerPanelProps) {
  const groups = [...new Set(triggers.map((t) => t.group ?? DEFAULT_GROUP))]
  let shortcutCounter = 0

  return (
    <section className="panel trigger-panel">
      <h2>{ui.triggers.title}</h2>
      {showShortcuts && triggers.length > 0 && (
        <p className="field-hint keyboard-hint">{ui.keyboard.hint}</p>
      )}
      {groups.map((group) => (
        <div key={group} className="trigger-group">
          {!compact && (
            <h3>{displayGroup(group === DEFAULT_GROUP ? undefined : group)}</h3>
          )}
          <div className="trigger-grid">
            {triggers
              .filter((t) => (t.group ?? DEFAULT_GROUP) === group)
              .map((trigger) => {
                shortcutCounter += 1
                const shortcutNum = shortcutCounter
                return (
                <button
                  key={trigger.triggerId}
                  type="button"
                  className={`trigger-btn ${compact ? 'trigger-btn-compact' : ''}`}
                  style={trigger.color ? { borderColor: trigger.color } : undefined}
                  onClick={() => onFire(trigger.triggerId)}
                  title={compact ? trigger.triggerId : undefined}
                >
                  {showShortcuts && shortcutNum <= 9 && (
                    <span className="trigger-shortcut">{shortcutNum}</span>
                  )}
                  <span className="trigger-label">{trigger.label}</span>
                  {!compact && (
                    <>
                      <span className="trigger-id">{trigger.triggerId}</span>
                      {trigger.inputs?.midi?.map((m, i) =>
                        m.type === 'note' ? (
                          <span key={i} className="trigger-note">
                            {ui.triggers.midiNote}: {m.note}
                            {m.channel ? ` ch${m.channel}` : ''}
                          </span>
                        ) : (
                          <span key={i} className="trigger-note">
                            {ui.triggers.midiCc}: {m.cc}
                            {m.channel ? ` ch${m.channel}` : ''}
                          </span>
                        )
                      )}
                    </>
                  )}
                </button>
              )})}
          </div>
        </div>
      ))}
    </section>
  )
}

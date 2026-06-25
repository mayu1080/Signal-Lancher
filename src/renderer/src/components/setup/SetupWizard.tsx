import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { AppTab } from './layout/AppTabs'
import { ui } from '../../uiLabels'

interface SetupWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tab: AppTab) => void
  onComplete: () => void
  targetCount: number
  triggerCount: number
}

export function SetupWizard({
  open,
  onOpenChange,
  onNavigate,
  onComplete,
  targetCount,
  triggerCount
}: SetupWizardProps) {
  const [step, setStep] = useState(0)

  const close = () => {
    setStep(0)
    onOpenChange(false)
  }

  const finish = () => {
    onComplete()
    close()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="dialog-title">{ui.wizard.title}</Dialog.Title>

          {step === 0 && (
            <div className="wizard-step">
              <h3>{ui.wizard.step1}</h3>
              <p>{ui.wizard.step1Desc}</p>
              <p className="field-hint">
                {ui.targets.title}: {targetCount}
              </p>
              <button type="button" className="btn" onClick={() => onNavigate('targets')}>
                {ui.wizard.goTargets}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="wizard-step">
              <h3>{ui.wizard.step2}</h3>
              <p>{ui.wizard.step2Desc}</p>
              <p className="field-hint">
                Cue: {triggerCount}
              </p>
              <button type="button" className="btn" onClick={() => onNavigate('cues')}>
                {ui.wizard.goCues}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <h3>{ui.wizard.step3}</h3>
              <p>{ui.wizard.step3Desc}</p>
              <p className="field-hint">{ui.wizard.testHint}</p>
              <button type="button" className="btn" onClick={() => onNavigate('operate')}>
                {ui.tabs.operate}
              </button>
            </div>
          )}

          <div className="dialog-actions wizard-actions">
            {step > 0 && (
              <button type="button" className="btn" onClick={() => setStep((s) => s - 1)}>
                {ui.wizard.back}
              </button>
            )}
            <button type="button" className="btn" onClick={finish}>
              {ui.wizard.skip}
            </button>
            {step < 2 ? (
              <button type="button" className="btn active" onClick={() => setStep((s) => s + 1)}>
                {ui.wizard.next}
              </button>
            ) : (
              <button type="button" className="btn active" onClick={finish}>
                {ui.wizard.finish}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/// <reference types="vite/client" />

interface Window {
  signalLauncher: import('../../main/preload').SignalLauncherAPI
}

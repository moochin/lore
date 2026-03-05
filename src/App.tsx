import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { ConnectionScreen } from './components/ConnectionScreen';
import { GameContainer } from './components/GameContainer';
import { DialogueBox } from './components/DialogueBox';
import { DetailPanel } from './components/DetailPanel';
import { IntroModal } from './components/IntroModal';
import { MiniMap } from './components/MiniMap';
import { hasLiveToken, loadBaseUrl, saveCredentials } from './services/tokenStore';

export default function App() {
  const configPanelOpen  = useGameStore((s) => s.configPanelOpen);
  const openConfigPanel  = useGameStore((s) => s.openConfigPanel);
  const closeConfigPanel = useGameStore((s) => s.closeConfigPanel);
  const dialogueActive   = useGameStore((s) => s.dialogueActive);
  const setBackstageConnected = useGameStore((s) => s.setBackstageConnected);

  // Auto-connect via build-time env vars (VITE_BACKSTAGE_BASE_URL + VITE_BACKSTAGE_TOKEN).
  // Takes precedence so the connection screen is never shown in pre-configured deployments.
  useEffect(() => {
    const envUrl   = import.meta.env.VITE_BACKSTAGE_BASE_URL as string | undefined;
    const envToken = import.meta.env.VITE_BACKSTAGE_TOKEN   as string | undefined;
    if (!envUrl || !envToken) return;

    saveCredentials(envUrl, envToken)
      .then(() => setBackstageConnected(envUrl))
      .catch((err) => {
        console.error('Env-var auto-connect failed:', err);
        useGameStore.getState().openConfigPanel();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-initialize live catalog if user has saved credentials
  useEffect(() => {
    if (import.meta.env.VITE_BACKSTAGE_BASE_URL && import.meta.env.VITE_BACKSTAGE_TOKEN) return;
    if (hasLiveToken()) {
      const baseUrl = loadBaseUrl();
      if (baseUrl) {
        setBackstageConnected(baseUrl).catch((err) => {
          console.error('Failed to auto-initialize live catalog:', err);
          // Open config panel so the user can see the error and retry
          useGameStore.getState().openConfigPanel();
        });
      }
    }
  }, [setBackstageConnected]);

  // B key toggles the Backstage config panel (ignored during dialogue)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'b' || e.key === 'B') {
        // Ignore when typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (dialogueActive) return;

        if (configPanelOpen) closeConfigPanel();
        else openConfigPanel();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [configPanelOpen, openConfigPanel, closeConfigPanel, dialogueActive]);

  return (
    <>
      <GameContainer />
      <DialogueBox />
      <DetailPanel />
      <MiniMap />
      <IntroModal />
      {configPanelOpen && <ConnectionScreen />}
      <span style={{
        position: 'fixed', bottom: 4, right: 8, fontSize: 10,
        fontFamily: 'monospace', color: '#484f58', pointerEvents: 'none', zIndex: 1,
      }}>
        {__GIT_HASH__}
      </span>
    </>
  );
}

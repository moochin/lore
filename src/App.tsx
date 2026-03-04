import { useGameStore } from './store/gameStore';
import { ConnectionScreen } from './components/ConnectionScreen';
import { GameContainer } from './components/GameContainer';
import { DialogueBox } from './components/DialogueBox';
import { DetailPanel } from './components/DetailPanel';
import { IntroModal } from './components/IntroModal';
import { MiniMap } from './components/MiniMap';

export default function App() {
  const configured = useGameStore((s) => s.backstageConfigured);

  if (!configured) {
    return <ConnectionScreen />;
  }

  return (
    <>
      <GameContainer />
      <DialogueBox />
      <DetailPanel />
      <MiniMap />
      <IntroModal />
    </>
  );
}

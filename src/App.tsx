import { GameContainer } from './components/GameContainer';
import { DialogueBox } from './components/DialogueBox';
import { DetailPanel } from './components/DetailPanel';
import { IntroModal } from './components/IntroModal';
import { MiniMap } from './components/MiniMap';

export default function App() {
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

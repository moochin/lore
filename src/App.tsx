import { GameContainer } from './components/GameContainer';
import { DialogueBox } from './components/DialogueBox';
import { DetailPanel } from './components/DetailPanel';

export default function App() {
  return (
    <>
      <GameContainer />
      <DialogueBox />
      <DetailPanel />
    </>
  );
}

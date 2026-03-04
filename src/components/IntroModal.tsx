import { useGameStore } from '../store/gameStore';

export function IntroModal() {
  const shown = useGameStore((s) => s.introShown);
  const dismiss = useGameStore((s) => s.dismissIntro);

  if (shown) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0a1aee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          border: '3px solid #8b7355',
          borderRadius: 8,
          padding: '32px 40px',
          maxWidth: 520,
          width: '90vw',
          textAlign: 'center',
        }}
      >
        {/* Title */}
        <h1
          style={{
            color: '#ffe0a0',
            fontSize: 28,
            margin: '0 0 4px',
            letterSpacing: 4,
          }}
        >
          LORE
        </h1>
        <p
          style={{
            color: '#8b7355',
            fontSize: 11,
            margin: '0 0 20px',
            letterSpacing: 1,
          }}
        >
          Logically Orchestrated RPG Environment
        </p>

        {/* Flavor text */}
        <p
          style={{
            color: '#c4b8a0',
            fontSize: 13,
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
          Explore the Platform Guild village, talk to its members,
          and discover the services they maintain.
        </p>

        {/* Controls */}
        <div
          style={{
            backgroundColor: '#0d0d1a',
            borderRadius: 6,
            padding: '16px 20px',
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          <p
            style={{
              color: '#888',
              fontSize: 10,
              margin: '0 0 10px',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Controls
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 12px' }}>
            <Key>WASD / Arrows</Key>
            <Desc>Move around</Desc>
            <Key>E</Key>
            <Desc>Talk to NPCs / Enter buildings</Desc>
            <Key>Q</Key>
            <Desc>View full details (inside buildings)</Desc>
            <Key>ESC</Key>
            <Desc>Close panels</Desc>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={dismiss}
          style={{
            backgroundColor: '#8b7355',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '10px 32px',
            fontSize: 14,
            fontFamily: 'monospace',
            cursor: 'pointer',
            letterSpacing: 1,
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#a08060';
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#8b7355';
          }}
        >
          Begin Adventure
        </button>
      </div>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        color: '#ffe0a0',
        fontSize: 12,
        fontWeight: 'bold',
      }}
    >
      {children}
    </span>
  );
}

function Desc({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: '#aaa', fontSize: 12 }}>
      {children}
    </span>
  );
}

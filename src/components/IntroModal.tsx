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
          maxWidth: 1000,
          width: '90vw',
          display: 'flex',
          gap: 40,
        }}
      >
        {/* Left Side - Input Fields */}
        <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label
              style={{
                color: '#ffe0a0',
                fontSize: 12,
                fontWeight: 'bold',
                display: 'block',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Server Link
            </label>
            <input
              type="text"
              placeholder="Enter server URL..."
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#0d0d1a',
                border: '1px solid #8b7355',
                borderRadius: 4,
                color: '#c4b8a0',
                fontSize: 12,
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label
              style={{
                color: '#ffe0a0',
                fontSize: 12,
                fontWeight: 'bold',
                display: 'block',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Access Token
            </label>
            <input
              type="password"
              placeholder="Enter token..."
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#0d0d1a',
                border: '1px solid #8b7355',
                borderRadius: 4,
                color: '#c4b8a0',
                fontSize: 12,
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Security Info */}
          <div
            style={{
              backgroundColor: '#0d0d1a',
              borderRadius: 6,
              padding: '12px 16px',
              borderLeft: '3px solid #8b7355',
            }}
          >
            <p
              style={{
                color: '#888',
                fontSize: 10,
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Security
            </p>
            <p
              style={{
                color: '#a08060',
                fontSize: 11,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Your connection is encrypted. Never share your token.
            </p>
          </div>
        </div>

        {/* Right Side - Info & Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Title */}
          <div>
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
              Six guilds have settled across the realm — from forested highlands
              to arid deserts. Explore their villages, talk to their members,
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
                <Key>M</Key>
                <Desc>Toggle mini-map</Desc>
                <Key>ESC</Key>
                <Desc>Close panels</Desc>
              </div>
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
              alignSelf: 'flex-start',
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

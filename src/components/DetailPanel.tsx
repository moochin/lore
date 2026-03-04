import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function DetailPanel() {
  const entity = useGameStore((s) => s.detailPanelEntity);
  const hide = useGameStore((s) => s.hideDetailPanel);

  // Close on Escape key
  useEffect(() => {
    if (!entity) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [entity, hide]);

  if (!entity) return null;

  const lifecycle = (entity.spec.lifecycle as string) ?? '';
  const type = (entity.spec.type as string) ?? entity.kind.toLowerCase();
  const tags = entity.metadata.tags ?? [];
  const relations = entity.relations ?? [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 380,
        maxWidth: '95vw',
        height: '100vh',
        backgroundColor: '#0d0d1af0',
        borderLeft: '3px solid #8b7355',
        zIndex: 1001,
        overflowY: 'auto',
        padding: '20px 24px',
        fontFamily: 'monospace',
        color: '#e0e0e0',
      }}
    >
      {/* Close button */}
      <button
        onClick={hide}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: '#333',
          color: '#aaa',
          border: '1px solid #555',
          borderRadius: 4,
          padding: '4px 10px',
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        ESC
      </button>

      {/* Kind badge */}
      <span
        style={{
          fontSize: 10,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {entity.kind}
      </span>

      {/* Name */}
      <h2 style={{ color: '#ffe0a0', margin: '4px 0 8px', fontSize: 18 }}>
        {entity.metadata.name}
      </h2>

      {/* Description */}
      {entity.metadata.description && (
        <p style={{ color: '#bbb', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
          {entity.metadata.description}
        </p>
      )}

      {/* Type + Lifecycle */}
      {(type || lifecycle) && (
        <div style={{ marginBottom: 16, fontSize: 12 }}>
          {type && (
            <span style={{ color: '#aaccff', marginRight: 16 }}>
              Type: {type}
            </span>
          )}
          {lifecycle && (
            <span
              style={{
                color: lifecycle === 'production' ? '#88cc88' : '#ccaa44',
              }}
            >
              Lifecycle: {lifecycle}
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#777', fontSize: 11, marginBottom: 6 }}>Tags</h4>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: '#2a2a4a',
                  padding: '2px 8px',
                  borderRadius: 3,
                  fontSize: 11,
                  color: '#88cc88',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Relations */}
      {relations.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#777', fontSize: 11, marginBottom: 6 }}>
            Relations
          </h4>
          {relations.map((rel, i) => (
            <div key={i} style={{ fontSize: 12, marginBottom: 4, lineHeight: 1.4 }}>
              <span style={{ color: '#aaccff' }}>{rel.type}</span>
              {' \u2192 '}
              <span style={{ color: '#ffaa88' }}>{rel.targetRef}</span>
            </div>
          ))}
        </div>
      )}

      {/* Spec (collapsed) */}
      <div>
        <h4 style={{ color: '#777', fontSize: 11, marginBottom: 6 }}>Spec</h4>
        <pre
          style={{
            fontSize: 11,
            color: '#999',
            whiteSpace: 'pre-wrap',
            backgroundColor: '#1a1a2e',
            padding: 10,
            borderRadius: 4,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {JSON.stringify(entity.spec, null, 2)}
        </pre>
      </div>
    </div>
  );
}

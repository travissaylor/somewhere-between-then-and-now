'use client';

import { useEraStore } from '@/store/eraStore';
import { ERA_CONFIG } from '@/config/eras';

export default function DebugOverlay() {
  const globalProgress = useEraStore((s) => s.globalProgress);
  const currentEra = useEraStore((s) => s.currentEra);
  const eraProgress = useEraStore((s) => s.eraProgress);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const eraName = ERA_CONFIG[currentEra]?.name ?? 'Unknown';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.6,
        pointerEvents: 'none',
        userSelect: 'none',
        minWidth: 220,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#888' }}>
        Debug Overlay
      </div>
      <div>
        globalProgress:{' '}
        <span style={{ color: '#4fc3f7' }}>{globalProgress.toFixed(3)}</span>
      </div>
      <div>
        currentEra:{' '}
        <span style={{ color: '#81c784' }}>
          {currentEra}
        </span>{' '}
        <span style={{ color: '#666' }}>({eraName})</span>
      </div>
      <div>
        eraProgress:{' '}
        <span style={{ color: '#ffb74d' }}>{eraProgress.toFixed(3)}</span>
      </div>
      {/* Visual progress bar */}
      <div
        style={{
          marginTop: 8,
          height: 4,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${globalProgress * 100}%`,
            background: 'linear-gradient(90deg, #4fc3f7, #81c784, #ffb74d)',
            borderRadius: 2,
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    </div>
  );
}

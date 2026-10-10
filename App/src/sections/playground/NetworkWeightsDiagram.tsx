import type { LayerWeightsSnapshot } from '../../lib/nn/types';

interface NetworkWeightsDiagramProps {
  weights: LayerWeightsSnapshot[];
  hiddenLayers: number[];
}

export function NetworkWeightsDiagram({
  weights,
  hiddenLayers,
}: NetworkWeightsDiagramProps): JSX.Element {
  // Construct layer sizes: [2, ...hiddenLayers, 1]
  const layerSizes = [2, ...hiddenLayers, 1];
  const numLayers = layerSizes.length;

  const width = 380;
  const height = 180;
  const paddingX = 35;
  const paddingY = 24;

  const colSpacing = (width - paddingX * 2) / (numLayers - 1);

  // Compute node coordinates
  const nodeCoords: Array<Array<{ x: number; y: number }>> = [];

  for (let l = 0; l < numLayers; l++) {
    const count = layerSizes[l]!;
    const colX = paddingX + l * colSpacing;
    const rowCoords: Array<{ x: number; y: number }> = [];

    // Spacing between neurons in this column
    const availableHeight = height - paddingY * 2;
    const step = count > 1 ? availableHeight / (count - 1) : 0;
    const startY = count === 1 ? height / 2 : paddingY;

    for (let n = 0; n < count; n++) {
      const cy = count === 1 ? startY : startY + n * step;
      rowCoords.push({ x: colX, y: cy });
    }
    nodeCoords.push(rowCoords);
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="w-full rounded-xl bg-surface border border-border-subtle p-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-52 block"
        >

          {/* 1. Draw synaptic connections (edges) */}
          {weights.map((snapshot, lIdx) => {
            const fromNodes = nodeCoords[lIdx] ?? [];
            const toNodes = nodeCoords[lIdx + 1] ?? [];

            return snapshot.weights.map((row, fromIdx) => {
              const fromPt = fromNodes[fromIdx];
              if (!fromPt) return null;

              return row.map((wVal, toIdx) => {
                const toPt = toNodes[toIdx];
                if (!toPt) return null;

                const absW = Math.abs(wVal);
                const strokeWidth = Math.min(3.5, Math.max(0.6, absW * 1.4));
                const opacity = Math.min(0.9, Math.max(0.15, absW * 0.4 + 0.15));

                let strokeColor = 'rgba(255, 255, 255, 0.15)';
                if (wVal > 0.001) {
                  strokeColor = `rgba(56, 189, 248, ${opacity})`;
                } else if (wVal < -0.001) {
                  strokeColor = `rgba(244, 63, 94, ${opacity})`;
                }

                return (
                  <line
                    key={`edge-${lIdx}-${fromIdx}-${toIdx}`}
                    x1={fromPt.x}
                    y1={fromPt.y}
                    x2={toPt.x}
                    y2={toPt.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                );
              });
            });
          })}

          {/* 2. Draw neurons (nodes) */}
          {nodeCoords.map((col, lIdx) => {
            const isInput = lIdx === 0;
            const isOutput = lIdx === nodeCoords.length - 1;

            return col.map((node, nIdx) => {
              let fillColor = '#1e293b';
              let strokeColor = '#475569';
              let label = '';

              if (isInput) {
                fillColor = '#0f172a';
                strokeColor = '#38bdf8';
                label = `x${nIdx + 1}`;
              } else if (isOutput) {
                fillColor = '#0f172a';
                strokeColor = '#f59e0b';
                label = 'ŷ';
              }

              const r = isInput || isOutput ? 10 : 7;

              return (
                <g key={`node-${lIdx}-${nIdx}`}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={1.7}
                  />
                  {label && (
                    <text
                      x={node.x}
                      y={node.y + 3.5}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="system-ui"
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            });
          })}
        </svg>
      </div>

      <div className="flex flex-col gap-1 px-1 text-caption text-text-secondary">
        <p className="font-medium text-text-muted">
          Blue = positive weight, red = negative, thicker = stronger.
        </p>
        <p>
          Lines show the weights between neurons as they update live.
        </p>
      </div>
    </div>
  );
}



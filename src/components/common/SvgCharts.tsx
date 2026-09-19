import React, { useState } from 'react';

// ============================================================================
// SVG BAR CHART (Multi-bar support, responsive, interactive tooltip)
// ============================================================================

export interface BarSeries {
  key: string;
  name: string;
  color: string;
}

export interface SvgBarChartProps {
  data: any[];
  xKey: string;
  series: BarSeries[];
  height?: number;
  yFormatter?: (val: number) => string;
  tooltipFormatter?: (val: number, key: string, item: any) => string;
  labelFormatter?: (item: any) => string;
  showLegend?: boolean;
}

export const SvgBarChart: React.FC<SvgBarChartProps> = ({
  data,
  xKey,
  series,
  height = 280,
  yFormatter = (v) => `${v}`,
  tooltipFormatter,
  labelFormatter,
  showLegend = true
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-slate-400">
        Nenhum dado disponível para visualização.
      </div>
    );
  }

  // Find max value across all series
  let maxValue = 0;
  data.forEach((d) => {
    series.forEach((s) => {
      const val = Number(d[s.key] || 0);
      if (val > maxValue) maxValue = val;
    });
  });

  if (maxValue <= 0) maxValue = 100;
  // Round up to a pleasant interval
  const roundCeil = Math.ceil(maxValue * 1.15);

  const paddingTop = 20;
  const paddingBottom = 40;
  const paddingLeft = 55;
  const paddingRight = 20;
  const chartHeight = height - paddingTop - paddingBottom;
  const svgWidth = 600; // viewBox relative width
  const chartWidth = svgWidth - paddingLeft - paddingRight;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(roundCeil * ratio));

  const groupWidth = chartWidth / data.length;
  const barGap = 4;
  const totalBars = series.length;
  const barWidth = Math.max(4, Math.min(28, (groupWidth * 0.7) / totalBars - barGap));

  return (
    <div className="relative w-full flex flex-col space-y-2">
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-end gap-3 text-xs mb-1">
          {series.map((s) => (
            <div key={s.key} className="flex items-center space-x-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* SVG Viewport */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full h-auto overflow-visible font-sans select-none"
          style={{ maxHeight: height }}
        >
          {/* Horizontal Grid lines and Y Labels */}
          {yTicks.map((tickVal, idx) => {
            const y = paddingTop + chartHeight - (tickVal / roundCeil) * chartHeight;
            return (
              <g key={`ytick-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                >
                  {yFormatter(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Data Bars */}
          {data.map((item, idx) => {
            const groupX = paddingLeft + idx * groupWidth;
            const groupCenterX = groupX + groupWidth / 2;
            const groupTotalWidth = totalBars * barWidth + (totalBars - 1) * barGap;
            const startX = groupCenterX - groupTotalWidth / 2;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={`group-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Background highlight pill on hover */}
                {isHovered && (
                  <rect
                    x={groupX + 2}
                    y={paddingTop}
                    width={groupWidth - 4}
                    height={chartHeight}
                    fill="rgba(226, 232, 240, 0.4)"
                    rx="6"
                  />
                )}

                {/* Individual Bars */}
                {series.map((s, sIdx) => {
                  const val = Number(item[s.key] || 0);
                  const barH = Math.max(0, (val / roundCeil) * chartHeight);
                  const barX = startX + sIdx * (barWidth + barGap);
                  const barY = paddingTop + chartHeight - barH;

                  return (
                    <rect
                      key={`bar-${idx}-${s.key}`}
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barH}
                      fill={s.color}
                      rx={3}
                      className="transition-all duration-200 hover:brightness-110"
                    />
                  );
                })}

                {/* X Axis Label */}
                <text
                  x={groupCenterX}
                  y={paddingTop + chartHeight + 16}
                  textAnchor="middle"
                  className={`text-[10px] font-semibold transition-colors ${
                    isHovered ? 'fill-blue-600 dark:fill-blue-400 font-bold' : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {String(item[xKey] || '')}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md text-xs min-w-[190px]"
            style={{
              top: '10px',
              left: `${Math.min(75, Math.max(15, (hoveredIndex / data.length) * 100))}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 text-slate-200">
              {labelFormatter ? labelFormatter(data[hoveredIndex]) : data[hoveredIndex][xKey]}
            </div>
            <div className="space-y-1">
              {series.map((s) => {
                const rawVal = Number(data[hoveredIndex][s.key] || 0);
                const formatted = tooltipFormatter
                  ? tooltipFormatter(rawVal, s.key, data[hoveredIndex])
                  : yFormatter(rawVal);
                return (
                  <div key={s.key} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: s.color }} />
                      {s.name}:
                    </span>
                    <span className="font-mono font-bold text-white">{formatted}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SVG DONUT / PIE CHART
// ============================================================================

export interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface SvgPieChartProps {
  data: PieDataPoint[];
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
}

export const SvgPieChart: React.FC<SvgPieChartProps> = ({
  data,
  size = 200,
  innerRadius = 45,
  outerRadius = 75,
  showLegend = true
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-slate-400">
        Nenhum registro para exibir.
      </div>
    );
  }

  // Calculate arc slices
  const cx = size / 2;
  const cy = size / 2;
  let accumulatedAngle = -Math.PI / 2;

  const slices = data.map((item, idx) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + sliceAngle;
    accumulatedAngle += sliceAngle;

    const r1 = innerRadius;
    const r2 = outerRadius;

    const x1 = cx + r2 * Math.cos(startAngle);
    const y1 = cy + r2 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(endAngle);
    const y2 = cy + r2 * Math.sin(endAngle);

    const x3 = cx + r1 * Math.cos(endAngle);
    const y3 = cy + r1 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(startAngle);
    const y4 = cy + r1 * Math.sin(startAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${r2} ${r2} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${r1} ${r1} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');

    return {
      ...item,
      pathData,
      percent: Math.round((item.value / total) * 100),
      idx
    };
  });

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;
            return (
              <path
                key={slice.name}
                d={slice.pathData}
                fill={slice.color}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="transition-all duration-200 cursor-pointer hover:opacity-90"
                style={{
                  transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                  transformOrigin: `${cx}px ${cy}px`
                }}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {hoveredIdx !== null && data[hoveredIdx] ? (
            <>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                {data[hoveredIdx].name}
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                {data[hoveredIdx].value}
              </span>
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">
                {slices[hoveredIdx]?.percent}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {total}
              </span>
            </>
          )}
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
          {slices.map((slice) => (
            <div
              key={slice.name}
              className="flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              <span>{slice.name}:</span>
              <strong className="font-bold text-slate-900 dark:text-white">{slice.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SVG AREA / LINE CHART (Trend Evolution)
// ============================================================================

export interface AreaSeries {
  key: string;
  name: string;
  color: string;
}

export interface SvgAreaChartProps {
  data: any[];
  xKey: string;
  series: AreaSeries[];
  height?: number;
  yFormatter?: (val: number) => string;
  tooltipFormatter?: (val: number, key: string) => string;
}

export const SvgAreaChart: React.FC<SvgAreaChartProps> = ({
  data,
  xKey,
  series,
  height = 240,
  yFormatter = (v) => `${v}`,
  tooltipFormatter
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-slate-400">
        Nenhum dado temporal disponível.
      </div>
    );
  }

  let maxValue = 0;
  data.forEach((d) => {
    series.forEach((s) => {
      const val = Number(d[s.key] || 0);
      if (val > maxValue) maxValue = val;
    });
  });

  if (maxValue <= 0) maxValue = 100;
  const roundCeil = Math.ceil(maxValue * 1.15);

  const paddingTop = 20;
  const paddingBottom = 35;
  const paddingLeft = 55;
  const paddingRight = 20;
  const chartHeight = height - paddingTop - paddingBottom;
  const svgWidth = 600;
  const chartWidth = svgWidth - paddingLeft - paddingRight;

  const yTicks = [0, 0.33, 0.66, 1].map((ratio) => Math.round(roundCeil * ratio));

  // Compute coordinates for each series
  const getCoordinates = (sKey: string) => {
    return data.map((d, idx) => {
      const x = paddingLeft + (idx / (data.length - 1 || 1)) * chartWidth;
      const val = Number(d[sKey] || 0);
      const y = paddingTop + chartHeight - (val / roundCeil) * chartHeight;
      return { x, y, val };
    });
  };

  return (
    <div className="relative w-full flex flex-col space-y-2">
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 text-xs">
        {series.map((s) => (
          <div key={s.key} className="flex items-center space-x-1.5 font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-3 h-1 rounded-xs" style={{ backgroundColor: s.color }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          style={{ maxHeight: height }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {yTicks.map((tickVal, idx) => {
            const y = paddingTop + chartHeight - (tickVal / roundCeil) * chartHeight;
            return (
              <g key={`ytick-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                >
                  {yFormatter(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Render Area Paths */}
          {series.map((s) => {
            const coords = getCoordinates(s.key);
            if (coords.length === 0) return null;

            // Area path
            const firstX = coords[0].x;
            const lastX = coords[coords.length - 1].x;
            const baseY = paddingTop + chartHeight;

            const linePath = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
            const areaPath = `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

            return (
              <g key={`series-${s.key}`}>
                <path d={areaPath} fill={`url(#grad-${s.key})`} />
                <path d={linePath} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
                {coords.map((pt, i) => (
                  <circle
                    key={`dot-${s.key}-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === i ? 5 : 3}
                    fill="#FFFFFF"
                    stroke={s.color}
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                ))}
              </g>
            );
          })}

          {/* X Axis Labels and Interactive Hover Columns */}
          {data.map((item, idx) => {
            const x = paddingLeft + (idx / (data.length - 1 || 1)) * chartWidth;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={`xlabel-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Vertical hover line indicator */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartHeight}
                    stroke="#94A3B8"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                  />
                )}
                {/* Invisible hit box for easier hovering */}
                <rect
                  x={x - chartWidth / (data.length * 2)}
                  y={paddingTop}
                  width={chartWidth / data.length}
                  height={chartHeight}
                  fill="transparent"
                />
                <text
                  x={x}
                  y={paddingTop + chartHeight + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-semibold transition-colors ${
                    isHovered ? 'fill-blue-600 dark:fill-blue-400 font-bold' : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {String(item[xKey] || '')}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md text-xs min-w-[190px]"
            style={{
              top: '10px',
              left: `${Math.min(75, Math.max(15, (hoveredIndex / (data.length - 1 || 1)) * 100))}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-200">
              {data[hoveredIndex][xKey]}
            </div>
            <div className="space-y-1">
              {series.map((s) => {
                const val = Number(data[hoveredIndex][s.key] || 0);
                const formatted = tooltipFormatter ? tooltipFormatter(val, s.key) : yFormatter(val);
                return (
                  <div key={s.key} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: s.color }} />
                      {s.name}:
                    </span>
                    <span className="font-mono font-bold text-white">{formatted}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

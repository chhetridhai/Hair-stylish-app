import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { FaceMetrics } from '../types';

interface Props {
  metrics: FaceMetrics;
}

export const FaceRadarChart: React.FC<Props> = ({ metrics }) => {
  const data = [
    { subject: 'Jawline', A: metrics.jawline, fullMark: 100 },
    { subject: 'Cheekbones', A: metrics.cheekbones, fullMark: 100 },
    { subject: 'Forehead', A: metrics.forehead, fullMark: 100 },
    { subject: 'Symmetry', A: metrics.symmetry, fullMark: 100 },
    { subject: 'Structure', A: (metrics.jawline + metrics.cheekbones) / 2, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64 font-mono text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Face Metrics"
            dataKey="A"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="#06b6d4"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

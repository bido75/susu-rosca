'use client';

import { useEffect, useState } from 'react';

export type WheelMember = { id: string; name: string; slotNumber: number | null };

const PALETTE = [
  '#059669', // emerald
  '#0d9488', // teal
  '#0284c7', // sky
  '#d97706', // amber
  '#4f46e5', // indigo
  '#e11d48', // rose
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#16a34a', // green
  '#ea580c', // orange
  '#db2777', // pink
  '#0f766e', // teal-dark
];

function segmentColor(slotNumber: number | null): string {
  if (slotNumber === null) return '#cbd5e1';
  return PALETTE[(slotNumber - 1) % PALETTE.length];
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function PayoutWheel({
  members,
  currentCycle,
  spinTrigger,
}: {
  members: WheelMember[];
  currentCycle: number;
  spinTrigger: number;
}) {
  const count = members.length || 1;
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (spinTrigger <= 0) return;
    setSpinning(true);
    setRotation((prev) => {
      const slice = 360 / count;
      const idx = members.findIndex((m) => m.slotNumber === currentCycle);
      const targetCenter = idx >= 0 ? (idx + 0.5) * slice : 0;
      const desired = (360 - targetCenter) % 360;
      const cur = ((prev % 360) + 360) % 360;
      const delta = (desired - cur + 360) % 360;
      return prev + 360 * 5 + delta;
    });
    const t = setTimeout(() => setSpinning(false), 3200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinTrigger]);

  const currentIndex = members.findIndex((m) => m.slotNumber === currentCycle);

  return (
    <div className="flex flex-col items-center">
      <div className="relative my-4 w-56 h-56 sm:w-64 sm:h-64">
        {/* Pointer */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 drop-shadow">
          <svg width="26" height="26" viewBox="0 0 28 28">
            <polygon points="14,26 2,4 26,4" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3.2s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
          }}
        >
          {members.map((member, index) => {
            const angle = 360 / count;
            const startAngle = index * angle - 90;
            const endAngle = startAngle + angle;
            const startRad = (Math.PI / 180) * startAngle;
            const endRad = (Math.PI / 180) * endAngle;
            const x1 = 100 + 95 * Math.cos(startRad);
            const y1 = 100 + 95 * Math.sin(startRad);
            const x2 = 100 + 95 * Math.cos(endRad);
            const y2 = 100 + 95 * Math.sin(endRad);
            const largeArc = angle > 180 ? 1 : 0;
            const d = `M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const midAngle = startAngle + angle / 2;
            const midRad = (Math.PI / 180) * midAngle;
            const textX = 100 + 60 * Math.cos(midRad);
            const textY = 100 + 60 * Math.sin(midRad);
            const isCurrent = member.slotNumber === currentCycle;

            return (
              <g key={member.id}>
                <path
                  d={d}
                  fill={segmentColor(member.slotNumber)}
                  stroke="#ffffff"
                  strokeWidth={isCurrent ? 3 : 2}
                  opacity={isCurrent ? 1 : 0.92}
                />
                <text
                  x={textX}
                  y={textY - 6}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${midAngle + 90}, ${textX}, ${textY - 6})`}
                >
                  {initials(member.name)}
                </text>
                <text
                  x={textX}
                  y={textY + 9}
                  fill="#ffffff"
                  fontSize="7"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${midAngle + 90}, ${textX}, ${textY + 9})`}
                >
                  {member.slotNumber ? `Slot ${member.slotNumber}` : 'Open'}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="20" fill="#0f172a" stroke="#ffffff" strokeWidth="3" />
          <text
            x="100"
            y="101"
            fill="#34d399"
            fontSize="7"
            fontWeight="800"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            SUSU
          </text>
        </svg>
      </div>

      <p className="text-xs text-slate-500 mt-2">
        {spinning
          ? 'Spinning…'
          : currentIndex >= 0
            ? `Current recipient: ${members[currentIndex].name} (Slot ${currentCycle})`
            : 'Draw payout order to assign slots.'}
      </p>
    </div>
  );
}

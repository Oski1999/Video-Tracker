import React from 'react';
import {INK, Pencil, PAPER, SHADE, SketchPerson, cam, inOut, linear, ramp} from './kit';
import {rnd} from '../anim';

export type SceneProps = {t: number; d: number};

const W = 1920;
const H = 1080;

// 01-01 · "Slow pull-out from the front row to the full choir; hold on the last chord"
export const Choir: React.FC<SceneProps> = ({t, d}) => {
  const s = ramp(t, 0, d * 0.72, 1.7, 1, inOut);
  const rows = [
    {y: 360, n: 11, s: 0.78},
    {y: 520, n: 10, s: 0.9},
    {y: 690, n: 9, s: 1.02},
  ];
  return (
    <g transform={cam(s, 960, 820)}>
      <rect x={-200} y={850} width={2320} height={400} fill={SHADE} opacity={0.5} />
      <Pencil>
        <path d="M -100 860 L 2020 860" />
        <path d="M 120 300 L 1800 300" strokeDasharray="4 18" />
      </Pencil>
      {rows.map((r, ri) =>
        Array.from({length: r.n}).map((_, i) => {
          const span = 1500 + ri * 60;
          const x = 960 - span / 2 + (span / (r.n - 1)) * i + (ri % 2) * 20;
          return <SketchPerson key={`${ri}-${i}`} x={x} y={r.y} s={r.s} mouth={8 + 3 * Math.sin(t * 2 + i)} />;
        }),
      )}
      {[0, 1, 2, 3].map((i) => {
        const y = 250 - ((t * 40 + i * 70) % 220);
        return (
          <g key={i} transform={`translate(${300 + i * 420} ${y})`} opacity={0.75}>
            <Pencil w={4}>
              <path d="M 0 0 L 0 -60 L 30 -70 L 30 -10" />
            </Pencil>
            <ellipse cx={-8} cy={2} rx={13} ry={10} fill={INK} />
            <ellipse cx={22} cy={-8} rx={13} ry={10} fill={INK} />
          </g>
        );
      })}
    </g>
  );
};

// 01-18 · "Overhead, slight drift left to right as a pencil numbers measures"
export const Measures: React.FC<SceneProps> = ({t, d}) => {
  const drift = ramp(t, 0, d, 70, -70, linear);
  const measures: {x: number; y: number}[] = [];
  for (const y of [300, 640]) for (let i = 0; i < 6; i++) measures.push({x: 210 + i * 260, y});
  const step = (d - 0.8) / measures.length;
  const done = Math.floor((t - 0.3) / step);
  const target = measures[Math.max(0, Math.min(measures.length - 1, done + 1))];
  const prev = measures[Math.max(0, Math.min(measures.length - 1, done))];
  const k = Math.max(0, Math.min(1, ((t - 0.3) % step) / step));
  const px = prev.x + (target.x - prev.x) * inOut(k);
  const py = prev.y + (target.y - prev.y) * inOut(k);
  return (
    <g transform={`translate(${drift} 0)`}>
      <rect x={110} y={140} width={1700} height={820} fill="#FAFAF7" />
      <Pencil w={2}>
        <rect x={110} y={140} width={1700} height={820} />
      </Pencil>
      {[300, 640].map((y) => (
        <g key={y}>
          {[0, 1, 2, 3, 4].map((l) => (
            <line key={l} x1={190} x2={1770} y1={y + 40 + l * 28} y2={y + 40 + l * 28} stroke={INK} strokeOpacity={0.55} strokeWidth={2} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((b) => (
            <line key={b} x1={190 + b * 260} x2={190 + b * 260} y1={y + 40} y2={y + 152} stroke={INK} strokeOpacity={0.7} strokeWidth={3} />
          ))}
          {Array.from({length: 18}).map((_, n) => (
            <ellipse key={n} cx={240 + n * 85} cy={y + 54 + ((n * 37) % 5) * 14} rx={11} ry={8} fill={INK} opacity={0.7} />
          ))}
        </g>
      ))}
      {measures.map((m, i) =>
        i <= done ? (
          <text key={i} x={m.x - 10} y={m.y + 24} fontSize={34} fontFamily="Poppins" fontWeight={600} fill={INK} opacity={0.8}>
            {i + 1}
          </text>
        ) : null,
      )}
      <g transform={`translate(${px + 8} ${py + 20}) rotate(-38)`}>
        <Pencil fill="#D8D8D4">
          <path d="M 0 0 L 26 -14 L 360 -14 L 360 14 L 26 14 Z" />
          <path d="M 330 -14 L 330 14" />
        </Pencil>
        <path d="M 0 0 L 10 -5 L 10 5 Z" fill={INK} />
      </g>
    </g>
  );
};

// 02-01 · "Slow push-in on hands over the keys"
export const PianoKeys: React.FC<SceneProps> = ({t, d}) => {
  const s = ramp(t, 0, d, 1, 1.14, linear);
  const keys = 24;
  const kw = 1720 / keys;
  const down = new Set([Math.floor(t * 3) % 7 + 6, (Math.floor(t * 3) * 3) % 9 + 13]);
  return (
    <g transform={cam(s, 960, 640)}>
      <rect x={60} y={300} width={1800} height={140} fill="#5E5E5E" />
      {Array.from({length: keys}).map((_, i) => (
        <rect key={i} x={100 + i * kw} y={440} width={kw} height={460} fill={down.has(i) ? SHADE : '#FAFAF7'} stroke={INK} strokeOpacity={0.7} strokeWidth={2.5} />
      ))}
      {Array.from({length: keys - 1}).map((_, i) =>
        [0, 1, 3, 4, 5].includes(i % 7) ? <rect key={i} x={100 + (i + 1) * kw - kw * 0.3} y={440} width={kw * 0.6} height={280} fill="#2E2E2E" /> : null,
      )}
      {[620, 1220].map((hx, h) => (
        <g key={hx} transform={`translate(${hx} ${560 + 8 * Math.sin(t * 4 + h)})`}>
          <Pencil fill="#C4C4C1" w={3}>
            <path d="M -140 -40 C -150 -160 150 -160 140 -40 L 120 30 L -120 30 Z" />
            {[-100, -50, 0, 50, 100].map((fx, f) => (
              <rect key={fx} x={fx - 18} y={20} width={36} height={110 - Math.abs(fx) * 0.3 + (f === (Math.floor(t * 4) + h) % 5 ? 14 : 0)} rx={18} />
            ))}
          </Pencil>
          <path d="M -120 -160 L -140 -420 M 120 -160 L 140 -420" stroke={INK} strokeWidth={3} opacity={0.6} />
        </g>
      ))}
    </g>
  );
};

// 02-15, 05-17 · "Pages fan out one by one from a stack"
export const PagesFan: React.FC<SceneProps> = ({t, d}) => {
  const pages = [0, 1, 2];
  return (
    <g>
      <text x={150} y={600} fontSize={140} fontFamily="Poppins" fontWeight={600} fill={INK} opacity={0.7}>
        ×3
      </text>
      {pages.map((i) => {
        const at = 0.4 + i * (d * 0.22);
        const p = ramp(t, at, at + 0.7, 0, 1);
        const rot = (i - 1) * 16 * p;
        const tx = (i - 1) * 260 * p;
        return (
          <g key={i} transform={`translate(${1020 + tx} ${900}) rotate(${rot})`}>
            <rect x={-260} y={-680} width={520} height={680} fill="#FAFAF7" />
            <Pencil w={3}>
              <rect x={-260} y={-680} width={520} height={680} />
            </Pencil>
            {Array.from({length: 13}).map((_, l) => (
              <line key={l} x1={-200} x2={l % 4 === 3 ? 40 : 200} y1={-600 + l * 44} y2={-600 + l * 44} stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
            ))}
          </g>
        );
      })}
      <g transform="translate(1020 900)">
        <rect x={-270} y={-20} width={540} height={30} fill={SHADE} opacity={0.6} />
      </g>
    </g>
  );
};

// 03-01 · "Slow push-in toward the framed piece as the judge leans in"
export const FramedPiece: React.FC<SceneProps> = ({t, d}) => {
  const s = ramp(t, 0, d, 1, 1.16, linear);
  const lean = ramp(t, 0.3, d * 0.85, 0, -14, inOut);
  return (
    <g transform={cam(s, 760, 480)}>
      <rect x={0} y={860} width={W} height={220} fill={SHADE} opacity={0.5} />
      <rect x={470} y={210} width={580} height={500} fill="#FAFAF7" />
      <Pencil w={8}>
        <rect x={470} y={210} width={580} height={500} />
      </Pencil>
      <Pencil w={3}>
        <rect x={520} y={260} width={480} height={400} />
        <path d="M 520 560 L 640 420 L 730 520 L 830 380 L 1000 560" />
        <circle cx={900} cy={330} r={34} />
        <path d="M 520 600 C 650 580 850 620 1000 600" />
      </Pencil>
      <g transform={`translate(1430 900) rotate(${lean})`}>
        <Pencil fill="#BDBDBA">
          <path d="M -110 0 C -120 -260 -90 -380 0 -400 C 90 -380 120 -260 110 0 Z" />
        </Pencil>
        <Pencil fill="#D6D6D3">
          <circle cx={-20} cy={-470} r={70} />
        </Pencil>
        <circle cx={-68} cy={-478} r={6} fill={INK} />
        <path d="M -80 -440 L -64 -440" stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );
};

// 03-06 · "Four tiles pop in one by one, 0.25 s apart, with a 6% scale-up"
export const FourTiles: React.FC<SceneProps> = ({t}) => {
  const tiles = ['DRAWING', 'WATERCOLOR', 'OIL OR ACRYLIC', 'MONOCHROMATIC'];
  return (
    <g>
      {tiles.map((name, i) => {
        const at = 0.25 + i * 0.25;
        const on = t >= at;
        const s = ramp(t, at, at + 8 / 30, 1, 1.06);
        const x = 120 + i * 430 + 190;
        return on ? (
          <g key={name} transform={`translate(${x} 480) scale(${s})`} opacity={ramp(t, at, at + 3 / 30, 0, 1, linear)}>
            <rect x={-190} y={-210} width={380} height={420} fill="#FAFAF7" />
            <Pencil w={4}>
              <rect x={-190} y={-210} width={380} height={420} />
            </Pencil>
            {i === 0 ? (
              <Pencil w={3}>
                <path d="M 0 -60 C -90 -90 -110 40 -40 90 C -20 104 20 104 40 90 C 110 40 90 -90 0 -60 Z" />
                <path d="M 0 -60 C 0 -100 20 -120 40 -130" />
              </Pencil>
            ) : i === 1 ? (
              <g opacity={0.6}>
                <circle cx={-40} cy={-10} r={80} fill="#9A9A97" opacity={0.5} />
                <circle cx={50} cy={30} r={70} fill="#7E7E7B" opacity={0.45} />
                <circle cx={0} cy={60} r={60} fill="#B5B5B2" opacity={0.5} />
              </g>
            ) : i === 2 ? (
              <g>
                {[-80, -20, 40].map((y, k) => (
                  <path key={y} d={`M -130 ${y} C -40 ${y - 40} 40 ${y + 40} 130 ${y}`} stroke={['#5A5A58', '#8A8A87', '#3A3A3A'][k]} strokeWidth={34} fill="none" strokeLinecap="round" />
                ))}
              </g>
            ) : (
              <g>
                <Pencil w={3}>
                  <circle cx={0} cy={0} r={100} />
                </Pencil>
                {Array.from({length: 12}).map((_, k) => (
                  <line key={k} x1={-90 + k * 15} y1={30} x2={-60 + k * 15} y2={90 - Math.abs(k - 6) * 6} stroke={INK} strokeWidth={3} opacity={0.6} />
                ))}
              </g>
            )}
            <text x={0} y={175} textAnchor="middle" fontSize={30} fontFamily="Poppins" fontWeight={600} letterSpacing={3} fill={INK}>
              {name}
            </text>
          </g>
        ) : null;
      })}
    </g>
  );
};

// 04-01 · "Phone drops out of frame bottom; camera rises into frame; white flash on the shutter click"
export const PhoneToCamera: React.FC<SceneProps> = ({t}) => {
  const phoneY = ramp(t, 0.3, 1.1, 0, 900, (x) => x * x);
  const camY = ramp(t, 1.1, 2.1, 900, 0);
  return (
    <g>
      <g transform={`translate(960 ${540 + phoneY})`}>
        <Pencil fill="#D0D0CD" w={4}>
          <rect x={-160} y={-300} width={320} height={600} rx={40} />
          <rect x={-130} y={-250} width={260} height={480} rx={10} />
        </Pencil>
        <circle cx={0} cy={265} r={16} fill="none" stroke={INK} strokeWidth={3} />
      </g>
      <g transform={`translate(960 ${560 + camY})`}>
        <Pencil fill="#B5B5B2" w={4}>
          <path d="M -360 -170 L -120 -170 L -80 -240 L 80 -240 L 120 -170 L 360 -170 L 360 230 L -360 230 Z" />
        </Pencil>
        <Pencil fill="#8E8E8B" w={4}>
          <circle cx={0} cy={30} r={160} />
        </Pencil>
        <Pencil fill="#5A5A58" w={3}>
          <circle cx={0} cy={30} r={100} />
        </Pencil>
        <circle cx={-30} cy={0} r={22} fill="#EEE" opacity={0.6} />
        <rect x={230} y={-220} width={70} height={40} fill={INK} opacity={0.8} />
      </g>
    </g>
  );
};

// 04-21 · "Push-in to the USB going into the laptop"
export const UsbLaptop: React.FC<SceneProps> = ({t, d}) => {
  const s = ramp(t, 0, d, 1, 1.2, linear);
  const ux = ramp(t, 0.4, d * 0.6, 420, 0);
  return (
    <g transform={cam(s, 1330, 700)}>
      <rect x={0} y={760} width={W} height={320} fill={SHADE} opacity={0.5} />
      <Pencil fill="#D0D0CD" w={4}>
        <path d="M 520 740 L 1300 740 L 1360 780 L 460 780 Z" />
        <path d="M 560 740 L 600 260 L 1240 260 L 1280 740 Z" />
      </Pencil>
      <Pencil fill="#9A9A97" w={3}>
        <path d="M 620 700 L 650 300 L 1190 300 L 1220 700 Z" />
      </Pencil>
      <rect x={1318} y={748} width={30} height={16} fill={INK} />
      <g transform={`translate(${1352 + ux} 740)`}>
        <Pencil fill="#FAFAF7" w={3}>
          <rect x={0} y={4} width={44} height={24} />
          <rect x={44} y={-6} width={150} height={44} rx={8} />
        </Pencil>
      </g>
    </g>
  );
};

// 05-01 · "Static, then freeze frame on 'You may begin.' with a 4-frame white flash"
export const JudgeFreeze: React.FC<SceneProps> = ({t}) => {
  const tf = Math.min(t, 2.4); // freeze at the line
  const look = ramp(tf, 1.0, 1.8, 18, -4);
  const mouth = tf >= 2.4 ? 9 : 0;
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={PAPER} />
      <Pencil fill="#C9C9C6" w={4}>
        <path d="M 260 700 L 1660 700 L 1720 780 L 200 780 Z" />
        <path d="M 260 780 L 260 1080 M 1660 780 L 1660 1080" />
      </Pencil>
      <SketchPerson x={960} y={420} s={2.6} mouth={mouth} headRot={look} />
      <g transform="translate(1180 690) rotate(-6)">
        <Pencil fill="#FAFAF7" w={3}>
          <rect x={-120} y={-30} width={240} height={30} />
        </Pencil>
      </g>
      <Pencil w={3}>
        <path d="M 640 690 L 760 650 L 880 690" />
      </Pencil>
    </g>
  );
};

// 06-01 · "Very slow push-in from the back of the room"
export const Pulpit: React.FC<SceneProps> = ({t, d}) => {
  const s = ramp(t, 0, d, 1, 1.06, linear);
  return (
    <g transform={cam(s, 960, 430)}>
      <rect x={0} y={560} width={W} height={520} fill={SHADE} opacity={0.4} />
      <Pencil fill="#D4D4D1" w={3}>
        <rect x={560} y={500} width={800} height={80} />
      </Pencil>
      <SketchPerson x={960} y={330} s={1.1} mouth={4 + 4 * Math.abs(Math.sin(t * 6))} />
      <Pencil fill="#B9B9B6" w={4}>
        <path d="M 870 440 L 1050 440 L 1030 560 L 890 560 Z" />
      </Pencil>
      <Pencil fill="#FAFAF7" w={3}>
        <path d="M 900 440 L 960 420 L 1020 440 L 960 450 Z" />
      </Pencil>
      {[0, 1, 2].map((r) => (
        <g key={r}>
          {Array.from({length: 7}).map((_, i) => {
            const x = 220 + i * 250 + (r % 2) * 40;
            if (Math.abs(x - 960) < 110) return null;
            return <SketchPerson key={i} x={x} y={700 + r * 120} s={0.9 + r * 0.25} />;
          })}
          <rect x={0} y={790 + r * 130} width={W} height={46 + r * 10} fill="#8E8E8B" opacity={0.85} />
        </g>
      ))}
    </g>
  );
};

// 06-12 · "Three countdown signs pop up left to right, 3, 2, 1"
export const Countdown: React.FC<SceneProps> = ({t, d}) => (
  <g>
    <rect x={0} y={820} width={W} height={260} fill={SHADE} opacity={0.5} />
    {['3', '2', '1'].map((n, i) => {
      const at = d * (0.12 + i * 0.25);
      const p = ramp(t, at, at + 0.35, 0, 1, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 6));
      const x = 480 + i * 480;
      return (
        <g key={n} transform={`translate(${x} ${1150 - p * 650})`}>
          <Pencil fill="#8E8E8B" w={4}>
            <rect x={-12} y={160} width={24} height={500} />
          </Pencil>
          <Pencil fill="#FAFAF7" w={5}>
            <rect x={-170} y={-170} width={340} height={340} />
          </Pencil>
          <text x={0} y={95} textAnchor="middle" fontSize={260} fontFamily="Poppins" fontWeight={800} fill={INK}>
            {n}
          </text>
        </g>
      );
    })}
  </g>
);

// 07-01 · "Slow pan right from teacher to the kids"
export const TeacherKids: React.FC<SceneProps> = ({t, d}) => {
  const pan = ramp(t, 0.2, d - 0.2, 0, -1100, inOut);
  return (
    <g transform={`translate(${pan} 0)`}>
      <rect x={-200} y={820} width={3400} height={260} fill={SHADE} opacity={0.5} />
      <SketchPerson x={620} y={330} s={2.1} look={1} mouth={4 + 6 * Math.abs(Math.sin(t * 7))} />
      <g transform="translate(900 300) rotate(4)">
        <Pencil fill="#FAFAF7" w={4}>
          <rect x={0} y={0} width={360} height={280} />
        </Pencil>
        <Pencil w={4}>
          <path d="M 180 50 L 180 230 M 110 110 L 250 110" />
        </Pencil>
      </g>
      <Pencil w={6}>
        <path d="M 720 560 L 900 420" />
      </Pencil>
      {Array.from({length: 6}).map((_, i) => (
        <SketchPerson key={i} x={1500 + i * 260} y={700 + (i % 2) * 18} s={1.05} look={-1} />
      ))}
      <Pencil w={3}>
        <path d="M 1350 880 L 3100 880" />
      </Pencil>
    </g>
  );
};

// 08-01 · "Three quick light flashes on the middle quizzer, then quizmaster points"
export const QuizLights: React.FC<SceneProps> = ({t}) => {
  const flashes = [
    [0.3, 0.55],
    [0.75, 1.0],
    [1.2, 1.45],
  ];
  const lit = t >= 1.7 || flashes.some(([a, b]) => t >= a && t < b);
  const point = ramp(t, 1.8, 2.25, 40, -28);
  return (
    <g>
      {[560, 960, 1360].map((x, i) => {
        const on = i === 1 && lit;
        return (
          <g key={x}>
            {on ? <circle cx={x} cy={250} r={110} fill="#D7263D" opacity={0.18} /> : null}
            <Pencil fill={on ? '#D7263D' : '#EDEDEA'} w={4}>
              <circle cx={x} cy={250} r={46} />
            </Pencil>
            <SketchPerson x={x} y={430} s={1.3} mouth={0} />
          </g>
        );
      })}
      <Pencil fill="#B0B0AD" w={4}>
        <rect x={300} y={560} width={1320} height={110} />
      </Pencil>
      <g transform="translate(1700 760)">
        <Pencil fill="#BDBDBA" w={4}>
          <path d="M -200 330 C -210 120 -150 40 0 30 C 150 40 210 120 200 330 Z" />
        </Pencil>
        <g transform={`rotate(${point} -120 110)`}>
          <Pencil fill="#BDBDBA" w={4}>
            <path d="M -120 90 L -620 30 L -625 66 L -120 140 Z" />
          </Pencil>
        </g>
        <Pencil fill="#D6D6D3" w={4}>
          <circle cx={0} cy={-60} r={95} />
        </Pencil>
      </g>
    </g>
  );
};

// 09-01 · "Slow pan along the line of students to the Memory Master"
export const MemoryLine: React.FC<SceneProps> = ({t, d}) => {
  const pan = ramp(t, 0, Math.min(d, 2.4), 0, -1180, inOut);
  return (
    <g transform={`translate(${pan} 0)`}>
      <rect x={-200} y={860} width={3600} height={220} fill={SHADE} opacity={0.5} />
      {Array.from({length: 6}).map((_, i) => (
        <g key={i}>
          <SketchPerson x={260 + i * 300} y={420} s={1.6} look={1} />
          <Pencil fill="#BDBDBA" w={3}>
            <rect x={200 + i * 300} y={650} width={120} height={230} />
          </Pencil>
        </g>
      ))}
      <SketchPerson x={2700} y={380} s={2} look={-1} mouth={t >= 2.4 && t < 3.6 ? 10 : 0} />
      <Pencil fill="#BDBDBA" w={4}>
        <rect x={2610} y={680} width={180} height={200} />
      </Pencil>
      <g transform="translate(2560 600)">
        <Pencil fill="#FAFAF7" w={3}>
          <circle cx={0} cy={0} r={40} />
          <path d="M 0 0 L 0 -26" />
        </Pencil>
      </g>
    </g>
  );
};

// 09-12 · "Stopwatch hand sweeps; ring pulses red at each tick"
export const Stopwatch: React.FC<SceneProps> = ({t}) => {
  const angle = t * 36; // one turn every 10 s
  const pulse = Math.max(0, 1 - (t % 1) / 0.45);
  return (
    <g transform="translate(960 560)">
      <circle cx={0} cy={0} r={360 + pulse * 22} fill="none" stroke="#D7263D" strokeWidth={18} opacity={0.15 + 0.75 * pulse} />
      <Pencil fill="#FAFAF7" w={6}>
        <circle cx={0} cy={0} r={330} />
        <rect x={-40} y={-420} width={80} height={70} />
        <rect x={-70} y={-450} width={140} height={34} />
      </Pencil>
      {Array.from({length: 60}).map((_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const r1 = i % 5 === 0 ? 270 : 295;
        return (
          <line
            key={i}
            x1={Math.sin(a) * r1}
            y1={-Math.cos(a) * r1}
            x2={Math.sin(a) * 315}
            y2={-Math.cos(a) * 315}
            stroke={INK}
            strokeWidth={i % 5 === 0 ? 6 : 3}
            opacity={0.75}
          />
        );
      })}
      <g transform={`rotate(${angle})`}>
        <line x1={0} y1={40} x2={0} y2={-280} stroke="#D7263D" strokeWidth={8} strokeLinecap="round" />
      </g>
      <circle cx={0} cy={0} r={16} fill={INK} />
    </g>
  );
};

// 10-01 · "Overhead, loaf slides in from frame top; light steam drift"
export const Loaf: React.FC<SceneProps> = ({t}) => {
  const y = ramp(t, 0.1, 1.6, -900, 0);
  return (
    <g>
      <Pencil w={3}>
        {Array.from({length: 11}).map((_, i) => (
          <path key={i} d={`M ${160 + i * 160} 80 L ${160 + i * 160} 1000`} />
        ))}
        <rect x={120} y={80} width={1680} height={920} />
      </Pencil>
      <g transform={`translate(960 ${540 + y})`}>
        <Pencil fill="#8E8E8B" w={5}>
          <rect x={-380} y={-200} width={760} height={400} rx={30} />
        </Pencil>
        <Pencil fill="#C4B9A8" w={4}>
          <rect x={-340} y={-160} width={680} height={320} rx={120} />
        </Pencil>
        <Pencil w={4}>
          <path d="M -260 -10 C -120 -40 120 30 260 0" />
        </Pencil>
        {[-180, 0, 180].map((sx, i) => {
          const ph = (t * 0.6 + i * 0.33) % 1;
          return (
            <path
              key={sx}
              d={`M ${sx} ${-60 - ph * 260} c 30 -40 -30 -80 0 -120 c 30 -40 -30 -80 0 -120`}
              stroke="#FFFFFF"
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              opacity={0.75 * Math.sin(ph * Math.PI) * (t > 1.2 ? 1 : 0)}
            />
          );
        })}
      </g>
    </g>
  );
};

// 10-09 · "Overhead, slow 10° rotation of the plate"
export const CookiePlate: React.FC<SceneProps> = ({t, d}) => {
  const rot = ramp(t, 0, d, 0, 10, linear);
  return (
    <g transform={`translate(960 540) rotate(${rot})`}>
      <Pencil fill="#FAFAF7" w={5}>
        <circle cx={0} cy={0} r={430} />
      </Pencil>
      <Pencil w={3}>
        <circle cx={0} cy={0} r={340} />
      </Pencil>
      {Array.from({length: 6}).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const cx = Math.cos(a) * 200;
        const cy = Math.sin(a) * 200;
        return (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <Pencil fill="#BFB4A3" w={4}>
              <circle cx={0} cy={0} r={95} />
            </Pencil>
            {Array.from({length: 6}).map((__, k) => (
              <ellipse key={k} cx={(rnd(i * 10 + k) - 0.5) * 120} cy={(rnd(i * 20 + k + 3) - 0.5) * 120} rx={11} ry={9} fill="#4A4A48" />
            ))}
          </g>
        );
      })}
    </g>
  );
};

/** Fallback: a labelled sketch frame with a slow push-in. */
export const Generic: React.FC<SceneProps & {label: string}> = ({t, d, label}) => (
  <g transform={cam(ramp(t, 0, d, 1, 1.05, linear), 960, 540)}>
    <Pencil w={4}>
      <rect x={260} y={200} width={1400} height={680} />
      <path d="M 260 200 L 1660 880 M 1660 200 L 260 880" />
    </Pencil>
    <text x={960} y={560} textAnchor="middle" fontSize={44} fontFamily="Poppins" fontWeight={600} fill={INK}>
      {label}
    </text>
  </g>
);

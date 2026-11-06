/**
 * The iMaporong hero landscape — a golden rice field, a river, and the homes
 * of Barangay Maporong, drawn as one continuous pixel-art scene.
 *
 * Everything is authored on a 480 × 170 landscape window with `crispEdges`, so the art
 * stays sharp at any size. Motion lives in `globals.css` and stops for
 * visitors who prefer reduced motion.
 */

const C = {
  skyTop: '#C3E9F5',
  sky1: '#B6E3F2',
  sky2: '#A8DCEF',
  sky3: '#A1D8EC',
  haze: '#D8EED9',
  cloud: '#FAF6EB',
  cloudShade: '#DCEFF6',
  sun: '#E5B84D',
  sunLight: '#F2CC72',
  sunCore: '#FAE3A6',
  mtnFar: '#7FA99B',
  mtnFar2: '#8DB7A7',
  mtnMid: '#6E9C7A',
  pine: '#386B48',
  cream: '#FAF6EB',
  hill: '#8DAF72',
  hillDark: '#6F9558',
  hillLight: '#A6C284',
  rice: '#E5B84D',
  riceLight: '#F0C962',
  riceDark: '#C79A38',
  straw: '#EEDCB5',
  strawDark: '#D9C39A',
  earth: '#354638',
  earthSoft: '#5A4A34',
  wood: '#8A5A36',
  woodDark: '#6B4426',
  roof: '#A9743F',
  roofDark: '#8C5C33',
  roofRust: '#A5673F',
  river: '#83C5E2',
  riverDark: '#63AECF',
  riverLight: '#B9E4F2',
  skin: '#C98F63',
  skinDark: '#A9734F',
} as const;

const RICE_ROWS = [
  { y: 196, h: 4, gap: 10, shade: C.riceDark },
  { y: 204, h: 5, gap: 8, shade: C.riceDark },
  { y: 213, h: 6, gap: 8, shade: C.riceDark },
  { y: 223, h: 7, gap: 9, shade: C.riceDark },
];

function jitter(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

const riceStalks = RICE_ROWS.flatMap((row, rowIndex) => {
  const stalks: Array<{ x: number; y: number; h: number; fill: string }> = [];

  for (let x = 3; x < 480; x += row.gap) {
    const px = Math.round(x + jitter(x * (rowIndex + 2)) * 4 - 2);
    const onCenterPath = px > 232 && px < 280 && rowIndex >= 1;
    const onLeftPath = px > 30 && px < 76 && rowIndex >= 2;
    if (onCenterPath || onLeftPath) continue;
    stalks.push({ x: px, y: row.y, h: row.h, fill: row.shade });
  }

  return stalks;
});

const riceGroups = [
  riceStalks.filter((stalk) => stalk.x < 162),
  riceStalks.filter((stalk) => stalk.x >= 162 && stalk.x < 322),
  riceStalks.filter((stalk) => stalk.x >= 322),
];

const ripples = Array.from({ length: 30 }, (_, index) => {
  const x = Math.round(jitter(index + 1) * 456) + 8;
  const y = 241 + Math.round(jitter(index + 31) * 26);
  const width = 6 + Math.round(jitter(index + 61) * 18);
  return { x, y, width, light: index % 3 !== 0 };
});

function Cloud({
  x,
  y,
  scale = 1,
  className,
}: {
  x: number;
  y: number;
  scale?: number;
  className?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={className}>
        <rect x="0" y="8" width="38" height="5" fill={C.cloudShade} />
        <rect x="3" y="3" width="12" height="5" fill={C.cloud} />
        <rect x="9" y="0" width="18" height="7" fill={C.cloud} />
        <rect x="21" y="3" width="11" height="4" fill={C.cloud} />
        <rect x="-2" y="9" width="44" height="6" fill={C.cloud} />
        <rect x="6" y="15" width="30" height="3" fill={C.cloudShade} />
      </g>
    </g>
  );
}

function Palm({
  x,
  y,
  height = 26,
  className,
}: {
  x: number;
  y: number;
  height?: number;
  className?: string;
}) {
  const top = y - height;
  const step = Math.round(height / 5);

  return (
    <g className={className}>
      <rect x={x - 1} y={top} width={2} height={height} fill={C.woodDark} />
      <rect x={x + 1} y={top + step} width={2} height={step} fill={C.wood} />
      <rect x={x - 2} y={top + step * 2} width={2} height={step} fill={C.wood} />
      <rect x={x + 2} y={top + step * 3} width={2} height={step} fill={C.wood} />
      <rect x={x - 3} y={top + step * 4} width={2} height={step} fill={C.wood} />
      <g transform={`translate(${x} ${top})`}>
        <rect x="-3" y="-2" width="7" height="4" fill={C.hillDark} />
        <rect x="-13" y="-5" width="11" height="3" fill={C.pine ?? '#386B48'} />
        <rect x="2" y="-5" width="11" height="3" fill={C.hillDark} />
        <rect x="-18" y="-1" width="12" height="3" fill={C.hillDark} />
        <rect x="8" y="-1" width="12" height="3" fill={C.hillDark} />
        <rect x="-9" y="-9" width="9" height="3" fill={C.hillDark} />
        <rect x="2" y="-9" width="9" height="3" fill={C.hillDark} />
        <rect x="-2" y="-12" width="5" height="4" fill={C.hillDark} />
        <rect x="-1" y="2" width="3" height="2" fill={C.earthSoft} />
      </g>
    </g>
  );
}

function NipaHut({
  x,
  y,
  scale = 1,
  roof = C.roof,
  glow = false,
  flip = false,
}: {
  x: number;
  y: number;
  scale?: number;
  roof?: string;
  glow?: boolean;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <rect x="-17" y="-13" width="34" height="4" fill={C.strawDark} />
      <polygon points="-18,-9 18,-9 13,-19 -13,-19" fill={roof} />
      <polygon points="13,-19 18,-9 12,-9 9,-19" fill={C.roofDark} />
      <rect x="-20" y="-10" width="40" height="3" fill={C.roofDark} />
      <rect x="-14" y="-7" width="28" height="13" fill={C.straw} />
      <rect x="-14" y="-7" width="28" height="2" fill="#E6D1A8" />
      <rect x="6" y="-3" width="5" height="4" fill={glow ? C.sunLight : '#8A7A58'} />
      <rect x="6" y="-3" width="5" height="1" fill={glow ? '#FBE7B2' : '#9C8C68'} />
      <rect x="-3" y="0" width="6" height="6" fill={C.earthSoft} />
      <rect x="-3" y="0" width="1" height="6" fill={C.earth} opacity="0.5" />
      <rect x="-12" y="6" width="3" height="4" fill={C.woodDark} />
      <rect x="9" y="6" width="3" height="4" fill={C.woodDark} />
      <rect x="-2" y="7" width="8" height="2" fill={C.wood} />
      <rect x="-6" y="-22" width="3" height="4" fill={C.earthSoft} />
    </g>
  );
}

function Person({
  x,
  y,
  shirt,
  pants = C.earth,
  className = '',
}: {
  x: number;
  y: number;
  shirt: string;
  pants?: string;
  className?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        <rect x="-4" y="-12" width="8" height="1" fill={C.straw} />
        <rect x="-2" y="-13" width="4" height="1" fill={C.sun} />
        <rect x="-1" y="-11" width="3" height="3" fill={C.skin} />
        <rect x="-2" y="-8" width="5" height="5" fill={shirt} />
        <rect x="-3" y="-7" width="1" height="3" fill={C.skin} />
        <rect x="3" y="-7" width="1" height="3" fill={C.skin} />
        <rect x="-2" y="-3" width="2" height="2" fill={pants} />
        <rect x="1" y="-3" width="2" height="2" fill={pants} />
      </g>
    </g>
  );
}

function Butterfly({ x, y, tone }: { x: number; y: number; tone: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="scene-person">
        <rect x="-2" y="-1" width="1" height="2" fill={tone} />
        <rect x="1" y="-1" width="1" height="2" fill={tone} />
        <rect x="0" y="0" width="1" height="2" fill={C.earthSoft} />
      </g>
    </g>
  );
}

function SceneTip({ x, y, label }: { x: number; y: number; label: string }) {
  const width = label.length * 3.6 + 14;

  return (
    <g className="scene-tip" aria-hidden="true">
      <rect
        x={x - width / 2}
        y={y - 12}
        width={width}
        height={11}
        rx="2"
        fill={C.cream ?? '#FAF6EB'}
        stroke={C.earth}
        strokeWidth="1"
      />
      <rect x={x - 2} y={y - 1} width="4" height="3" fill={C.earth} />
      <text
        x={x}
        y={y - 4}
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fontFamily="Lato, ui-sans-serif, sans-serif"
        fill={C.earth}
      >
        {label}
      </text>
    </g>
  );
}

export function RiceFieldScene({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 100 480 170"
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* ------------------------------------------------------------ sky */}
      <rect width="480" height="46" fill={C.skyTop} />
      <rect y="46" width="480" height="44" fill={C.sky1} />
      <rect y="90" width="480" height="42" fill={C.sky2} />
      <rect y="132" width="480" height="24" fill={C.sky3} />
      <rect y="150" width="480" height="12" fill={C.haze} />

      {/* sun — stacked pixels keep the blocky silhouette */}
      <g transform="translate(0 46)">
        <rect x="380" y="24" width="16" height="4" fill={C.sunCore} opacity="0.28" />
        <rect x="372" y="28" width="32" height="4" fill={C.sunCore} opacity="0.3" />
        <rect x="366" y="32" width="44" height="32" fill={C.sunCore} opacity="0.32" />
        <rect x="372" y="64" width="32" height="4" fill={C.sunCore} opacity="0.28" />
        <rect x="381" y="30" width="14" height="3" fill={C.sunLight} />
        <rect x="377" y="33" width="22" height="4" fill={C.sunLight} />
        <rect x="374" y="37" width="28" height="20" fill={C.sunLight} />
        <rect x="377" y="57" width="22" height="5" fill={C.sunLight} />
        <rect x="381" y="62" width="14" height="3" fill={C.sunLight} />
        <rect x="381" y="35" width="14" height="3" fill={C.sun} />
        <rect x="378" y="38" width="20" height="16" fill={C.sun} />
        <rect x="381" y="54" width="14" height="3" fill={C.sun} />
        <rect x="384" y="41" width="8" height="10" fill={C.sunCore} />
      </g>

      {/* clouds */}
      <Cloud x={42} y={38} scale={1.15} className="scene-cloud" />
      <Cloud x={196} y={24} scale={0.9} className="scene-cloud-slow" />
      <Cloud x={300} y={58} scale={0.75} className="scene-cloud" />
      <Cloud x={430} y={34} scale={0.55} className="scene-cloud-slow" />
      <Cloud x={66} y={100} scale={0.6} className="scene-cloud-slow" />
      <Cloud x={248} y={94} scale={0.5} className="scene-cloud" />
      <Cloud x={418} y={106} scale={0.55} className="scene-cloud-slow" />

      {/* birds */}
      <g stroke={C.earth} strokeWidth="1.4" fill="none">
        <g transform="translate(0 22)">
          <g className="scene-bird">
            <path d="M120 74 l3 -2 3 2" />
            <path d="M132 68 l3 -2 3 2" />
            <path d="M142 78 l2 -1.5 2 1.5" />
          </g>
        </g>
        <g transform="translate(0 18)">
          <g className="scene-bird" style={{ animationDelay: '-4s' }}>
            <path d="M268 62 l3 -2 3 2" />
            <path d="M279 70 l2 -1.5 2 1.5" />
          </g>
        </g>
      </g>

      {/* -------------------------------------------------------- mountains */}
      <g fill={C.mtnFar}>
        <polygon points="0,162 0,134 26,108 48,131 67,118 96,151 119,137 150,162" />
        <polygon points="140,162 168,127 196,153 220,120 252,162" />
        <polygon points="246,162 278,129 300,149 330,112 372,159 360,162" />
        <polygon points="376,162 404,131 428,149 452,121 480,147 480,162" />
      </g>
      <g fill={C.mtnFar2}>
        <polygon points="0,162 0,148 30,126 56,147 84,133 120,159 0,159" />
        <polygon points="300,162 330,137 358,155 382,140 414,162" />
        <polygon points="420,162 448,141 468,155 480,146 480,162" />
      </g>
      <g fill="#6F9E8E" opacity="0.9">
        <polygon points="0,162 0,156 28,134 54,155 76,143 108,162" />
        <polygon points="330,162 352,146 376,162" />
        <polygon points="438,162 458,149 480,160 480,162" />
      </g>

      {/* ------------------------------------------------------- green hills */}
      <polygon
        points="0,184 0,166 16,162 32,168 52,160 74,167 94,159 116,168 138,161 160,169 184,160 208,168 232,161 256,169 280,160 304,168 328,161 352,169 376,160 400,168 424,161 448,169 480,162 480,184"
        fill={C.hillLight}
      />
      <polygon
        points="0,186 0,176 20,170 44,177 68,169 92,177 118,170 144,178 170,170 198,178 226,171 254,178 282,170 310,178 338,171 366,178 394,170 422,178 450,171 480,178 480,186"
        fill={C.hill}
      />
      <polygon
        points="0,192 0,182 26,176 58,183 90,175 124,184 158,176 192,184 226,176 260,184 294,176 328,184 362,176 396,184 430,176 462,184 480,178 480,192"
        fill={C.hillDark}
      />

      {/* tree line along the hills */}
      <g fill={C.hillDark}>
        {Array.from({ length: 24 }, (_, index) => {
          const x = 8 + index * 20 + Math.round(jitter(index + 3) * 6);
          const height = 4 + Math.round(jitter(index + 9) * 5);
          return <rect key={`tree-${index}`} x={x} y={178 - height} width={5} height={height} />;
        })}
      </g>

      {/* ------------------------------------------------------------ homes */}
      <Palm x={64} y={196} height={30} className="scene-tree" />
      <Palm x={156} y={200} height={24} className="scene-tree" />
      <Palm x={306} y={198} height={28} className="scene-tree" />
      <Palm x={392} y={196} height={22} className="scene-tree" />
      <Palm x={462} y={202} height={26} className="scene-tree" />

      <NipaHut x={96} y={192} scale={1} roof={C.roof} glow />
      <NipaHut x={140} y={198} scale={0.82} roof={C.roofDark} flip />
      <NipaHut x={250} y={194} scale={0.98} roof={C.roof} glow />
      <NipaHut x={340} y={190} scale={1.05} roof={C.roofRust} />
      <NipaHut x={420} y={200} scale={0.8} roof={C.roofDark} flip />

      {/* smoke from the cooking fires */}
      <g>
        <rect x="349" y="166" width="2" height="4" fill={C.earthSoft} />
        <rect x="349" y="166" width="2" height="4" fill={C.earthSoft} />
        <rect
          x="347"
          y="159"
          width="3"
          height="3"
          fill={C.cloud}
          className="scene-smoke"
          opacity="0"
        />
        <rect
          x="350"
          y="153"
          width="4"
          height="4"
          fill={C.cloud}
          className="scene-smoke"
          opacity="0"
          style={{ animationDelay: '-1.6s' }}
        />
        <rect
          x="347"
          y="148"
          width="5"
          height="5"
          fill={C.cloud}
          className="scene-smoke"
          opacity="0"
          style={{ animationDelay: '-3.1s' }}
        />
      </g>
      <g>
        <rect x="258" y="172" width="2" height="4" fill={C.earthSoft} />
        <rect
          x="256"
          y="164"
          width="3"
          height="3"
          fill={C.cloud}
          className="scene-smoke"
          opacity="0"
          style={{ animationDelay: '-2.2s' }}
        />
        <rect
          x="259"
          y="158"
          width="4"
          height="4"
          fill={C.cloud}
          className="scene-smoke"
          opacity="0"
          style={{ animationDelay: '-0.7s' }}
        />
      </g>

      {/* ------------------------------------------------------ rice fields */}
      <rect y="184" width="480" height="50" fill={C.rice} />
      <rect y="184" width="480" height="5" fill={C.riceLight} opacity="0.6" />
      <rect y="196" width="480" height="1" fill={C.riceDark} opacity="0.4" />
      <rect y="207" width="480" height="1" fill={C.riceDark} opacity="0.35" />
      <rect y="218" width="480" height="1" fill={C.riceDark} opacity="0.35" />
      <rect y="229" width="480" height="1" fill={C.riceDark} opacity="0.4" />

      {/* young crop patches */}
      <polygon points="0,190 34,190 48,198 22,204 0,200" fill={C.hill} opacity="0.9" />
      <polygon points="0,214 30,212 46,220 20,227 0,224" fill={C.hillDark} opacity="0.75" />
      <polygon points="404,190 480,188 480,202 430,204 410,198" fill={C.hill} opacity="0.85" />
      <polygon points="452,214 480,212 480,228 448,226" fill={C.hillDark} opacity="0.7" />
      <polygon points="176,202 214,200 220,210 186,212" fill={C.hill} opacity="0.6" />

      {/* terraced rice rows in three swaying groups */}
      {riceGroups.map((group, groupIndex) => (
        <g
          key={`rice-group-${groupIndex}`}
          className={groupIndex === 1 ? 'scene-rice' : 'scene-rice-soft'}
        >
          {group.map((stalk) => (
            <g key={`stalk-${stalk.x}-${stalk.y}`}>
              <rect x={stalk.x} y={stalk.y} width="1" height={stalk.h} fill={stalk.fill} />
              <rect
                x={stalk.x - 1}
                y={stalk.y + 1}
                width="1"
                height="2"
                fill={C.riceDark}
                opacity="0.55"
              />
              <rect x={stalk.x} y={stalk.y} width="1" height="1" fill={C.riceLight} opacity="0.8" />
            </g>
          ))}
        </g>
      ))}

      {/* farm paths */}
      <polygon points="242,194 254,194 262,212 270,224 280,234 230,234 250,216 240,204" fill={C.straw} />
      <polygon points="242,194 254,194 262,212 270,224 280,234 230,234 250,216 240,204" fill="none" stroke={C.strawDark} strokeWidth="1" opacity="0.6" />
      <polygon points="40,194 54,194 66,206 58,228 38,234 22,230 34,208" fill={C.straw} />
      <polygon points="40,194 54,194 66,206 58,228 38,234 22,230 34,208" fill="none" stroke={C.strawDark} strokeWidth="1" opacity="0.6" />

      {/* harvest bundles */}
      <g>
        <rect x="160" y="220" width="8" height="4" fill={C.riceDark} />
        <rect x="162" y="217" width="4" height="3" fill={C.riceLight} />
        <rect x="318" y="216" width="7" height="4" fill={C.riceDark} />
        <rect x="320" y="213" width="3" height="3" fill={C.riceLight} />
        <rect x="360" y="226" width="8" height="4" fill={C.riceDark} />
      </g>

      {/* ---------------------------------------------------------- people */}
      <Person x={116} y={212} shirt="#C25B3F" className="scene-person" />
      <Person x={176} y={218} shirt="#4E7FA8" className="scene-person" />
      <Person x={286} y={210} shirt="#E0A63F" className="scene-person" />
      <Person x={356} y={206} shirt="#6C8C4E" className="scene-person" />
      <Person x={232} y={230} shirt="#8B5E83" className="scene-person" />
      <Person x={404} y={216} shirt="#C25B3F" className="scene-person" />

      {/* ----------------------------------------------------------- river */}
      <rect y="232" width="480" height="38" fill={C.river} />
      <polygon points="0,236 60,233 124,237 198,233 270,237 344,233 412,237 480,234 480,243 0,243" fill={C.strawDark} />
      <polygon points="0,238 54,235 118,239 192,235 264,239 338,235 408,239 480,236 480,243 0,243" fill={C.rice} opacity="0.45" />
      <rect y="247" width="480" height="23" fill={C.riverDark} opacity="0.55" />
      <rect y="262" width="480" height="8" fill="#4E9BBE" opacity="0.45" />

      {/* water ripples */}
      <g className="scene-water">
        {ripples
          .filter((ripple) => ripple.light)
          .map((ripple, index) => (
            <rect
              key={`ripple-light-${index}`}
              x={ripple.x}
              y={ripple.y}
              width={ripple.width}
              height="1"
              fill={C.riverLight}
              opacity="0.7"
            />
          ))}
      </g>
      <g className="scene-water-slow">
        {ripples
          .filter((ripple) => !ripple.light)
          .map((ripple, index) => (
            <rect
              key={`ripple-dark-${index}`}
              x={ripple.x}
              y={ripple.y}
              width={ripple.width + 8}
              height="1"
              fill={C.riverDark}
              opacity="0.8"
            />
          ))}
      </g>

      {/* sun reflection on the water */}
      <g fill={C.sunLight} opacity="0.8">
        <rect x="386" y="240" width="12" height="2" />
        <rect x="382" y="245" width="18" height="2" />
        <rect x="388" y="250" width="10" height="2" />
        <rect x="384" y="255" width="16" height="2" />
        <rect x="390" y="260" width="8" height="2" />
        <rect x="386" y="265" width="12" height="2" />
      </g>

      {/* reeds and riverbank plants */}
      <g fill={C.hillDark}>
        <rect x="8" y="228" width="2" height="7" />
        <rect x="13" y="226" width="2" height="9" />
        <rect x="18" y="229" width="2" height="6" />
        <rect x="462" y="227" width="2" height="8" />
        <rect x="468" y="225" width="2" height="10" />
        <rect x="474" y="229" width="2" height="6" />
      </g>
      <g fill={C.sun}>
        <rect x="9" y="226" width="2" height="2" />
        <rect x="466" y="224" width="2" height="2" />
        <rect x="432" y="231" width="2" height="2" />
      </g>

      {/* ---------------------------------------------------------- bridge */}
      <g>
        <polygon points="206,237 274,237 294,268 186,268" fill={C.wood} />
        <polygon points="206,237 274,237 276,241 204,241" fill={C.woodDark} />
        <g stroke={C.woodDark} strokeWidth="1" opacity="0.85">
          <path d="M203 244 l88 0" />
          <path d="M201 249 l92 0" />
          <path d="M198 255 l98 0" />
          <path d="M195 261 l104 0" />
          <path d="M192 267 l110 0" />
        </g>

        {/* railings */}
        <polygon points="204,237 208,237 196,268 190,268" fill={C.woodDark} />
        <polygon points="272,237 276,237 290,268 284,268" fill={C.woodDark} />
        <g fill={C.wood}>
          <rect x="200" y="234" width="4" height="10" />
          <rect x="276" y="234" width="4" height="10" />
          <rect x="194" y="248" width="4" height="12" />
          <rect x="282" y="248" width="4" height="12" />
          <rect x="188" y="262" width="4" height="8" />
          <rect x="288" y="262" width="4" height="8" />
        </g>
        <polygon points="202,234 278,234 280,238 200,238" fill={C.wood} />
      </g>

      {/* people crossing the bridge */}
      <Person x={228} y={254} shirt="#E0A63F" className="scene-person" />
      <Person x={258} y={256} shirt="#C25B3F" className="scene-person" />

      {/* small banca on the river */}
      <g>
        <polygon points="338,254 380,254 374,260 344,260" fill={C.woodDark} />
        <rect x="342" y="252" width="32" height="2" fill={C.wood} />
        <Person x={356} y={252} shirt="#6C8C4E" className="scene-person" />
        <rect x="362" y="244" width="20" height="1" fill={C.wood} transform="rotate(-8 362 244)" />
      </g>

      {/* ------------------------------------------------- foreground bank */}
      <polygon points="0,268 480,268 480,270 0,270" fill={C.earthSoft} opacity="0.25" />
      <g fill={C.hillDark}>
        <rect x="0" y="258" width="24" height="12" />
        <rect x="18" y="252" width="10" height="8" />
        <rect x="444" y="256" width="36" height="14" />
        <rect x="456" y="250" width="12" height="8" />
      </g>
      <g fill={C.hill}>
        <rect x="4" y="260" width="8" height="4" />
        <rect x="26" y="262" width="10" height="4" />
        <rect x="450" y="260" width="10" height="4" />
      </g>

      {/* butterflies near the flowers */}
      <Butterfly x={136} y={214} tone={C.sun} />
      <Butterfly x={388} y={220} tone={C.cloud} />

      {/* ------------------------------------------------- discoverable spots */}
      <g className="scene-spot">
        <rect x="70" y="148" width="120" height="52" fill="transparent" />
        <SceneTip x={130} y={154} label="Our homes" />
      </g>
      <g className="scene-spot">
        <rect x="300" y="198" width="150" height="34" fill="transparent" />
        <SceneTip x={372} y={204} label="Our livelihood" />
      </g>
      <g className="scene-spot">
        <rect x="182" y="230" width="116" height="40" fill="transparent" />
        <SceneTip x={240} y={234} label="Our community" />
      </g>
    </svg>
  );
}

/**
 * A small top-down pixel map of Barangay Maporong — rice fields, the river,
 * the road, and the barangay hall. Used in the community section; the
 * surrounding card links out to Google Maps.
 */

const M = {
  paper: '#F7F1DF',
  grid: '#EADFC6',
  rice: '#E5B84D',
  riceDark: '#C79A38',
  crop: '#8DAF72',
  cropDark: '#6F9558',
  river: '#83C5E2',
  riverDark: '#63AECF',
  riverLight: '#B9E4F2',
  road: '#EEDCB5',
  roadLine: '#D9C39A',
  earth: '#354638',
  earthSoft: '#6B5A44',
  pine: '#386B48',
  cream: '#FAF6EB',
  straw: '#C9A96E',
} as const;

function House({
  x,
  y,
  roof = '#A9743F',
}: {
  x: number;
  y: number;
  roof?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-6" y="-4" width="12" height="7" fill={M.cream} />
      <polygon points="-8,-4 8,-4 5,-10 -5,-10" fill={roof} />
      <rect x="-1" y="0" width="2" height="3" fill={M.earthSoft} />
    </g>
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-1" y="0" width="2" height="4" fill={M.earthSoft} />
      <rect x="-4" y="-4" width="8" height="5" fill={M.cropDark} />
      <rect x="-2" y="-6" width="4" height="3" fill={M.pine} />
    </g>
  );
}

export function CommunityMap({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="320" height="220" fill={M.paper} />

      <g stroke={M.grid} strokeWidth="1" opacity="0.8">
        {Array.from({ length: 7 }, (_, index) => (
          <path key={`v-${index}`} d={`M${index * 46 + 12} 0 v220`} />
        ))}
        {Array.from({ length: 5 }, (_, index) => (
          <path key={`h-${index}`} d={`M0 ${index * 42 + 14} h320`} />
        ))}
      </g>

      {/* rice fields */}
      <g>
        <rect x="0" y="0" width="112" height="88" fill={M.rice} />
        {Array.from({ length: 7 }, (_, index) => (
          <rect key={`rice-a-${index}`} x="0" y={8 + index * 11} width="112" height="1" fill={M.riceDark} opacity="0.55" />
        ))}
        {Array.from({ length: 9 }, (_, index) => (
          <rect key={`rice-b-${index}`} x={6 + index * 12} y="0" width="1" height="88" fill={M.cropDark} opacity="0.35" />
        ))}

        <rect x="238" y="0" width="82" height="56" fill={M.crop} />
        {Array.from({ length: 5 }, (_, index) => (
          <rect key={`crop-${index}`} x="238" y={6 + index * 10} width="82" height="1" fill={M.cropDark} opacity="0.7" />
        ))}

        <rect x="0" y="178" width="86" height="42" fill={M.crop} />
        <rect x="238" y="180" width="82" height="40" fill={M.rice} />
        {Array.from({ length: 3 }, (_, index) => (
          <rect key={`rice-c-${index}`} x="238" y={188 + index * 10} width="82" height="1" fill={M.riceDark} opacity="0.55" />
        ))}
      </g>

      {/* river */}
      <polygon
        points="0,140 58,135 116,141 176,133 238,138 320,130 320,158 238,166 176,161 116,168 58,162 0,167"
        fill={M.river}
      />
      <g fill={M.riverLight} opacity="0.75">
        <rect x="14" y="148" width="42" height="2" />
        <rect x="78" y="154" width="34" height="2" />
        <rect x="144" y="147" width="26" height="2" />
        <rect x="214" y="150" width="46" height="2" />
        <rect x="262" y="156" width="30" height="2" />
      </g>
      <g fill={M.riverDark} opacity="0.55">
        <rect x="52" y="158" width="48" height="2" />
        <rect x="188" y="156" width="26" height="2" />
        <rect x="290" y="146" width="24" height="2" />
      </g>

      {/* roads */}
      <rect x="146" y="0" width="18" height="140" fill={M.road} />
      <rect x="0" y="96" width="320" height="14" fill={M.road} />
      <g fill={M.roadLine}>
        <rect x="154" y="4" width="2" height="8" />
        <rect x="154" y="20" width="2" height="8" />
        <rect x="154" y="36" width="2" height="8" />
        <rect x="154" y="52" width="2" height="8" />
        <rect x="154" y="68" width="2" height="8" />
        <rect x="154" y="84" width="2" height="8" />
        <rect x="6" y="102" width="8" height="2" />
        <rect x="22" y="102" width="8" height="2" />
        <rect x="38" y="102" width="8" height="2" />
        <rect x="54" y="102" width="8" height="2" />
        <rect x="70" y="102" width="8" height="2" />
        <rect x="86" y="102" width="8" height="2" />
        <rect x="102" y="102" width="8" height="2" />
        <rect x="118" y="102" width="8" height="2" />
        <rect x="186" y="102" width="8" height="2" />
        <rect x="202" y="102" width="8" height="2" />
        <rect x="218" y="102" width="8" height="2" />
        <rect x="234" y="102" width="8" height="2" />
        <rect x="250" y="102" width="8" height="2" />
        <rect x="266" y="102" width="8" height="2" />
        <rect x="282" y="102" width="8" height="2" />
        <rect x="298" y="102" width="8" height="2" />
      </g>

      {/* bridge over the river */}
      <g>
        <rect x="144" y="132" width="22" height="36" fill={M.straw} />
        <g stroke={M.earthSoft} strokeWidth="1" opacity="0.6">
          <path d="M144 138 h22" />
          <path d="M144 144 h22" />
          <path d="M144 150 h22" />
          <path d="M144 156 h22" />
          <path d="M144 162 h22" />
        </g>
      </g>

      {/* barangay hall + pin */}
      <g>
        <rect x="150" y="74" width="12" height="10" fill={M.straw} />
        <polygon points="146,74 166,74 161,64 151,64" fill="#A9743F" />
        <rect x="154" y="78" width="4" height="6" fill={M.earthSoft} />
        <rect x="150" y="74" width="12" height="1" fill={M.cream} opacity="0.7" />
      </g>

      {/* houses and trees */}
      <House x={62} y={122} />
      <House x={96} y={72} roof="#8C5C33" />
      <House x={210} y={72} />
      <House x={258} y={122} roof="#8C5C33" />
      <House x={112} y={186} roof="#A5673F" />
      <Tree x={36} y={120} />
      <Tree x={130} y={122} />
      <Tree x={196} y={92} />
      <Tree x={288} y={118} />
      <Tree x={224} y={188} />
      <Tree x={18} y={188} />

      {/* tiny people along the road */}
      <g>
        <rect x="180" y="101" width="2" height="4" fill="#C25B3F" />
        <rect x="181" y="99" width="1" height="1" fill={M.earth} />
        <rect x="198" y="102" width="2" height="4" fill="#4E7FA8" />
        <rect x="199" y="100" width="1" height="1" fill={M.earth} />
      </g>

      {/* destination pin */}
      <g transform="translate(156 70)">
        <g className="scene-person">
          <rect x="-1" y="0" width="2" height="10" fill={M.earth} opacity="0.25" />
          <rect x="-6" y="-14" width="12" height="8" fill={M.pine} />
          <rect x="-8" y="-11" width="16" height="6" fill={M.pine} />
          <rect x="-5" y="-7" width="10" height="5" fill={M.pine} />
          <rect x="-2" y="-3" width="4" height="4" fill={M.pine} />
          <rect x="-3" y="-11" width="6" height="5" fill={M.cream} />
        </g>
      </g>

      {/* compass and scale */}
      <g transform="translate(292 190)">
        <rect x="-2" y="-12" width="4" height="12" fill={M.earthSoft} />
        <polygon points="-6,-12 0,-20 6,-12" fill={M.earth} />
        <text x="0" y="8" textAnchor="middle" fontSize="6" fontWeight="700" fontFamily="Lato, sans-serif" fill={M.earthSoft}>
          N
        </text>
      </g>
      <g>
        <rect x="12" y="206" width="30" height="3" fill={M.earth} />
        <rect x="12" y="206" width="10" height="3" fill={M.cream} />
        <text x="47" y="209" fontSize="5" fontWeight="700" fontFamily="Lato, sans-serif" fill={M.earthSoft}>
          500 m
        </text>
      </g>

      {/* map labels */}
      <g fontFamily="Lato, sans-serif" fontWeight="700" fontSize="6" fill={M.earthSoft} opacity="0.75">
        <text x="12" y="16">RICE FIELDS</text>
        <text x="244" y="14">MAPORONG</text>
        <text x="240" y="88">OAS</text>
        <text x="14" y="134">RIVER</text>
      </g>
    </svg>
  );
}

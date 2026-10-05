import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function baseSvg(appName, accent1, accent2, headerContent, bodyContent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 2340" width="1080" height="2340">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#09090d"/>
      <stop offset="50%" stop-color="#0f0f18"/>
      <stop offset="100%" stop-color="#08080c"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent1}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#181824"/>
      <stop offset="100%" stop-color="#12121c"/>
    </linearGradient>
    <filter id="accentGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="${accent1}" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1080" height="2340" fill="url(#bgGrad)"/>
  <circle cx="920" cy="280" r="380" fill="${accent1}" opacity="0.12" filter="blur(90px)"/>
  <circle cx="120" cy="1200" r="350" fill="${accent2}" opacity="0.08" filter="blur(100px)"/>

  <!-- Top System Bar -->
  <g id="statusBar">
    <text x="70" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="700" fill="#ffffff">09:41</text>
    <circle cx="540" cy="70" r="22" fill="#000000"/>
    <circle cx="540" cy="70" r="23" stroke="#27272a" stroke-width="2" fill="none"/>
    <g transform="translate(860, 52)">
      <path d="M0,24 A18,18 0 0,1 26,24 M4,18 A24,24 0 0,1 22,18 M8,12 A30,30 0 0,1 18,12" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
      <text x="45" y="26" font-family="sans-serif" font-size="24" font-weight="900" fill="#ffffff">5G</text>
      <rect x="95" y="6" width="46" height="24" rx="6" stroke="#ffffff" stroke-width="3" fill="none"/>
      <rect x="142" y="14" width="4" height="8" rx="2" fill="#ffffff"/>
      <rect x="99" y="10" width="34" height="16" rx="3" fill="#10b981"/>
    </g>
  </g>

  <!-- App Header -->
  <g id="appHeader" transform="translate(60, 130)">
    <rect x="0" y="0" width="70" height="70" rx="20" fill="url(#accentGrad)" filter="url(#accentGlow)"/>
    <text x="88" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="-0.5">${appName}</text>
    ${headerContent}
  </g>

  <!-- Main Body Content -->
  ${bodyContent}

  <!-- Android Navigation Bar (Gesture bar) -->
  <g id="navBar" transform="translate(0, 2260)">
    <rect x="390" y="40" width="300" height="8" rx="4" fill="#a1a1aa" opacity="0.6"/>
  </g>
</svg>`;
}

const screenshots = [
  // Aegis Authenticator
  {
    name: 'aegis-vault.svg',
    svg: baseSvg(
      'Aegis <tspan fill="#06b6d4">Vault</tspan>',
      '#06b6d4',
      '#3b82f6',
      `<rect x="330" y="14" width="160" height="42" rx="21" fill="#047857"/>
       <text x="410" y="42" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">ENCRYPTED</text>`,
      `<g transform="translate(60, 240)">
        <rect width="960" height="80" rx="24" fill="#181824" stroke="#27272a" stroke-width="2"/>
        <text x="60" y="52" font-family="sans-serif" font-size="30" fill="#71717a">Search 2FA tokens &amp; accounts...</text>
       </g>
       <g transform="translate(60, 360)">
        <!-- Token 1: GitHub -->
        <rect width="960" height="220" rx="28" fill="#181824" stroke="#06b6d4" stroke-width="2"/>
        <circle cx="80" cy="110" r="45" fill="#27272a"/>
        <text x="80" y="122" font-family="sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">GH</text>
        <text x="160" y="90" font-family="sans-serif" font-size="38" font-weight="bold" fill="#ffffff">GitHub</text>
        <text x="160" y="140" font-family="sans-serif" font-size="28" fill="#a1a1aa">shubhmboghara</text>
        <text x="680" y="125" font-family="monospace" font-size="56" font-weight="900" fill="#06b6d4">849 203</text>
        <circle cx="910" cy="110" r="22" stroke="#06b6d4" stroke-width="5" fill="none" stroke-dasharray="100 38"/>

        <!-- Token 2: Google Workspace -->
        <g transform="translate(0, 250)">
          <rect width="960" height="220" rx="28" fill="#181824" stroke="#27272a" stroke-width="2"/>
          <circle cx="80" cy="110" r="45" fill="#27272a"/>
          <text x="80" y="122" font-family="sans-serif" font-size="36" font-weight="bold" fill="#ea4335" text-anchor="middle">G</text>
          <text x="160" y="90" font-family="sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Google Cloud</text>
          <text x="160" y="140" font-family="sans-serif" font-size="28" fill="#a1a1aa">admin@crazystore.org</text>
          <text x="680" y="125" font-family="monospace" font-size="56" font-weight="900" fill="#3b82f6">319 780</text>
          <circle cx="910" cy="110" r="22" stroke="#3b82f6" stroke-width="5" fill="none" stroke-dasharray="80 58"/>
        </g>

        <!-- Token 3: AWS -->
        <g transform="translate(0, 500)">
          <rect width="960" height="220" rx="28" fill="#181824" stroke="#27272a" stroke-width="2"/>
          <circle cx="80" cy="110" r="45" fill="#27272a"/>
          <text x="80" y="122" font-family="sans-serif" font-size="32" font-weight="bold" fill="#f59e0b" text-anchor="middle">AWS</text>
          <text x="160" y="90" font-family="sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Amazon Web Services</text>
          <text x="160" y="140" font-family="sans-serif" font-size="28" fill="#a1a1aa">root-mfa-device</text>
          <text x="680" y="125" font-family="monospace" font-size="56" font-weight="900" fill="#10b981">620 411</text>
          <circle cx="910" cy="110" r="22" stroke="#10b981" stroke-width="5" fill="none" stroke-dasharray="120 18"/>
        </g>
       </g>`
    )
  },
  {
    name: 'aegis-security.svg',
    svg: baseSvg(
      'Aegis <tspan fill="#10b981">Security</tspan>',
      '#10b981',
      '#06b6d4',
      `<rect x="360" y="14" width="180" height="42" rx="21" fill="#065f46"/>
       <text x="450" y="42" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">AES-GCM-256</text>`,
      `<g transform="translate(60, 240)">
        <rect width="960" height="400" rx="32" fill="#181824" stroke="#10b981" stroke-width="2"/>
        <text x="60" y="90" font-family="sans-serif" font-size="44" font-weight="bold" fill="#ffffff">Biometric Vault Lock</text>
        <text x="60" y="150" font-family="sans-serif" font-size="28" fill="#a1a1aa">Hardware-backed Android Keystore + BiometricPrompt</text>
        <circle cx="480" cy="270" r="60" fill="#10b981" opacity="0.2"/>
        <circle cx="480" cy="270" r="45" stroke="#10b981" stroke-width="4" fill="none"/>
       </g>
       <g transform="translate(60, 680)">
        <rect width="960" height="300" rx="32" fill="#181824" stroke="#27272a" stroke-width="2"/>
        <text x="60" y="80" font-family="sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Encrypted Automated Backups</text>
        <text x="60" y="130" font-family="sans-serif" font-size="28" fill="#a1a1aa">Zero-knowledge local and cloud target encryption</text>
        <rect x="60" y="180" width="300" height="60" rx="16" fill="#10b981"/>
        <text x="210" y="222" font-family="sans-serif" font-size="26" font-weight="bold" fill="#09090d" text-anchor="middle">Configure Backup</text>
       </g>`
    )
  },
  // NewPipe
  {
    name: 'newpipe-stream.svg',
    svg: baseSvg(
      'New<tspan fill="#ef4444">Pipe</tspan>',
      '#ef4444',
      '#f97316',
      `<rect x="270" y="14" width="160" height="42" rx="21" fill="#991b1b"/>
       <text x="350" y="42" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">ZERO PLAY SVCS</text>`,
      `<g transform="translate(60, 240)">
        <rect width="960" height="520" rx="32" fill="#181824" stroke="#ef4444" stroke-width="2"/>
        <polygon points="440,220 540,280 440,340" fill="#ef4444"/>
        <rect x="0" y="420" width="960" height="100" rx="0 0 32 32" fill="#12121c"/>
        <text x="40" y="480" font-family="sans-serif" font-size="34" font-weight="bold" fill="#ffffff">4K 60fps HDR · No Google Tracking</text>
       </g>
       <g transform="translate(60, 800)">
        <rect width="960" height="180" rx="24" fill="#181824" stroke="#27272a" stroke-width="2"/>
        <text x="40" y="70" font-family="sans-serif" font-size="32" font-weight="bold" fill="#ffffff">Background Audio &amp; Pop-up PiP</text>
        <text x="40" y="120" font-family="sans-serif" font-size="26" fill="#a1a1aa">Listen to podcasts or watch in a floating window while multitasking</text>
       </g>`
    )
  },
  // Organic Maps
  {
    name: 'organicmaps-map.svg',
    svg: baseSvg(
      'Organic <tspan fill="#10b981">Maps</tspan>',
      '#10b981',
      '#14b8a6',
      `<rect x="360" y="14" width="160" height="42" rx="21" fill="#065f46"/>
       <text x="440" y="42" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">100% OFFLINE</text>`,
      `<g transform="translate(60, 240)">
        <rect width="960" height="640" rx="32" fill="#152e25" stroke="#10b981" stroke-width="2"/>
        <path d="M100,500 Q 300,200 500,350 T 900,200" stroke="#10b981" stroke-width="12" fill="none" stroke-linecap="round"/>
        <circle cx="500" cy="350" r="28" fill="#3b82f6" stroke="#ffffff" stroke-width="6"/>
        <rect x="40" y="40" width="340" height="70" rx="20" fill="#0f172a" opacity="0.85"/>
        <text x="70" y="86" font-family="sans-serif" font-size="30" font-weight="bold" fill="#10b981">Turn right in 250m</text>
       </g>
       <g transform="translate(60, 920)">
        <rect width="960" height="180" rx="24" fill="#181824" stroke="#27272a" stroke-width="2"/>
        <text x="40" y="70" font-family="sans-serif" font-size="32" font-weight="bold" fill="#ffffff">OpenStreetMap Community Driven</text>
        <text x="40" y="120" font-family="sans-serif" font-size="26" fill="#a1a1aa">Zero telemetry, zero battery drain, worldwide offline terrain maps</text>
       </g>`
    )
  },
  // Seal
  {
    name: 'seal-main.svg',
    svg: baseSvg(
      'Seal <tspan fill="#ec4899">Media</tspan>',
      '#ec4899',
      '#a855f7',
      `<rect x="300" y="14" width="160" height="42" rx="21" fill="#831843"/>
       <text x="380" y="42" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">YT-DLP CORE</text>`,
      `<g transform="translate(60, 240)">
        <rect width="960" height="240" rx="32" fill="#181824" stroke="#ec4899" stroke-width="2"/>
        <text x="40" y="70" font-family="sans-serif" font-size="30" fill="#a1a1aa">Paste media or playlist URL</text>
        <rect x="40" y="110" width="880" height="80" rx="20" fill="#27272a"/>
        <text x="70" y="160" font-family="monospace" font-size="28" fill="#f43f5e">https://youtube.com/watch?v=...</text>
       </g>
       <g transform="translate(60, 520)">
        <rect width="960" height="340" rx="32" fill="#181824" stroke="#27272a" stroke-width="2"/>
        <text x="40" y="80" font-family="sans-serif" font-size="36" font-weight="bold" fill="#ffffff">Format Selection &amp; FFmpeg</text>
        <rect x="40" y="130" width="260" height="60" rx="16" fill="#ec4899"/>
        <text x="170" y="172" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">Video (4K / 1080p)</text>
        <rect x="330" y="130" width="260" height="60" rx="16" fill="#27272a"/>
        <text x="460" y="172" font-family="sans-serif" font-size="26" font-weight="bold" fill="#a1a1aa" text-anchor="middle">Audio (Opus / FLAC)</text>
       </g>`
    )
  },
  // RetroArch
  {
    name: 'retroarch-menu.svg',
    svg: baseSvg(
      'Retro<tspan fill="#f59e0b">Arch</tspan>',
      '#f59e0b',
      '#ef4444',
      `<rect x="300" y="14" width="160" height="42" rx="21" fill="#78350f"/>
       <text x="380" y="42" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">LIBRETRO</text>`,
      `<g transform="translate(60, 240)">
        <rect width="960" height="460" rx="32" fill="#181824" stroke="#f59e0b" stroke-width="2"/>
        <text x="40" y="80" font-family="sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Load Core &amp; Emulation Matrix</text>
        <text x="40" y="140" font-family="sans-serif" font-size="30" fill="#f59e0b">► Nintendo 64 (Mupen64Plus-Next)</text>
        <text x="40" y="200" font-family="sans-serif" font-size="30" fill="#a1a1aa">  Sony PlayStation (Beetle PSX HW)</text>
        <text x="40" y="260" font-family="sans-serif" font-size="30" fill="#a1a1aa">  Game Boy Advance (mGBA)</text>
        <text x="40" y="320" font-family="sans-serif" font-size="30" fill="#a1a1aa">  Arcade (FBNeo)</text>
       </g>`
    )
  },
  // Joplin
  {
    name: 'joplin-notes.svg',
    svg: baseSvg(
      'Joplin <tspan fill="#3b82f6">Notes</tspan>',
      '#3b82f6',
      '#6366f1',
      `<rect x="310" y="14" width="160" height="42" rx="21" fill="#1e3a8a"/>
       <text x="390" y="42" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">E2E ENCRYPTED</text>`,
      `<g transform="translate(60, 240)">
        <rect width="960" height="500" rx="32" fill="#181824" stroke="#3b82f6" stroke-width="2"/>
        <text x="40" y="80" font-family="sans-serif" font-size="38" font-weight="bold" fill="#ffffff">Markdown &amp; Cloud Sync</text>
        <text x="40" y="140" font-family="monospace" font-size="28" fill="#93c5fd"># Project Architecture &amp; Roadmap</text>
        <text x="40" y="190" font-family="monospace" font-size="26" fill="#a1a1aa">- [x] Zero-knowledge encryption</text>
        <text x="40" y="240" font-family="monospace" font-size="26" fill="#a1a1aa">- [x] WebDAV &amp; Nextcloud sync</text>
        <text x="40" y="290" font-family="monospace" font-size="26" fill="#a1a1aa">- [ ] Geolocation tagging</text>
       </g>`
    )
  },
  // AntennaPod
  {
    name: 'antennapod-player.svg',
    svg: baseSvg(
      'Antenna<tspan fill="#8b5cf6">Pod</tspan>',
      '#8b5cf6',
      '#ec4899',
      `<rect x="320" y="14" width="160" height="42" rx="21" fill="#581c87"/>
       <text x="400" y="42" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">RSS &amp; CHAPTERS</text>`,
      `<g transform="translate(60, 240)">
        <rect width="960" height="520" rx="32" fill="#181824" stroke="#8b5cf6" stroke-width="2"/>
        <circle cx="480" cy="200" r="110" fill="#2e1065"/>
        <text x="480" y="215" font-family="sans-serif" font-size="44" font-weight="bold" fill="#c084fc" text-anchor="middle">PODCAST</text>
        <text x="480" y="380" font-family="sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">Deep Dive into Modern Systems</text>
        <text x="480" y="430" font-family="sans-serif" font-size="28" fill="#a1a1aa" text-anchor="middle">Episode 142 · Variable Speed 1.4x</text>
       </g>`
    )
  },
  // Termux
  {
    name: 'termux-shell.svg',
    svg: baseSvg(
      'Termux <tspan fill="#10b981">Terminal</tspan>',
      '#10b981',
      '#059669',
      `<rect x="370" y="14" width="160" height="42" rx="21" fill="#064e3b"/>
       <text x="450" y="42" font-family="sans-serif" font-size="20" font-weight="800" fill="#ffffff" text-anchor="middle">POSIX LINUX</text>`,
      `<g transform="translate(60, 240)">
        <rect width="960" height="600" rx="24" fill="#000000" stroke="#10b981" stroke-width="2"/>
        <text x="30" y="70" font-family="monospace" font-size="26" fill="#10b981">$ uname -a</text>
        <text x="30" y="115" font-family="monospace" font-size="24" fill="#a1a1aa">Linux localhost 6.1.0-android14-arm64 #1 SMP PREEMPT</text>
        <text x="30" y="180" font-family="monospace" font-size="26" fill="#10b981">$ pkg update &amp;&amp; pkg install git nodejs clang</text>
        <text x="30" y="225" font-family="monospace" font-size="24" fill="#a1a1aa">Unpacking nodejs-lts (22.12.0)...</text>
        <text x="30" y="270" font-family="monospace" font-size="24" fill="#a1a1aa">Setting up build tools for arm64-v8a...</text>
        <text x="30" y="340" font-family="monospace" font-size="26" fill="#10b981">$ crazystore run --production</text>
        <text x="30" y="385" font-family="monospace" font-size="24" fill="#06b6d4">✓ CrazyStore Linux Runtime Active [PID 4108]</text>
        <rect x="30" y="430" width="16" height="30" fill="#10b981"/>
       </g>`
    )
  }
];

for (const sc of screenshots) {
  const filePath = path.join(outDir, sc.name);
  fs.writeFileSync(filePath, sc.svg, 'utf-8');
  console.log(`Generated: ${sc.name}`);
}

console.log('All SVG screenshots generated successfully!');

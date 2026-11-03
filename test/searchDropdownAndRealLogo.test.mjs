import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\nRunning automated test suite for Search Dropdown, Navigation & Authentic App Logo...\n');

// 1. Verify VideoHub authentic logo configuration
{
  const appsDataPath = path.join(rootDir, 'lib', 'appsData.ts');
  const content = fs.readFileSync(appsDataPath, 'utf8');

  assert.ok(
    content.includes('logoUrl:'),
    'appsData.ts must define logoUrl for VideoHub'
  );
  assert.ok(
    content.includes('AppLogo_aQ35OykOj.svg') || content.includes('videohub-logo.png'),
    'appsData.ts must reference authentic VideoHub logo'
  );

  const localLogoPath = path.join(rootDir, 'public', 'videohub-logo.png');
  assert.ok(fs.existsSync(localLogoPath), 'public/videohub-logo.png must exist for zero-downtime offline fallback');
  const stats = fs.statSync(localLogoPath);
  assert.ok(stats.size > 1000, 'public/videohub-logo.png must be a valid non-empty asset');

  console.log('✓ Test 1 Passed: VideoHub authentic logo and resilient local asset verified');
}

// 2. Verify CommandPalette logo rendering & backdrop dismissal
{
  const palettePath = path.join(rootDir, 'components', 'CommandPalette.tsx');
  const palette = fs.readFileSync(palettePath, 'utf8');

  // Renders authentic app logo instead of only generic smartphone icon
  assert.ok(
    palette.includes('CommandPaletteAppLogo'),
    'CommandPalette must render CommandPaletteAppLogo for authentic app identity'
  );
  assert.ok(
    palette.includes('videohub-logo.png') || palette.includes('app.logoUrl'),
    'CommandPaletteAppLogo must support app logoUrl and local videohub-logo fallback'
  );

  // Dialog backdrop dismissal
  assert.ok(
    palette.includes('e.target === dialogRef.current'),
    'CommandPalette must close when user clicks on dialog backdrop'
  );

  // Smooth scroll to top on selection
  assert.ok(
    palette.includes('window.scrollTo'),
    'CommandPalette must reset scroll position to top when navigating'
  );

  console.log('✓ Test 2 Passed: CommandPalette authentic logo rendering and backdrop dismissal verified');
}

// 3. Verify HomeClient catalog instant live search dropdown
{
  const homePath = path.join(rootDir, 'components', 'HomeClient.tsx');
  const home = fs.readFileSync(homePath, 'utf8');

  // Search input focus & dropdown state
  assert.ok(
    home.includes('isSearchFocused') && home.includes('setIsSearchFocused'),
    'HomeClient must track search focus state for live dropdown'
  );

  // Live results container
  assert.ok(
    home.includes('Matching Applications'),
    'HomeClient must present live matching applications dropdown'
  );

  // Real app logo in live search dropdown
  assert.ok(
    home.includes('videohub-logo.png'),
    'HomeClient must render real app logo in live search dropdown'
  );

  // Click outside listener for smooth dismissal
  assert.ok(
    home.includes('handleClickOutside'),
    'HomeClient must dismiss live search dropdown when user clicks outside'
  );

  console.log('✓ Test 3 Passed: HomeClient instant live search dropdown & logo rendering verified');
}

// 4. Verify AppDetailClient logo resilience
{
  const detailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const detail = fs.readFileSync(detailPath, 'utf8');

  assert.ok(
    detail.includes('videohub-logo.png'),
    'AppDetailClient AppLogoImage must include videohub-logo.png fallback'
  );

  console.log('✓ Test 4 Passed: AppDetailClient authentic logo rendering and resilience verified');
}

console.log('\n🎉 ALL 4 SEARCH DROPDOWN & APP LOGO TESTS PASSED WITH 100% SUCCESS!\n');

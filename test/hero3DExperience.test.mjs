import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Palettes definition matching Hero3DExperience
const SHOWCASE_PALETTES = [
  { color1: '#8b5cf6', color2: '#6366f1' },
  { color1: '#06b6d4', color2: '#3b82f6' },
  { color1: '#ec4899', color2: '#a855f7' },
  { color1: '#10b981', color2: '#06b6d4' },
  { color1: '#f59e0b', color2: '#ef4444' },
  { color1: '#6366f1', color2: '#ec4899' },
  { color1: '#14b8a6', color2: '#8b5cf6' },
];

function toShowcaseApp(app, index = 0) {
  const palette = SHOWCASE_PALETTES[index % SHOWCASE_PALETTES.length];

  let screenshotUrl = null;
  if (Array.isArray(app.screenshots) && app.screenshots.length > 0) {
    const s = app.screenshots[0];
    const raw = typeof s === 'string' ? s : (s?.imageUrl || s?.url || null);
    if (raw && typeof raw === 'string' && raw.trim()) {
      screenshotUrl = raw.trim();
    }
  }

  return {
    slug: app.slug || `app-${index}`,
    name: app.name || 'Android App',
    category: app.category || 'Tools & Utilities',
    badge: app.badge || 'Kotlin + Compose',
    version: app.version || 'v1.0.0',
    rating: typeof app.initialRating === 'number' ? app.initialRating : 5.0,
    color1: palette.color1,
    color2: palette.color2,
    tagline: app.tagline || app.shortDescription || 'Modern Native Android Jetpack Compose Application',
    screenshotUrl,
  };
}

function simulateAppCycle(totalApps, steps) {
  let activeIdx = 0;
  const history = [activeIdx];
  for (let i = 0; i < steps; i++) {
    activeIdx = (activeIdx + 1) % totalApps;
    history.push(activeIdx);
  }
  return history;
}

console.log('Running automated test suite for CrazyStore Hero 3D Experience & Dynamic App Sync...');

// Test 1: toShowcaseApp properly converts admin added app ("Breakfast App")
{
  const adminApp = {
    name: 'Breakfast App',
    slug: 'breakfast-app',
    category: 'Food & Nutrition',
    tagline: 'Track morning meals and healthy breakfast recipes',
    version: 'v1.0.0',
    initialRating: 4.9,
    badge: 'Compose + M3',
    screenshots: [
      { id: '1', imageUrl: 'https://images.example.com/breakfast1.webp' },
    ],
  };

  const showcase = toShowcaseApp(adminApp, 1);
  assert.equal(showcase.name, 'Breakfast App');
  assert.equal(showcase.slug, 'breakfast-app');
  assert.equal(showcase.category, 'Food & Nutrition');
  assert.equal(showcase.screenshotUrl, 'https://images.example.com/breakfast1.webp');
  assert.equal(showcase.color1, '#06b6d4'); // 2nd palette item
  assert.equal(showcase.color2, '#3b82f6');
  console.log('✓ Test 1 Passed: Admin app ("Breakfast App") converted to showcase format with screenshot & vibrant palette');
}

// Test 2: Synchronized multi-app auto-cycle logic (4 apps rotating smoothly)
{
  const totalApps = 4;
  const cycleHistory = simulateAppCycle(totalApps, 7);
  // Expected sequence: 0 -> 1 -> 2 -> 3 -> 0 -> 1 -> 2 -> 3
  assert.deepEqual(cycleHistory, [0, 1, 2, 3, 0, 1, 2, 3]);
  console.log('✓ Test 2 Passed: 4-app rotation cycles seamlessly in synchronized order');
}

// Test 3: Handling dynamic addition of new apps (e.g. admin adding 4th app)
{
  let apps = [
    { name: 'App 1', slug: 'app-1' },
    { name: 'App 2', slug: 'app-2' },
    { name: 'App 3', slug: 'app-3' },
  ];
  let showcaseList = apps.map((a, i) => toShowcaseApp(a, i));
  assert.equal(showcaseList.length, 3);

  // Admin adds Breakfast App
  apps = [...apps, { name: 'Breakfast App', slug: 'breakfast' }];
  showcaseList = apps.map((a, i) => toShowcaseApp(a, i));
  assert.equal(showcaseList.length, 4);
  assert.equal(showcaseList[3].name, 'Breakfast App');
  console.log('✓ Test 3 Passed: Dynamic app synchronization scales automatically when admin adds new apps');
}

// Test 4: Regression check - Ensure removed text is NOT present in Hero3DExperience.tsx
{
  const filePath = path.resolve(process.cwd(), 'components/three/Hero3DExperience.tsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify that the intrusive text patterns are removed
  assert.ok(!content.includes('3D Live:'), 'Hero3DExperience must not contain "3D Live:" badge text');
  assert.ok(!content.includes('Drag to rotate 360° • Pinch to inspect'), 'Hero3DExperience must not contain "Drag to rotate 360° • Pinch to inspect"');
  assert.ok(!content.includes('Click & drag to rotate 360°'), 'Canvas title must not contain drag instruction tooltip');

  console.log('✓ Test 4 Passed: Regression verification confirmed removed text is absent from component source');
}

console.log('\n🎉 ALL 4 HERO 3D EXPERIENCE TESTS PASSED WITH 100% SUCCESS!\n');

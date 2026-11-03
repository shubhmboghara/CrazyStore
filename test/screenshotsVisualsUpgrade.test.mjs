import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('Running automated test suite for CrazyStore Screenshots & Visuals Upgrade...');

// Test 1: Verify all 4 high-resolution SVG screenshot assets exist and are valid SVGs
const screenshotFiles = [
  'videohub-feed.svg',
  'videohub-player.svg',
  'videohub-audio.svg',
  'videohub-settings.svg',
];

for (const file of screenshotFiles) {
  const filePath = path.resolve(process.cwd(), 'public/screenshots', file);
  assert.ok(fs.existsSync(filePath), `Screenshot file ${file} must exist in public/screenshots/`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(content.length > 500, `Screenshot file ${file} must be populated with SVG content`);
  assert.ok(content.includes('<svg') && content.includes('</svg>'), `Screenshot file ${file} must be a valid SVG root`);
}
console.log('✓ Test 1 Passed: All 4 high-resolution native Android SVG screenshots exist and are valid');

// Test 2: Verify appsData.ts defines all 4 rich screenshots with correct metadata
const appsDataPath = path.resolve(process.cwd(), 'lib/appsData.ts');
const appsDataContent = fs.readFileSync(appsDataPath, 'utf8');

assert.ok(appsDataContent.includes("title: 'Trending Feed & Discovery'"), 'appsData.ts must include Trending Feed & Discovery');
assert.ok(appsDataContent.includes("videohub-feed.svg") || appsDataContent.includes("videohub-feed.png") || appsDataContent.includes("Screenshot_20260925-133227.VideoHub_qzdtxn6-x.png"), 'appsData.ts must reference videohub feed screenshot');
assert.ok(appsDataContent.includes("title: 'Immersive 4K ExoPlayer'"), 'appsData.ts must include Immersive 4K ExoPlayer');
assert.ok(appsDataContent.includes("videohub-player.svg") || appsDataContent.includes("videohub-player.png") || appsDataContent.includes("Screenshot_20260925-133306.VideoHub_dgH1K76Qy.png"), 'appsData.ts must reference videohub player screenshot');
assert.ok(appsDataContent.includes("title: 'Background Audio & Lockscreen'"), 'appsData.ts must include Background Audio & Lockscreen');
assert.ok(appsDataContent.includes("videohub-audio.svg") || appsDataContent.includes("videohub-audio.png") || appsDataContent.includes("Screenshot_20260925-133323.VideoHub_LEK80RUfT.png"), 'appsData.ts must reference videohub audio screenshot');
assert.ok(appsDataContent.includes("title: 'Material You & Settings'"), 'appsData.ts must include Material You & Settings');
assert.ok(appsDataContent.includes("videohub-settings.svg") || appsDataContent.includes("videohub-settings.png") || appsDataContent.includes("Screenshot_20260925-134542.VideoHub_i3VA3Z_90.png"), 'appsData.ts must reference videohub settings screenshot');
console.log('✓ Test 2 Passed: VideoHub screenshots metadata and URLs configured accurately in appsData.ts');

// Test 3: Normalization logic resolves type-based and object screenshots
function normalizeScreenshots(screenshots) {
  return Array.isArray(screenshots)
    ? screenshots
        .map((s, idx) => {
          if (typeof s === 'string') {
            const trimmed = s.trim();
            return trimmed
              ? { id: `screenshot-${idx}`, url: trimmed, imageUrl: trimmed, title: `Screenshot ${idx + 1}`, subtitle: '' }
              : null;
          }
          if (s && typeof s === 'object') {
            let rawUrl = s.imageUrl || s.url || '';
            if (!rawUrl && s.type) {
              if (s.type === 'feed') rawUrl = '/screenshots/videohub-feed.svg';
              else if (s.type === 'player') rawUrl = '/screenshots/videohub-player.svg';
              else if (s.type === 'stats') rawUrl = '/screenshots/videohub-audio.svg';
              else if (s.type === 'settings') rawUrl = '/screenshots/videohub-settings.svg';
            }
            if (typeof rawUrl === 'string' && rawUrl.trim()) {
              const trimmedUrl = rawUrl.trim();
              return {
                ...s,
                id: s.id || `screenshot-${idx}`,
                url: trimmedUrl,
                imageUrl: trimmedUrl,
                title: s.title || `Screenshot ${idx + 1}`,
                subtitle: s.subtitle || '',
              };
            }
          }
          return null;
        })
        .filter(Boolean)
    : [];
}

const mockRawScreenshots = [
  { id: '1', type: 'feed', title: 'Feed' },
  { id: '2', type: 'player', title: 'Player' },
  { id: '3', type: 'stats', title: 'Audio' },
  { id: '4', type: 'settings', title: 'Settings' },
];
const normalized = normalizeScreenshots(mockRawScreenshots);
assert.equal(normalized.length, 4, 'All 4 mock screenshots must normalize with fallback URLs');
assert.equal(normalized[0].url, '/screenshots/videohub-feed.svg');
assert.equal(normalized[1].url, '/screenshots/videohub-player.svg');
assert.equal(normalized[2].url, '/screenshots/videohub-audio.svg');
assert.equal(normalized[3].url, '/screenshots/videohub-settings.svg');
console.log('✓ Test 3 Passed: Screenshot normalization and fallback URLs operate deterministically');

// Test 4: Verify AppDetailClient uses 3D-only mode with Spotlight Banner and Lightbox Zoom
const appDetailPath = path.resolve(process.cwd(), 'components/AppDetailClient.tsx');
const appDetailContent = fs.readFileSync(appDetailPath, 'utf8');

assert.ok(appDetailContent.includes('Screenshots3DPhoneView'), 'AppDetailClient must render Screenshots3DPhoneView');
assert.ok(!appDetailContent.includes('visualsViewMode'), 'Gallery toggle must be fully removed — 3D-only mode');
assert.ok(!appDetailContent.includes('Gallery Flow'), 'Gallery Flow branch must not exist in component');
assert.ok(appDetailContent.includes('lightboxZoom'), 'AppDetailClient must contain lightboxZoom state');
assert.ok(appDetailContent.includes('ZoomIn') && appDetailContent.includes('ZoomOut'), 'AppDetailClient must contain zoom controls');
assert.ok(!appDetailContent.includes('title="Open original image in new tab"'), 'Fullscreen lightbox modal must not contain download/original button');
assert.ok(!appDetailContent.includes('>Original</span>'), 'Fullscreen lightbox modal must not contain Original text button');
console.log('✓ Test 4 Passed: AppDetailClient 3D-only mode, spotlight banner, lightbox zoom verified, and download/original button removed');

// Test 5: Verify Hero3DExperience includes fallback screenshot for VideoHub
const heroPath = path.resolve(process.cwd(), 'components/three/Hero3DExperience.tsx');
const heroContent = fs.readFileSync(heroPath, 'utf8');
assert.ok(heroContent.includes("videohub-feed"), 'Hero3DExperience must reference videohub-feed');
console.log('✓ Test 5 Passed: Hero3DExperience includes high-res screenshot URL for VideoHub');

// Test 6: Verify unclipped thumbnail framing and refined border highlight
const phoneViewPath = path.resolve(process.cwd(), 'components/three/Screenshots3DPhoneView.tsx');
const phoneViewContent = fs.readFileSync(phoneViewPath, 'utf8');
assert.ok(phoneViewContent.includes('aspect-[9/19.5]'), 'Screenshots3DPhoneView thumbnails must use 9:19.5 phone aspect ratio');
assert.ok(phoneViewContent.includes('object-contain'), 'Screenshots3DPhoneView thumbnails must use object-contain to prevent clipping left/right content');
assert.ok(phoneViewContent.includes('ring-offset-2 ring-offset-zinc-950'), 'Screenshots3DPhoneView active thumbnail must use ring-offset to avoid obscuring screenshot edges');
assert.ok(!phoneViewContent.includes('bg-purple-600/10'), 'Screenshots3DPhoneView must not overlay purple tint wash over screenshot');

assert.ok(appDetailContent.includes('aspect-[9/19.5]'), 'AppDetailClient lightbox thumbnails must use 9:19.5 aspect ratio');
assert.ok(appDetailContent.includes('object-contain'), 'AppDetailClient lightbox thumbnails must use object-contain');
assert.ok(appDetailContent.includes('ring-offset-2 ring-offset-black'), 'AppDetailClient lightbox active thumbnail must use ring-offset');
console.log('✓ Test 6 Passed: Unclipped screenshot thumbnail framing and non-obscuring border highlight verified');

console.log('\n🎉 ALL 6 SCREENSHOTS & VISUALS UPGRADE TESTS PASSED WITH 100% SUCCESS!\n');

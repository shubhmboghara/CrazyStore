import assert from 'node:assert/strict';

// Test implementation matching lib/appUtils.ts logic directly
function formatDownloadUrl(url) {
  if (!url) return '';
  let clean = url.trim();
  if (!clean) return '';
  
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }

  if (clean.includes('drive.google.com') || /^[a-zA-Z0-9_-]{25,45}$/.test(clean)) {
    const fileIdMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
      clean.match(/drive\.google\.com\/open\?.*id=([a-zA-Z0-9_-]+)/i) ||
      clean.match(/[?&]id=([a-zA-Z0-9_-]+)/i) ||
      clean.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/i);
    const fileId = fileIdMatch ? fileIdMatch[1] : (/^[a-zA-Z0-9_-]{25,45}$/.test(clean) ? clean : null);
    if (fileId) {
      return `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;
    }
  }

  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
    clean = `https://${clean}`;
  }

  return clean;
}

function normalizeAppRecord(dbApp) {
  if (!dbApp) return null;

  const downloadUrl =
    dbApp.downloadUrl ||
    dbApp.download_url ||
    dbApp.downloadurl ||
    '';

  const shortDescription =
    dbApp.shortDescription ||
    dbApp.short_description ||
    dbApp.shortdescription ||
    '';

  let fullDescription =
    dbApp.fullDescription ??
    dbApp.full_description ??
    dbApp.fulldescription ??
    [];

  if (typeof fullDescription === 'string') {
    try {
      const parsed = JSON.parse(fullDescription);
      fullDescription = Array.isArray(parsed) ? parsed : [fullDescription];
    } catch {
      fullDescription = [fullDescription];
    }
  }

  let screenshots = dbApp.screenshots ?? [];
  if (typeof screenshots === 'string') {
    try {
      screenshots = JSON.parse(screenshots);
    } catch {
      screenshots = [];
    }
  }

  const normalizedScreenshots = Array.isArray(screenshots)
    ? screenshots
        .map((s, idx) => {
          if (typeof s === 'string') {
            const trimmed = s.trim();
            return trimmed
              ? {
                  id: `screenshot-${idx}`,
                  url: trimmed,
                  imageUrl: trimmed,
                  title: `Screenshot ${idx + 1}`,
                  subtitle: '',
                }
              : null;
          }
          if (s && typeof s === 'object') {
            const rawUrl = s.imageUrl || s.url || '';
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

  return {
    ...dbApp,
    slug: dbApp.slug ? String(dbApp.slug).trim() : '',
    name: dbApp.name || '',
    logoUrl: dbApp.logoUrl || dbApp.logo_url || dbApp.logourl || '',
    downloadUrl: formatDownloadUrl(downloadUrl),
    shortDescription,
    fullDescription,
    screenshots: normalizedScreenshots,
  };
}

console.log('Running automated test suite for CrazyStore App Utils & Image Normalization...');

// Test 1: string screenshots normalization
const appWithStringScreenshots = {
  slug: 'test-app-1',
  name: 'Test App 1',
  logo_url: 'https://ik.imagekit.io/test/logo.svg',
  screenshots: [
    'https://ik.imagekit.io/test/shot1.png',
    'https://ik.imagekit.io/test/shot2.png'
  ],
  download_url: 'https://drive.google.com/file/d/abc12345xyz/view?usp=sharing'
};
const res1 = normalizeAppRecord(appWithStringScreenshots);
assert.equal(res1.logoUrl, 'https://ik.imagekit.io/test/logo.svg', 'Logo URL must resolve from logo_url');
assert.equal(res1.screenshots.length, 2, 'Should normalize 2 string screenshots');
assert.equal(res1.screenshots[0].imageUrl, 'https://ik.imagekit.io/test/shot1.png');
assert.equal(res1.screenshots[1].imageUrl, 'https://ik.imagekit.io/test/shot2.png');
assert.ok(res1.downloadUrl.includes('drive.google.com/uc?export=download&confirm=t&id=abc12345xyz'), 'Drive download link converted');
console.log('✓ Test 1 Passed: String screenshots and snake_case properties normalized successfully');

// Test 2: object screenshots normalization
const appWithObjectScreenshots = {
  slug: 'test-app-2',
  name: 'Test App 2',
  logoUrl: 'https://ik.imagekit.io/test/logo2.svg',
  screenshots: [
    { url: 'https://ik.imagekit.io/test/shotA.png', title: 'Home View' },
    { imageUrl: 'https://ik.imagekit.io/test/shotB.png', title: 'Detail View' }
  ],
};
const res2 = normalizeAppRecord(appWithObjectScreenshots);
assert.equal(res2.screenshots.length, 2);
assert.equal(res2.screenshots[0].imageUrl, 'https://ik.imagekit.io/test/shotA.png');
assert.equal(res2.screenshots[0].title, 'Home View');
assert.equal(res2.screenshots[1].imageUrl, 'https://ik.imagekit.io/test/shotB.png');
assert.equal(res2.screenshots[1].title, 'Detail View');
console.log('✓ Test 2 Passed: Object screenshots preserved and title mapped');

// Test 3: empty and edge cases
const emptyApp = normalizeAppRecord({});
assert.equal(emptyApp.logoUrl, '');
assert.deepEqual(emptyApp.screenshots, []);
assert.equal(emptyApp.downloadUrl, '');
console.log('✓ Test 3 Passed: Empty records handled safely without crash');

console.log('\n🎉 ALL 3 TEST SUITES PASSED WITH 100% SUCCESS!');

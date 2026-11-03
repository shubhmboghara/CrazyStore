import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Running automated test suite for User Reviews Priority on App Detail & Download Pages...\n');

// 1. Verify AppDetailClient defaults to 'reviews' tab
{
  const appDetailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  assert.ok(fs.existsSync(appDetailPath), 'AppDetailClient.tsx must exist');
  const content = fs.readFileSync(appDetailPath, 'utf8');

  assert.ok(
    content.includes("useState<'reviews' | 'overview' | 'safety' | 'tech'>('reviews')"),
    "AppDetailClient must initialize activeTab state to 'reviews' by default"
  );
  console.log("✓ Test 1 Passed: activeTab defaults to 'reviews' when opening application page");
}

// 2. Verify Tab Navigation order places User Reviews first
{
  const appDetailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const content = fs.readFileSync(appDetailPath, 'utf8');

  const tabListIdx = content.indexOf('role="tablist"');
  assert.ok(tabListIdx !== -1, 'Tab list must exist in AppDetailClient');

  const tabReviewsIdx = content.indexOf('id="tab-reviews"', tabListIdx);
  const tabOverviewIdx = content.indexOf('id="tab-overview"', tabListIdx);
  const tabSafetyIdx = content.indexOf('id="tab-safety"', tabListIdx);
  const tabTechIdx = content.indexOf('id="tab-tech"', tabListIdx);

  assert.ok(tabReviewsIdx !== -1, 'tab-reviews must exist in tablist');
  assert.ok(tabOverviewIdx !== -1, 'tab-overview must exist in tablist');
  assert.ok(tabSafetyIdx !== -1, 'tab-safety must exist in tablist');
  assert.ok(tabTechIdx !== -1, 'tab-tech must exist in tablist');

  assert.ok(
    tabReviewsIdx < tabOverviewIdx,
    'tab-reviews must appear BEFORE tab-overview in tab navigation order'
  );
  assert.ok(
    tabOverviewIdx < tabSafetyIdx,
    'tab-overview must appear BEFORE tab-safety in tab navigation order'
  );
  assert.ok(
    tabSafetyIdx < tabTechIdx,
    'tab-safety must appear BEFORE tab-tech in tab navigation order'
  );

  console.log('✓ Test 2 Passed: Tab buttons order prioritized (User Reviews -> About -> Safety -> Tech)');
}

// 3. Verify WAI-ARIA Keyboard cycling prioritizes reviews first
{
  const appDetailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const content = fs.readFileSync(appDetailPath, 'utf8');

  assert.ok(
    content.includes("const tabs: ('reviews' | 'overview' | 'safety' | 'tech')[] = ['reviews', 'overview', 'safety', 'tech']"),
    'Keyboard navigation tab array must begin with reviews'
  );

  console.log('✓ Test 3 Passed: Keyboard navigation cycles through tabs starting with reviews');
}

// 4. Verify Tab Panels order renders panel-reviews first
{
  const appDetailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const content = fs.readFileSync(appDetailPath, 'utf8');

  const panelReviewsIdx = content.indexOf('id="panel-reviews"');
  const panelOverviewIdx = content.indexOf('id="panel-overview"');

  assert.ok(panelReviewsIdx !== -1, 'panel-reviews must exist');
  assert.ok(panelOverviewIdx !== -1, 'panel-overview must exist');
  assert.ok(
    panelReviewsIdx < panelOverviewIdx,
    'panel-reviews must be rendered BEFORE panel-overview'
  );

  console.log('✓ Test 4 Passed: panel-reviews is rendered first in DOM tabpanels');
}

// 5. Verify ReviewsList and ReviewForm integration in panel-reviews
{
  const appDetailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const content = fs.readFileSync(appDetailPath, 'utf8');

  const panelReviewsContent = content.substring(
    content.indexOf('id="panel-reviews"'),
    content.indexOf('id="panel-overview"')
  );

  const reviewsListIdx = panelReviewsContent.indexOf('<ReviewsList');
  const reviewFormIdx = panelReviewsContent.indexOf('<ReviewForm');

  assert.ok(reviewsListIdx !== -1, 'ReviewsList must be in panel-reviews');
  assert.ok(reviewFormIdx !== -1, 'ReviewForm must be in panel-reviews');
  assert.ok(
    reviewsListIdx < reviewFormIdx,
    'ReviewsList (ratings & community reviews) must appear before ReviewForm'
  );

  console.log('✓ Test 5 Passed: ReviewsList displays community feedback first with ReviewForm below');
}

// 6. Verify ReviewsList Write a Review button and empty-state messaging
{
  const listPath = path.join(rootDir, 'components', 'ReviewsList.tsx');
  const content = fs.readFileSync(listPath, 'utf8');

  assert.ok(
    content.includes('Write a Review'),
    'ReviewsList must provide a direct "Write a Review" button in header'
  );
  assert.ok(
    content.includes('onWriteReviewClick'),
    'ReviewsList must accept onWriteReviewClick prop'
  );
  assert.ok(
    content.includes('review-form-container'),
    'ReviewsList must navigate smoothly to review-form-container'
  );

  console.log('✓ Test 6 Passed: ReviewsList header contains quick "Write a Review" jump CTA');
}

// 7. Verify Top Header StarRating is interactive to jump to reviews
{
  const appDetailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const content = fs.readFileSync(appDetailPath, 'utf8');

  assert.ok(
    content.includes("setActiveTab('reviews')") &&
      content.includes("document.getElementById('panel-reviews')?.scrollIntoView"),
    'Header star rating button must activate reviews tab and scroll smoothly'
  );

  console.log('✓ Test 7 Passed: Header rating badge is interactive and jumps directly to reviews');
}

console.log('\n🎉 ALL 7 USER REVIEWS PRIORITY TESTS PASSED WITH 100% SUCCESS!\n');

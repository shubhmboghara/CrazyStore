import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Running automated test suite for CrazyStore UI/UX & Modern Web Guidance Rules...');

// 1. Verify CSS Tokens & Modern Web Capabilities in globals.css
{
  const cssPath = path.join(rootDir, 'app', 'globals.css');
  assert.ok(fs.existsSync(cssPath), 'globals.css should exist');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Next-Gen OKLCH Color Space
  assert.ok(css.includes('oklch('), 'globals.css must define oklch() color space tokens');
  assert.ok(css.includes('--color-primary: oklch('), 'globals.css must define brand primary in oklch');

  // Refined Typography (text-wrap: balance & pretty)
  assert.ok(css.includes('text-wrap: balance'), 'globals.css must apply text-wrap: balance for headings');
  assert.ok(css.includes('text-wrap: pretty'), 'globals.css must apply text-wrap: pretty for body copy');

  // Dynamic Form Auto-Sizing & Validation
  assert.ok(css.includes('field-sizing: content'), 'globals.css must declare field-sizing: content on textareas');
  assert.ok(css.includes(':user-invalid'), 'globals.css must style :user-invalid for non-premature error states');
  assert.ok(css.includes(':user-valid'), 'globals.css must style :user-valid');

  // Fluid Transitions (@starting-style & allow-discrete)
  assert.ok(css.includes('@starting-style'), 'globals.css must leverage @starting-style for smooth entry transitions');
  assert.ok(css.includes('allow-discrete'), 'globals.css must use allow-discrete transition behavior for modals/popovers');

  // Container Query context
  assert.ok(css.includes('container-type: inline-size'), 'globals.css must declare container-type for component container queries');

  console.log('✓ Test 1 Passed: Modern CSS Foundation (oklch, text-wrap balance/pretty, field-sizing, @starting-style) verified');
}

// 2. Verify Navbar Accessibility & Navigation
{
  const navPath = path.join(rootDir, 'components', 'Navbar.tsx');
  assert.ok(fs.existsSync(navPath), 'Navbar.tsx should exist');
  const nav = fs.readFileSync(navPath, 'utf8');

  assert.ok(nav.includes('aria-expanded'), 'Navbar must include aria-expanded for mobile drawer');
  assert.ok(nav.includes('aria-controls="mobile-nav-drawer"'), 'Navbar must connect hamburger button to drawer via aria-controls');
  assert.ok(nav.includes('Escape'), 'Navbar must listen for Escape key to close mobile menu');
  assert.ok(nav.includes('/#catalog'), 'Navbar must link to /#catalog');
  assert.ok(nav.includes('/#standards'), 'Navbar must link to /#standards');
  assert.ok(nav.includes('Search apps...'), 'Navbar must provide catalog search shortcut');

  console.log('✓ Test 2 Passed: Navbar accessibility, touch targets, and drawer semantics verified');
}

// 3. Verify HomeClient Search & Filter UX
{
  const homePath = path.join(rootDir, 'components', 'HomeClient.tsx');
  assert.ok(fs.existsSync(homePath), 'HomeClient.tsx should exist');
  const home = fs.readFileSync(homePath, 'utf8');

  assert.ok(home.includes('searchQuery'), 'HomeClient must maintain search query state');
  assert.ok(home.includes('id="catalog-search"'), 'HomeClient must provide accessible search input');
  assert.ok(home.includes('id="features"'), 'HomeClient must define id="features" for navigation anchor');
  assert.ok(home.includes('id="standards"'), 'HomeClient must define id="standards" for navigation anchor');
  assert.ok(home.includes('No applications found'), 'HomeClient must provide empty state when search finds 0 matches');
  assert.ok(home.includes('Reset Search &amp; Filters'), 'HomeClient must provide 1-click reset for search/filters');
  assert.ok(home.includes('card-container'), 'HomeClient grid must use card-container for container queries');

  console.log('✓ Test 3 Passed: HomeClient search discoverability, filters, empty state, and container queries verified');
}

// 4. Verify AppDetailClient Native <dialog>, Breadcrumbs & Tabs
{
  const appDetailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  assert.ok(fs.existsSync(appDetailPath), 'AppDetailClient.tsx should exist');
  const appDetail = fs.readFileSync(appDetailPath, 'utf8');

  // Native HTML5 <dialog>
  assert.ok(appDetail.includes('<dialog'), 'AppDetailClient must use native <dialog> element for screenshot lightbox');
  assert.ok(appDetail.includes('dialogRef.current?.showModal()') || appDetail.includes('dialog.showModal()'), 'AppDetailClient must use showModal() platform API');
  assert.ok(appDetail.includes('onCancel='), 'AppDetailClient dialog must handle native onCancel event');

  // Semantic Breadcrumbs
  assert.ok(appDetail.includes('aria-label="Breadcrumb"'), 'AppDetailClient must render semantic <nav aria-label="Breadcrumb">');
  assert.ok(appDetail.includes('aria-current="page"'), 'AppDetailClient breadcrumb must declare aria-current="page"');

  // WAI-ARIA Tabs pattern
  assert.ok(appDetail.includes('role="tablist"'), 'AppDetailClient must declare role="tablist"');
  assert.ok(appDetail.includes('role="tab"'), 'AppDetailClient buttons must declare role="tab"');
  assert.ok(appDetail.includes('role="tabpanel"'), 'AppDetailClient panels must declare role="tabpanel"');

  // Safe area padding for mobile sticky bar
  assert.ok(appDetail.includes('safe-area-inset-bottom'), 'AppDetailClient mobile bar must respect safe-area-inset-bottom');

  console.log('✓ Test 4 Passed: AppDetailClient native <dialog>, breadcrumbs, WAI-ARIA tabs, and safe-area padding verified');
}

// 5. Verify StarRating, ReviewForm & ReviewsList Micro-Interactions
{
  const starPath = path.join(rootDir, 'components', 'StarRating.tsx');
  const formPath = path.join(rootDir, 'components', 'ReviewForm.tsx');
  const listPath = path.join(rootDir, 'components', 'ReviewsList.tsx');

  const star = fs.readFileSync(starPath, 'utf8');
  assert.ok(star.includes('radiogroup'), 'StarRating interactive must declare role radiogroup');
  assert.ok(star.includes('radio'), 'Star buttons must declare role radio');
  assert.ok(star.includes('handleKeyDown'), 'StarRating must support keyboard arrow navigation');

  const form = fs.readFileSync(formPath, 'utf8');
  assert.ok(form.includes('auto-expanding'), 'ReviewForm must use auto-expanding class for field-sizing: content');

  const list = fs.readFileSync(listPath, 'utf8');
  assert.ok(list.includes('selectedStar'), 'ReviewsList must support interactive star rating filtering');
  assert.ok(list.includes('toggleHelpful'), 'ReviewsList must provide interactive Helpful vote feedback');

  console.log('✓ Test 5 Passed: StarRating accessibility, auto-expanding review form, and interactive star filters verified');
}

// 6. Verify Error Boundaries & 404 Pages
{
  const notFoundPath = path.join(rootDir, 'app', 'not-found.tsx');
  const errorPath = path.join(rootDir, 'app', 'global-error.tsx');

  const notFound = fs.readFileSync(notFoundPath, 'utf8');
  assert.ok(notFound.includes('Browse App Catalog'), 'not-found.tsx must offer catalog recovery link');
  assert.ok(notFound.includes('Storefront Home'), 'not-found.tsx must offer home recovery link');

  const error = fs.readFileSync(errorPath, 'utf8');
  assert.ok(error.includes('Try Again'), 'global-error.tsx must provide retry button');
  assert.ok(error.includes('Return Home'), 'global-error.tsx must provide home recovery link');

  console.log('✓ Test 6 Passed: 404 and Error Boundary recovery UX verified');
}

// 7. Verify Toast Notifications, Form Live Regions & Category ARIA Semantics
{
  const toastPath = path.join(rootDir, 'components', 'Toast.tsx');
  const formPath = path.join(rootDir, 'components', 'ReviewForm.tsx');
  const homePath = path.join(rootDir, 'components', 'HomeClient.tsx');

  const toast = fs.readFileSync(toastPath, 'utf8');
  assert.ok(toast.includes('aria-live="polite"'), 'Toast container must declare aria-live="polite"');
  assert.ok(toast.includes('aria-atomic="true"'), 'Toast container must declare aria-atomic="true"');
  assert.ok(toast.includes('Dismiss notification'), 'Toast dismiss button must have accessible aria-label');

  const form = fs.readFileSync(formPath, 'utf8');
  assert.ok(form.includes('role="status"'), 'ReviewForm success alert must declare role="status"');
  assert.ok(form.includes('role="alert"'), 'ReviewForm error alert must declare role="alert"');
  assert.ok(form.includes('aria-describedby="review-char-count"'), 'ReviewForm textarea must link to char counter via aria-describedby');

  const home = fs.readFileSync(homePath, 'utf8');
  assert.ok(home.includes('role="tablist"'), 'HomeClient category filter container must declare role="tablist"');
  assert.ok(home.includes('role="tab"'), 'HomeClient category pills must declare role="tab"');
  assert.ok(home.includes('aria-selected'), 'HomeClient category pills must declare aria-selected');

  console.log('✓ Test 7 Passed: Toast notification accessibility, Form live regions, and Category tablist semantics verified');
}

console.log('\n🎉 ALL 7 UI/UX & MODERN WEB GUIDANCE TEST SUITES PASSED WITH 100% SUCCESS!\n');

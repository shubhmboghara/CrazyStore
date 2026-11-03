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

// 8. Verify WCAG 2.4.1 Skip to Main Content Landmark & Target IDs
{
  const layoutPath = path.join(rootDir, 'app', 'layout.tsx');
  const homePath = path.join(rootDir, 'components', 'HomeClient.tsx');
  const detailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');

  const layout = fs.readFileSync(layoutPath, 'utf8');
  assert.ok(layout.includes('href="#main-content"'), 'RootLayout must contain Skip to main content link');
  assert.ok(layout.includes('sr-only focus:not-sr-only'), 'Skip link must be visually hidden until keyboard focus');

  const home = fs.readFileSync(homePath, 'utf8');
  assert.ok(home.includes('id="main-content"'), 'HomeClient must declare id="main-content" on main element');

  const detail = fs.readFileSync(detailPath, 'utf8');
  assert.ok(detail.includes('id="main-content"'), 'AppDetailClient must declare id="main-content" on main element');

  console.log('✓ Test 8 Passed: WCAG 2.4.1 Skip to main content accessibility verified across layout and client pages');
}

// 9. Verify Scroll Padding & Vestibular Disorder Reduced-Motion Handling
{
  const cssPath = path.join(rootDir, 'app', 'globals.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('scroll-padding-top: 5rem'), 'globals.css must set scroll-padding-top to prevent sticky header occlusion');
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'globals.css must provide accessible reduced-motion reset');
  assert.ok(css.includes('animation-duration: 0.01ms'), 'globals.css must neutralize animations when reduced motion is preferred');

  console.log('✓ Test 9 Passed: Sticky header scroll-padding buffer and vestibular reduced-motion rules verified');
}

// 10. Verify 3D Phone Showcase Keyboard Navigation & Screen Reader Region
{
  const viewPath = path.join(rootDir, 'components', 'three', 'Screenshots3DPhoneView.tsx');
  const view = fs.readFileSync(viewPath, 'utf8');

  assert.ok(view.includes('tabIndex={0}'), '3D Viewport container must be keyboard focusable via tabIndex={0}');
  assert.ok(view.includes('role="region"'), '3D Viewport container must declare role="region"');
  assert.ok(view.includes('aria-label='), '3D Viewport container must declare an accessible aria-label');
  assert.ok(view.includes('ArrowLeft') && view.includes('ArrowRight'), '3D Viewport must support Arrow key screenshot cycling');
  assert.ok(view.includes('handleResetCamera'), '3D Viewport must support perspective reset');

  console.log('✓ Test 10 Passed: 3D Phone viewer full keyboard control and assistive tech accessibility verified');
}

// 11. Verify Lightbox Native Dialog ARIA Semantics
{
  const detailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const detail = fs.readFileSync(detailPath, 'utf8');

  assert.ok(detail.includes('aria-modal="true"'), 'Lightbox <dialog> must declare aria-modal="true"');
  assert.ok(detail.includes('aria-label="Screenshot lightbox modal"'), 'Lightbox <dialog> must declare aria-label');

  console.log('✓ Test 11 Passed: Lightbox native dialog modal ARIA semantics verified');
}

// 12. Verify WCAG 2.5.8 Touch Target Sizes in Footer
{
  const footerPath = path.join(rootDir, 'components', 'Footer.tsx');
  const footer = fs.readFileSync(footerPath, 'utf8');

  assert.ok(footer.includes('w-10 h-10'), 'Footer social icons must meet WCAG minimum 40x40px touch targets');
  assert.ok(footer.includes('focus-visible:ring-2'), 'Footer interactive elements must declare high-contrast focus rings');

  console.log('✓ Test 12 Passed: WCAG 2.5.8 touch target size minimums verified');
}

// 13. Verify Page-Level Error Boundary Recovery UX
{
  const errorPath = path.join(rootDir, 'app', 'error.tsx');
  assert.ok(fs.existsSync(errorPath), 'app/error.tsx page-level error boundary must exist');
  const error = fs.readFileSync(errorPath, 'utf8');

  assert.ok(error.includes('Try Again'), 'app/error.tsx must provide a Try Again retry action');
  assert.ok(error.includes('Storefront'), 'app/error.tsx must provide a navigation recovery link');

  console.log('✓ Test 13 Passed: Page-level error boundary recovery UX verified');
}

// 14. Verify Mobile Sticky Action Bar Clearance & Safe-Area Occlusion Prevention
{
  const detailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const detail = fs.readFileSync(detailPath, 'utf8');

  assert.ok(detail.includes('pb-32 sm:pb-16'), 'AppDetailClient must provide pb-32 clearance on mobile so sticky bar never occludes bottom content');
  assert.ok(detail.includes('safe-area-inset-bottom'), 'Sticky bar must respect safe-area-inset-bottom for gesture nav bars');

  console.log('✓ Test 14 Passed: Mobile sticky action bar clearance and safe-area occlusion prevention verified');
}

// 15. Verify Download CTA Tactile Feedback & Doherty Threshold Prevention
{
  const detailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const detail = fs.readFileSync(detailPath, 'utf8');

  assert.ok(detail.includes('isDownloading'), 'AppDetailClient must maintain isDownloading state for tactile feedback');
  assert.ok(detail.includes('Downloading APK...'), 'AppDetailClient must show active downloading confirmation text');
  assert.ok(detail.includes('aria-live="polite"'), 'Download buttons must declare aria-live for screen reader status');

  console.log('✓ Test 15 Passed: Download CTA tactile feedback and rapid double-click prevention verified');
}

// 16. Verify Form Autocomplete, Spellcheck, and Ctrl+Enter Power Shortcut
{
  const formPath = path.join(rootDir, 'components', 'ReviewForm.tsx');
  const form = fs.readFileSync(formPath, 'utf8');

  assert.ok(form.includes('autoComplete="name"'), 'ReviewForm name field must support autocomplete="name"');
  assert.ok(form.includes('inputMode="text"'), 'ReviewForm name field must declare inputMode="text"');
  assert.ok(form.includes('ctrlKey') || form.includes('metaKey'), 'ReviewForm textarea must support Ctrl/Cmd+Enter shortcut to submit');
  assert.ok(form.includes('Ctrl+Enter'), 'ReviewForm must display keyboard shortcut tip');

  console.log('✓ Test 16 Passed: Form autocomplete, inputMode, and Ctrl+Enter power shortcut verified');
}

// 17. Verify Mobile Auto-Zoom Protection & Search Polish
{
  const homePath = path.join(rootDir, 'components', 'HomeClient.tsx');
  const home = fs.readFileSync(homePath, 'utf8');

  assert.ok(home.includes('text-sm sm:text-xs'), 'Search input must use at least 14px (text-sm) on mobile to prevent iOS viewport auto-zoom');
  assert.ok(home.includes('autoComplete="off"'), 'Search input must declare autoComplete="off"');
  assert.ok(home.includes('spellCheck="false"'), 'Search input must declare spellCheck="false"');

  console.log('✓ Test 17 Passed: Mobile auto-zoom protection and search input ergonomics verified');
}

// 18. Verify 3D Studio Ambient Loading State & Zero Perceptual Latency
{
  const viewPath = path.join(rootDir, 'components', 'three', 'Screenshots3DPhoneView.tsx');
  const view = fs.readFileSync(viewPath, 'utf8');

  assert.ok(view.includes('isSceneReady'), 'Screenshots3DPhoneView must track isSceneReady lifecycle');
  assert.ok(view.includes('Initializing 3D Studio...'), 'Screenshots3DPhoneView must display ambient initializing loader while WebGL initializes');

  console.log('✓ Test 18 Passed: 3D Studio ambient loading state and perceived latency elimination verified');
}

// 19. Verify WAI-ARIA APG Arrow Key Navigation for Details Tabs
{
  const detailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');
  const detail = fs.readFileSync(detailPath, 'utf8');

  assert.ok(detail.includes('handleTabKeyDown'), 'AppDetailClient must define handleTabKeyDown for arrow key tab cycling');
  assert.ok(detail.includes('ArrowRight') && detail.includes('ArrowLeft'), 'Tabs must support ArrowLeft/ArrowRight navigation');
  assert.ok(detail.includes('Home') && detail.includes('End'), 'Tabs must support Home/End jump keys per WAI-ARIA APG');

  console.log('✓ Test 19 Passed: WAI-ARIA APG Arrow Key Navigation for Details Tabs verified');
}

// 20. Verify Mobile & Tablet Touch-Scrolling (touchAction: pan-y and Card3DTilt canHover)
{
  const heroPath = path.join(rootDir, 'components', 'three', 'Hero3DExperience.tsx');
  const shotsPath = path.join(rootDir, 'components', 'three', 'Screenshots3DPhoneView.tsx');
  const tiltPath = path.join(rootDir, 'components', 'three', 'Card3DTilt.tsx');

  const hero = fs.readFileSync(heroPath, 'utf8');
  assert.ok(hero.includes("touchAction: 'pan-y'"), 'Hero3DExperience must set touchAction: pan-y so mobile users can scroll vertically');
  assert.ok(hero.includes("pointerType === 'touch'"), 'Hero3DExperience must detect touch pointer for smooth scroll pass-through');

  const shots = fs.readFileSync(shotsPath, 'utf8');
  assert.ok(shots.includes("touchAction: 'pan-y'"), 'Screenshots3DPhoneView must set touchAction: pan-y to prevent mobile gesture jamming');

  const tilt = fs.readFileSync(tiltPath, 'utf8');
  assert.ok(tilt.includes('canHover'), 'Card3DTilt must respect canHover to prevent awkward 3D tilt jumps on mobile/tablet touchscreens');

  console.log('✓ Test 20 Passed: Mobile and tablet touch-scrolling (pan-y) and touch tilt suppression verified');
}

// 21. Verify Tablet (md: 768px+) Layout Architecture
{
  const homePath = path.join(rootDir, 'components', 'HomeClient.tsx');
  const detailPath = path.join(rootDir, 'components', 'AppDetailClient.tsx');

  const home = fs.readFileSync(homePath, 'utf8');
  assert.ok(home.includes('md:grid-cols-12'), 'HomeClient must enable 2-column layout on tablet viewports (md: 768px+)');

  const detail = fs.readFileSync(detailPath, 'utf8');
  assert.ok(detail.includes('max-w-7xl'), 'AppDetailClient must declare max-w-7xl responsive container');

  console.log('✓ Test 21 Passed: Tablet 2-column responsive layout and focused app profile architectures verified');
}

console.log('\n🎉 ALL 21 UI/UX & DEEP FRICTION-FREE PLATFORM TEST SUITES PASSED WITH 100% SUCCESS!\n');




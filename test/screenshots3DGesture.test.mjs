import assert from 'node:assert/strict';

/**
 * Mathematical models for Screenshots 3D Phone Thumb Swipe & Zoom Out
 */
function computeThumbSwipeProgress(initialZoom, deltaY, sensitivity = 220) {
  const progressDelta = -deltaY / sensitivity;
  return Math.max(0, Math.min(1, initialZoom + progressDelta));
}

function snapZoomProgress(currentProgress, threshold = 0.45) {
  return currentProgress > threshold ? 1.0 : 0.0;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function computeCameraAndPhoneTransforms(zoomProgress, isMobile = false) {
  const closeZ = isMobile ? 4.9 : 4.4;
  const farZ = isMobile ? 8.6 : 7.8;
  const cameraZ = lerp(closeZ, farZ, zoomProgress);
  const cameraY = lerp(0.02, 0.35, zoomProgress);
  const phoneTiltX = lerp(0.0, -0.22, zoomProgress); // tilted back ~13 deg
  return { cameraZ, cameraY, phoneTiltX };
}

function computeCompanionCards(zoomProgress) {
  const cardAlpha = Math.max(0, Math.min(0.8, (zoomProgress - 0.25) / 0.75));
  const leftX = lerp(-1.4, -3.2, zoomProgress);
  const rightX = lerp(1.4, 3.2, zoomProgress);
  const cardZ = lerp(-2.2, -1.2, zoomProgress);
  return { cardAlpha, leftX, rightX, cardZ };
}

console.log('Running automated test suite for CrazyStore 3D Thumb Gesture & Scroll Zoom Out...');

// Test 1: Thumb swipe up triggers zoom out
const initialZoom = 0.0; // In App View
const swipeUpDeltaY = -220; // 220px drag upward with thumb
const progressAfterSwipeUp = computeThumbSwipeProgress(initialZoom, swipeUpDeltaY, 220);
assert.equal(progressAfterSwipeUp, 1.0, 'Swiping up 220px should reach full 1.0 zoom overview');
console.log('✓ Test 1 Passed: Thumb swipe up smoothly pulls zoom progress to 1.0 (overview)');

// Test 2: Thumb swipe down from overview triggers zoom in
const initialOverview = 1.0;
const swipeDownDeltaY = 110; // Drag down 110px
const progressAfterSwipeDown = computeThumbSwipeProgress(initialOverview, swipeDownDeltaY, 220);
assert.equal(progressAfterSwipeDown, 0.5, 'Dragging down halfway should yield 0.5 zoom progress');
console.log('✓ Test 2 Passed: Thumb swipe down smoothly reduces zoom progress');

// Test 3: Elastic snapping threshold
assert.equal(snapZoomProgress(0.6), 1.0, 'Progress > 0.45 must snap to 1.0 (overview)');
assert.equal(snapZoomProgress(0.3), 0.0, 'Progress <= 0.45 must snap to 0.0 (app view)');
console.log('✓ Test 3 Passed: Elastic gesture snap cleanly converges to binary modes');

// Test 4: Camera distance and perspective tilt angles
const inApp = computeCameraAndPhoneTransforms(0.0, false);
assert.equal(inApp.cameraZ, 4.4, 'App view camera distance should be close (4.4)');
assert.equal(inApp.phoneTiltX, 0.0, 'App view phone should stand upright (0.0 rad)');

const inOverview = computeCameraAndPhoneTransforms(1.0, false);
assert.equal(inOverview.cameraZ, 7.8, 'Overview camera distance should be zoomed out (7.8)');
assert.ok(inOverview.phoneTiltX < -0.2, 'Overview phone must tilt backward to create the app-close perspective');
console.log('✓ Test 4 Passed: 3D perspective camera Z and backward tilt transform correctly');

// Test 5: Multitasking cards slide in depth
const cardsAtApp = computeCompanionCards(0.0);
assert.equal(cardsAtApp.cardAlpha, 0.0, 'Companion cards must be completely hidden in app view');

const cardsAtOverview = computeCompanionCards(1.0);
assert.equal(cardsAtOverview.cardAlpha, 0.8, 'Companion cards must reach max opacity in overview');
assert.ok(cardsAtOverview.leftX < -3.0, 'Left card must slide outwards to reveal multitasking deck');
assert.ok(cardsAtOverview.rightX > 3.0, 'Right card must slide outwards to reveal multitasking deck');
console.log('✓ Test 5 Passed: 3D Multitasking cards emerge in depth matching iOS/Android app switcher');

console.log('\n🎉 ALL 5 THUMB GESTURE & 3D ZOOM OUT TESTS PASSED WITH 100% SUCCESS!');

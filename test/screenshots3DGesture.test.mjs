import assert from 'node:assert/strict';

/**
 * Mathematical models for Screenshots 3D Phone Uncropped Framing & Aspect Ratio Containment
 */
function computeScreenshotContain(imgW, imgH, canvasW, canvasH) {
  const imgAspect = imgW / imgH;
  const canvasAspect = canvasW / canvasH;

  let drawW = canvasW;
  let drawH = canvasH;
  let drawX = 0;
  let drawY = 0;

  if (imgAspect > canvasAspect) {
    drawW = canvasW;
    drawH = canvasW / imgAspect;
    drawY = (canvasH - drawH) / 2;
  } else {
    drawH = canvasH;
    drawW = canvasH * imgAspect;
    drawX = (canvasW - drawW) / 2;
  }

  return { drawX, drawY, drawW, drawH };
}

function computeFrustumHeight(fovDegrees, distance) {
  const rad = (fovDegrees * Math.PI) / 360;
  return 2 * distance * Math.tan(rad);
}

function shouldShowCompanionCards(width, totalCount) {
  return width >= 640 && totalCount > 1;
}

function getSafeCameraZ(isMobile) {
  return isMobile ? 8.4 : 7.8;
}

console.log('Running automated test suite for CrazyStore 3D Screenshots & Uncropped Framing...');

// Test 1: Full screenshot contain math - 9:16 portrait
const portraitFit = computeScreenshotContain(1080, 1920, 512, 1024);
assert.ok(portraitFit.drawW <= 512, 'Draw width must fit within canvas');
assert.ok(portraitFit.drawH <= 1024, 'Draw height must fit within canvas');
assert.ok(portraitFit.drawY >= 0, 'Top must not be cut off');
assert.ok(portraitFit.drawY + portraitFit.drawH <= 1024, 'Bottom must not be cut off');
console.log('✓ Test 1 Passed: 9:16 Portrait screenshot fits 100% uncropped with zero clipping');

// Test 2: Full screenshot contain math - 9:21 ultra-tall modern Android
const tallFit = computeScreenshotContain(1080, 2520, 512, 1024);
assert.ok(tallFit.drawW <= 512, 'Tall screenshot width must fit');
assert.ok(tallFit.drawH <= 1024, 'Tall screenshot height must fit');
assert.equal(tallFit.drawY, 0, 'Tall screenshot spans full vertical bounds');
console.log('✓ Test 2 Passed: 9:21 Ultra-tall screenshot fits 100% uncropped with zero clipping');

// Test 3: Camera frustum safety - Phone (height 5.0) must never be cropped vertically
const phoneHeight = 5.0;
const desktopFrustumH = computeFrustumHeight(40, getSafeCameraZ(false));
assert.ok(desktopFrustumH > phoneHeight * 1.1, `Desktop frustum (${desktopFrustumH.toFixed(2)}) must exceed phone height (${phoneHeight}) by >10%`);

const mobileFrustumH = computeFrustumHeight(40, getSafeCameraZ(true));
assert.ok(mobileFrustumH > phoneHeight * 1.15, `Mobile frustum (${mobileFrustumH.toFixed(2)}) must provide extra margin for small screens`);
console.log('✓ Test 3 Passed: 3D Camera distance guarantees full phone is completely visible');

// Test 4: Companion card visibility prevents mobile crowding
assert.equal(shouldShowCompanionCards(400, 3), false, 'Mobile width < 640 must hide companion cards to keep center phone prominent');
assert.equal(shouldShowCompanionCards(1024, 3), true, 'Desktop width >= 640 can show companion cards in depth');
assert.equal(shouldShowCompanionCards(1024, 1), false, 'Single screenshot must never show companion cards');
console.log('✓ Test 4 Passed: Responsive card layout rules prevent mobile screen clutter');

// Test 5: Next/prev index wrapping
function getNextIdx(current, total) {
  return (current + 1) % total;
}
function getPrevIdx(current, total) {
  return (current - 1 + total) % total;
}
assert.equal(getNextIdx(2, 3), 0, 'Next index wraps cleanly to 0');
assert.equal(getPrevIdx(0, 3), 2, 'Previous index wraps cleanly to last');
console.log('✓ Test 5 Passed: Cyclic screenshot indexing navigates deterministically');

console.log('\n🎉 ALL 5 UNCLIPPED SCREENSHOT & 3D FRAMING TESTS PASSED WITH 100% SUCCESS!');

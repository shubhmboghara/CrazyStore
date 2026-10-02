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

// Test 6: Tap vs 3D Orbit Drag Disambiguation
function isClickGesture(startX, startY, endX, endY, maxDelta = 8) {
  const dx = Math.abs(endX - startX);
  const dy = Math.abs(endY - startY);
  return dx <= maxDelta && dy <= maxDelta;
}
assert.equal(isClickGesture(100, 100, 103, 104), true, 'Small movement (3px, 4px) must be registered as tap/click to open screenshot');
assert.equal(isClickGesture(100, 100, 140, 110), false, 'Movement > 8px must be treated as 3D Orbit drag, not tap');
console.log('✓ Test 6 Passed: Tap vs 3D Orbit Drag disambiguation operates accurately');

// Test 7: Mobile Horizontal Touch Swipe Math
function evaluateTouchSwipe(dx, dy, dt) {
  if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.15 && dt < 650) {
    return dx < 0 ? 'next' : 'prev';
  }
  return 'none';
}
assert.equal(evaluateTouchSwipe(-75, 12, 280), 'next', 'Swipe left advances to next screenshot');
assert.equal(evaluateTouchSwipe(80, 8, 300), 'prev', 'Swipe right goes back to previous screenshot');
assert.equal(evaluateTouchSwipe(15, 95, 300), 'none', 'Vertical scroll must not trigger horizontal screenshot change');
console.log('✓ Test 7 Passed: Mobile horizontal touch swipe vectors evaluate correctly');

// Test 8: Mouse Wheel / Trackpad Scroll Delta & Cooldown
function evaluateWheelStep(deltaX, deltaY, lastTime, nowTime, cooldownMs = 320) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if ((absX > 18 || absY > 18) && nowTime - lastTime > cooldownMs) {
    const delta = absX > absY ? deltaX : deltaY;
    return { shouldStep: true, direction: delta > 0 ? 'next' : 'prev', newTime: nowTime };
  }
  return { shouldStep: false, direction: 'none', newTime: lastTime };
}
const wheel1 = evaluateWheelStep(0, 35, 1000, 1400);
assert.equal(wheel1.shouldStep, true, 'Wheel scroll down triggers step');
assert.equal(wheel1.direction, 'next', 'Wheel scroll down advances forward');
const wheelRapid = evaluateWheelStep(0, 35, 1400, 1500);
assert.equal(wheelRapid.shouldStep, false, 'Rapid wheel events within cooldown must be throttled');
console.log('✓ Test 8 Passed: Mouse wheel scroll threshold and throttle cooldown prevent runaway spinning');

// Test 9: Object hierarchy resolution (isChildOf)
function isChildOfMock(obj, parent) {
  if (!obj || !parent) return false;
  let curr = obj;
  while (curr) {
    if (curr === parent) return true;
    curr = curr.parent || null;
  }
  return false;
}
const mockParent = { name: 'cardGroup' };
const mockChild = { name: 'glass', parent: mockParent };
const mockGrandchild = { name: 'reflection', parent: mockChild };
const mockOther = { name: 'otherGroup' };
assert.equal(isChildOfMock(mockGrandchild, mockParent), true, 'Grandchild correctly identified as child of cardGroup');
assert.equal(isChildOfMock(mockOther, mockParent), false, 'Unrelated object correctly returns false');
console.log('✓ Test 9 Passed: 3D Scene object hierarchy resolution works recursively');

// Test 10: Scroll-driven screenshot progression mapping
function computeScrollStepIndex(progress, totalCount) {
  return Math.min(totalCount - 1, Math.floor(progress * totalCount));
}
assert.equal(computeScrollStepIndex(0.0, 4), 0, 'Progress 0 maps to screenshot 0');
assert.equal(computeScrollStepIndex(0.3, 4), 1, 'Progress 0.3 maps to screenshot 1');
assert.equal(computeScrollStepIndex(0.6, 4), 2, 'Progress 0.6 maps to screenshot 2');
assert.equal(computeScrollStepIndex(0.95, 4), 3, 'Progress 0.95 maps to screenshot 3');
assert.equal(computeScrollStepIndex(1.0, 4), 3, 'Progress 1.0 clamps safely to last screenshot');
console.log('✓ Test 10 Passed: Page scroll-driven progression maps smoothly to screenshot indices');

console.log('\n🎉 ALL 10 UNCLIPPED SCREENSHOT & 3D INTERACTION TESTS PASSED WITH 100% SUCCESS!');

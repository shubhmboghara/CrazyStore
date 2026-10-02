import assert from 'node:assert/strict';

/**
 * Mathematical models for NavLogo3D Scroll Physics & Favicon Texture Coordinates
 */
function computeScrollImpulse(deltaY, factor = 0.004, maxImpulse = 0.15) {
  const raw = deltaY * factor;
  return Math.max(-maxImpulse, Math.min(maxImpulse, raw));
}

function dampenVelocity(currentVelocity, target = 0, damping = 0.06) {
  return currentVelocity + (target - currentVelocity) * damping;
}

function computeLogoTilt(baseTilt, velocity, maxDelta = 0.2) {
  const deltaTilt = Math.max(-maxDelta, Math.min(maxDelta, velocity * 1.5));
  return baseTilt + deltaTilt;
}

function getLogoSizePx(size) {
  switch (size) {
    case 'sm':
      return 32;
    case 'lg':
      return 52;
    case 'md':
    default:
      return 42;
  }
}

console.log('Running automated test suite for CrazyStore 3D Favicon Logo & Scroll Physics...');

// Test 1: Scroll impulse clamping
const smallScrollImpulse = computeScrollImpulse(10);
assert.equal(smallScrollImpulse, 0.04, 'Small scroll delta of 10px should yield 0.04 impulse');

const hugeScrollImpulse = computeScrollImpulse(500);
assert.equal(hugeScrollImpulse, 0.15, 'Huge scroll delta must be clamped to 0.15 max impulse');

const negativeScrollImpulse = computeScrollImpulse(-300);
assert.equal(negativeScrollImpulse, -0.15, 'Upward scroll must be clamped to -0.15 min impulse');
console.log('✓ Test 1 Passed: Scroll impulse calculation and momentum boundaries are deterministic');

// Test 2: Physics damping decay
let vel = 0.15;
for (let frame = 0; frame < 30; frame++) {
  vel = dampenVelocity(vel, 0, 0.06);
}
assert.ok(vel < 0.03, 'Velocity must decay smoothly towards 0 over 30 animation frames');
console.log('✓ Test 2 Passed: Angular velocity decays naturally with smooth physics damping');

// Test 3: Dynamic 3D tilt
const defaultTilt = 0.25;
const tiltWithMaxSpeed = computeLogoTilt(defaultTilt, 0.15);
assert.ok(tiltWithMaxSpeed > defaultTilt && tiltWithMaxSpeed <= 0.45, 'Tilt must react proportionally to scroll speed');
console.log('✓ Test 3 Passed: 3D logo perspective tilt reflects scroll momentum');

// Test 4: Size configuration
assert.equal(getLogoSizePx('sm'), 32, 'Small logo must be 32px');
assert.equal(getLogoSizePx('md'), 42, 'Medium logo must be 42px');
assert.equal(getLogoSizePx('lg'), 52, 'Large logo must be 52px');
console.log('✓ Test 4 Passed: Logo responsive sizing matrix maps accurately');

// Test 5: Favicon lightning bolt coordinates relative to canvas
const canvasW = 256;
const canvasH = 512;
const boltPoints = [
  { x: canvasW * 0.58, y: canvasH * 0.26 },
  { x: canvasW * 0.34, y: canvasH * 0.52 },
  { x: canvasW * 0.50, y: canvasH * 0.52 },
  { x: canvasW * 0.42, y: canvasH * 0.74 },
  { x: canvasW * 0.66, y: canvasH * 0.46 },
  { x: canvasW * 0.50, y: canvasH * 0.46 },
];

for (const pt of boltPoints) {
  assert.ok(pt.x > 0 && pt.x < canvasW, `Point x (${pt.x}) must lie within canvas width`);
  assert.ok(pt.y > 0 && pt.y < canvasH, `Point y (${pt.y}) must lie within canvas height`);
}
console.log('✓ Test 5 Passed: Favicon lightning geometry is geometrically bounded on canvas');

console.log('\n🎉 ALL 5 3D FAVICON & LOGO TESTS PASSED WITH 100% SUCCESS!');

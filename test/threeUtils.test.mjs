import assert from 'node:assert/strict';

// Test standalone logic for WebGL checking and memory disposal patterns
function isWebGLAvailableMock(hasContext) {
  if (typeof hasContext !== 'boolean') return false;
  return hasContext;
}

function mockDisposeMaterial(material, disposedList) {
  if (!material) return;
  const textureProperties = ['map', 'lightMap', 'normalMap', 'roughnessMap'];
  for (const prop of textureProperties) {
    if (material[prop] && typeof material[prop].dispose === 'function') {
      material[prop].dispose();
      disposedList.push(prop);
    }
  }
  if (typeof material.dispose === 'function') {
    material.dispose();
    disposedList.push('material');
  }
}

function mockDisposeThreeScene(scene, disposedList) {
  if (!scene || !scene.children) return;
  for (const child of scene.children) {
    if (child.geometry && typeof child.geometry.dispose === 'function') {
      child.geometry.dispose();
      disposedList.push('geometry');
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => mockDisposeMaterial(m, disposedList));
      } else {
        mockDisposeMaterial(child.material, disposedList);
      }
    }
  }
}

function calculateCylinderPosition(index, total, radius) {
  const angle = (index / total) * Math.PI * 2;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  return { x, z, angle };
}

function calculateCard3DTilt(normX, normY, maxTilt) {
  const rotX = -normY * maxTilt * 2 || 0;
  const rotY = normX * maxTilt * 2 || 0;
  return { rotX, rotY };
}

console.log('Running automated test suite for CrazyStore 3D / Three.js Utilities...');

// Test 1: WebGL detection mock
assert.equal(isWebGLAvailableMock(true), true, 'WebGL detection should be true when context exists');
assert.equal(isWebGLAvailableMock(false), false, 'WebGL detection should be false when context is missing');
assert.equal(isWebGLAvailableMock(undefined), false, 'WebGL detection should be false when undefined');
console.log('✓ Test 1 Passed: WebGL capability checks evaluate properly');

// Test 2: Recursive scene & material disposal (preventing GPU memory leaks)
const disposedItems = [];
const mockScene = {
  children: [
    {
      geometry: { dispose: () => disposedItems.push('mesh1-geo') },
      material: {
        map: { dispose: () => disposedItems.push('tex-map') },
        dispose: () => disposedItems.push('mesh1-mat'),
      },
    },
    {
      geometry: { dispose: () => disposedItems.push('mesh2-geo') },
      material: [
        {
          normalMap: { dispose: () => disposedItems.push('normal-map') },
          dispose: () => disposedItems.push('sub-mat-1'),
        },
        {
          dispose: () => disposedItems.push('sub-mat-2'),
        },
      ],
    },
  ],
};

mockDisposeThreeScene(mockScene, disposedItems);
assert.ok(disposedItems.includes('geometry'), 'Should dispose geometries');
assert.ok(disposedItems.includes('tex-map'), 'Should dispose texture map');
assert.ok(disposedItems.includes('mesh1-mat'), 'Should dispose mesh1 material');
assert.ok(disposedItems.includes('normal-map'), 'Should dispose normal map');
assert.ok(disposedItems.includes('sub-mat-1'), 'Should dispose sub materials');
console.log('✓ Test 2 Passed: Three.js recursive resource disposal cleans GPU buffers');

// Test 3: Screen canvas coordinate calculations
function calculatePreviewBounds(width, height) {
  const previewMargin = 24;
  const previewTop = 80;
  const previewHeight = height - previewTop - 40;
  const previewWidth = width - previewMargin * 2;
  return { previewWidth, previewHeight, previewTop, previewMargin };
}

const bounds = calculatePreviewBounds(512, 1024);
assert.equal(bounds.previewWidth, 464, 'Preview width must maintain margin symmetry');
assert.equal(bounds.previewHeight, 904, 'Preview height must fit within frame bounds');
console.log('✓ Test 3 Passed: Screen canvas viewport boundary math is deterministic');

// Test 4: 3D Cylinder Orbit Math
const pos0 = calculateCylinderPosition(0, 4, 10);
assert.equal(pos0.x, 0, 'First item in 3D orbit starts at sin(0)=0');
assert.equal(pos0.z, 10, 'First item in 3D orbit sits at cos(0)*radius = 10');

const pos1 = calculateCylinderPosition(1, 4, 10);
assert.ok(Math.abs(pos1.x - 10) < 1e-10, 'Quarter turn sits at x = 10');
assert.ok(Math.abs(pos1.z) < 1e-10, 'Quarter turn sits at z = 0');
console.log('✓ Test 4 Passed: 3D Cylinder Orbit trigonometry distributes cards symmetrically');

// Test 5: 3D Card Perspective Tilt Math
const tiltCenter = calculateCard3DTilt(0, 0, 10);
assert.equal(tiltCenter.rotX, 0);
assert.equal(tiltCenter.rotY, 0);

const tiltRightEdge = calculateCard3DTilt(0.5, 0, 10);
assert.equal(tiltRightEdge.rotY, 10, 'Moving to right edge tilts rotY positive');
assert.equal(tiltRightEdge.rotX, 0);

const tiltTopEdge = calculateCard3DTilt(0, -0.5, 10);
assert.equal(tiltTopEdge.rotX, 10, 'Moving to top edge tilts rotX positive');
console.log('✓ Test 5 Passed: 3D Card tilt perspective calculations are mathematically accurate');

console.log('\n🎉 ALL 5 3D UTILITY TESTS PASSED WITH 100% SUCCESS!');

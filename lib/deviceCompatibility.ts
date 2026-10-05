export interface CompatibilityResult {
  isAndroid: boolean;
  detectedVersion?: string;
  minVersion: number;
  status: 'compatible' | 'warning' | 'desktop';
  message: string;
}

/**
 * Extracts a numeric major/minor Android version from a string like "Android 8.0 (API 26)+"
 */
export function parseMinAndroidVersion(minAndroidStr: string): number {
  if (!minAndroidStr) return 8.0;
  const match = minAndroidStr.match(/Android\s+([0-9]+(?:\.[0-9]+)?)/i);
  if (match && match[1]) {
    const parsed = parseFloat(match[1]);
    return isNaN(parsed) ? 8.0 : parsed;
  }
  return 8.0;
}

/**
 * Checks client browser compatibility against app's minAndroid requirements.
 */
export function checkDeviceCompatibility(minAndroidStr: string): CompatibilityResult {
  const minVersion = parseMinAndroidVersion(minAndroidStr);

  if (typeof window === 'undefined' || !navigator || !navigator.userAgent) {
    return {
      isAndroid: false,
      minVersion,
      status: 'desktop',
      message: 'Android APK · Compatible with Android ' + minVersion + '+',
    };
  }

  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);

  if (!isAndroid) {
    return {
      isAndroid: false,
      minVersion,
      status: 'desktop',
      message: `Desktop / non-Android detected · Requires Android ${minVersion}+`,
    };
  }

  const match = ua.match(/Android\s+([0-9]+(?:\.[0-9]+)?)/i);
  if (match && match[1]) {
    const detectedVersion = match[1];
    const detectedNum = parseFloat(detectedVersion);

    if (!isNaN(detectedNum)) {
      if (detectedNum >= minVersion) {
        return {
          isAndroid: true,
          detectedVersion,
          minVersion,
          status: 'compatible',
          message: `Compatible with your device (Android ${detectedVersion} detected)`,
        };
      } else {
        return {
          isAndroid: true,
          detectedVersion,
          minVersion,
          status: 'warning',
          message: `Requires Android ${minVersion}+ (Detected Android ${detectedVersion})`,
        };
      }
    }
  }

  return {
    isAndroid: true,
    minVersion,
    status: 'compatible',
    message: `Compatible with Android devices (Requires ${minVersion}+)`,
  };
}

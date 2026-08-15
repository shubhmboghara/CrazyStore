import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          borderRadius: '40px',
          color: 'white',
          fontWeight: 900,
          fontSize: 110,
          fontFamily: 'sans-serif',
          boxShadow: 'inset 0 4px 8px rgba(255, 255, 255, 0.4)',
        }}
      >
        C
      </div>
    ),
    {
      ...size,
    }
  );
}

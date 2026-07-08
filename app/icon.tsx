import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#2D2926',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: '#F9F6F2',
            fontSize: 22,
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontFamily: 'serif',
          }}
        >
          È
        </span>
      </div>
    ),
    { ...size }
  )
}

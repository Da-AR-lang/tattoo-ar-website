'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '96px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>網站發生錯誤</h1>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>
            請稍後再試，或回到首頁。
          </p>
          {error.digest && (
            <p style={{ color: '#555', fontSize: 12, fontFamily: 'monospace', marginBottom: 24 }}>
              錯誤代碼：{error.digest}
            </p>
          )}
          <button
            onClick={() => unstable_retry()}
            style={{
              background: '#c9a84c',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            重試
          </button>
        </div>
      </body>
    </html>
  )
}

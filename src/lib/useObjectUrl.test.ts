import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useObjectUrl } from './useObjectUrl'

const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL

let createdUrls: string[]
let revokedUrls: string[]

beforeEach(() => {
  createdUrls = []
  revokedUrls = []
  URL.createObjectURL = vi.fn((blob: Blob) => {
    const url = `blob:fake-${blob.size}`
    createdUrls.push(url)
    return url
  })
  URL.revokeObjectURL = vi.fn((url: string) => {
    revokedUrls.push(url)
  })
})

afterEach(() => {
  URL.createObjectURL = originalCreate
  URL.revokeObjectURL = originalRevoke
  vi.restoreAllMocks()
})

describe('useObjectUrl', () => {
  it('creates an object URL for the given blob', async () => {
    const blob = new Blob(['abcd'])

    const { result } = renderHook(() => useObjectUrl(blob))

    await waitFor(() => expect(result.current).toBe('blob:fake-4'))
    expect(createdUrls).toEqual(['blob:fake-4'])
  })

  it('revokes the URL when the hook unmounts', async () => {
    const blob = new Blob(['abcd'])
    const { result, unmount } = renderHook(() => useObjectUrl(blob))
    await waitFor(() => expect(result.current).toBe('blob:fake-4'))

    unmount()

    expect(revokedUrls).toEqual(['blob:fake-4'])
  })

  it('revokes the previous URL when the blob changes', async () => {
    const first = new Blob(['abcd'])
    const { result, rerender } = renderHook(({ blob }) => useObjectUrl(blob), {
      initialProps: { blob: first as Blob | undefined },
    })
    await waitFor(() => expect(result.current).toBe('blob:fake-4'))

    rerender({ blob: new Blob(['xyz']) })

    await waitFor(() => expect(result.current).toBe('blob:fake-3'))
    expect(revokedUrls).toEqual(['blob:fake-4'])
  })

  it('returns no URL when there is no blob', async () => {
    const { result } = renderHook(() => useObjectUrl(undefined))

    expect(result.current).toBeUndefined()
    expect(createdUrls).toEqual([])
  })
})

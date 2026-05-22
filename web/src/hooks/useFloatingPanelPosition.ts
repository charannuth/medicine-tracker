import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

export const MOBILE_BREAKPOINT = '(max-width: 640px)'

export function useIsMobileLayout(): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_BREAKPOINT).matches,
  )

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT)
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return mobile
}

/** Fixed panel anchored to an input — stays visible when parents use overflow: hidden. */
export function useFloatingPanelPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties | undefined>()

  useLayoutEffect(() => {
    if (!enabled || !open) {
      setStyle(undefined)
      return
    }

    function update() {
      const el = anchorRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const gap = 6
      const viewportH = window.visualViewport?.height ?? window.innerHeight
      const viewportW = window.visualViewport?.width ?? window.innerWidth
      const offsetTop = window.visualViewport?.offsetTop ?? 0
      const offsetLeft = window.visualViewport?.offsetLeft ?? 0

      const spaceBelow = viewportH - (rect.bottom - offsetTop) - gap - 12
      const spaceAbove = rect.top - offsetTop - gap - 12
      const openBelow = spaceBelow >= 88 || spaceBelow >= spaceAbove
      const maxHeight = Math.min(280, Math.max(120, openBelow ? spaceBelow : spaceAbove))

      const width = Math.min(rect.width, viewportW - 24)
      const left = Math.max(
        12 + offsetLeft,
        Math.min(rect.left, offsetLeft + viewportW - width - 12),
      )

      if (openBelow) {
        setStyle({
          position: 'fixed',
          top: rect.bottom + gap,
          left,
          width,
          maxHeight,
          zIndex: 250,
        })
      } else {
        setStyle({
          position: 'fixed',
          left,
          width,
          maxHeight,
          bottom: viewportH - rect.top + gap,
          zIndex: 250,
        })
      }
    }

    update()
    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, enabled, anchorRef])

  return style
}

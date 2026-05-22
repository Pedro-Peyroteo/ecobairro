import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessibility hook for custom (non-Radix) modals.
 *
 * When `open` is true:
 *  - Focuses the first focusable element inside the modal on mount
 *  - Traps Tab / Shift+Tab inside the modal
 *  - Closes the modal on Esc (calls `onClose`)
 *  - Restores focus to the previously focused element when closing
 *
 * Usage:
 *   const modalRef = useRef<HTMLDivElement>(null)
 *   useModalA11y(open, modalRef, () => setOpen(false))
 *   return open && <div ref={modalRef} role="dialog" ...>...</div>
 */
export function useModalA11y(
  open: boolean,
  modalRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null

    // Defer focus until the modal is in the DOM
    const focusFirst = window.setTimeout(() => {
      const node = modalRef.current
      if (!node) return
      const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      const first = focusables[0]
      if (first) first.focus()
      else node.focus()
    }, 0)

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const node = modalRef.current
      if (!node) return
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusFirst)
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused.current?.focus?.()
    }
  }, [open, modalRef, onClose])
}

export const DESKTOP_SIDEBAR_MIN_WIDTH = 1024

export function usesSidebarDrawer(viewportWidth) {
  const width = Number(viewportWidth)

  if (!Number.isFinite(width)) {
    return false
  }

  return width < DESKTOP_SIDEBAR_MIN_WIDTH
}

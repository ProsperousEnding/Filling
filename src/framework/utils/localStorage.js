function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readLocalStorage(key, fallback = null) {
  const storage = getLocalStorage()

  if (!storage || !key) {
    return fallback
  }

  try {
    return storage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function writeLocalStorage(key, value) {
  const storage = getLocalStorage()

  if (!storage || !key) {
    return false
  }

  try {
    storage.setItem(key, String(value))
    return true
  } catch {
    return false
  }
}

export function removeLocalStorage(key) {
  const storage = getLocalStorage()

  if (!storage || !key) {
    return false
  }

  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

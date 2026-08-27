export function applyMaybeAsync(value, apply) {
  if (value && typeof value.then === 'function') {
    return Promise.resolve(value).then((resolvedValue) => {
      apply(resolvedValue)
      return resolvedValue
    })
  }

  apply(value)
  return Promise.resolve(value)
}

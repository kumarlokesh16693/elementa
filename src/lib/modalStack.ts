/** Tracks stacked overlays so Escape only closes the topmost modal. */
const stack: symbol[] = []

export function pushModal(id: symbol) {
  stack.push(id)
}

export function popModal(id: symbol) {
  const i = stack.lastIndexOf(id)
  if (i >= 0) stack.splice(i, 1)
}

export function isTopModal(id: symbol) {
  return stack[stack.length - 1] === id
}

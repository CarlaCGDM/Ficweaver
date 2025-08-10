/**
 * Smoothly scrolls an element into vertical center of a container,
 * clamped so we never overshoot the scroll range.
 *
 * @param scroller The scrollable container
 * @param target   The element to center
 * @param offset   Optional vertical offset in pixels (e.g. for sticky headers)
 */
export function safeScrollToCenter(
  scroller: HTMLElement,
  target: HTMLElement,
  offset: number = 0
) {
  const scrollerTop = scroller.getBoundingClientRect().top;
  const elTop = target.getBoundingClientRect().top;
  const current = scroller.scrollTop;

  const delta =
    elTop - scrollerTop - scroller.clientHeight / 2 + target.clientHeight / 2 + offset;

  let targetScroll = current + delta;

  const maxScroll = scroller.scrollHeight - scroller.clientHeight;
  if (targetScroll < 0) targetScroll = 0;
  if (targetScroll > maxScroll) targetScroll = maxScroll;

  scroller.scrollTo({ top: targetScroll, behavior: "smooth" });
}


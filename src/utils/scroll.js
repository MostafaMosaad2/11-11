export function scrollToId(id, reduced) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({
    behavior: reduced ? "auto" : "smooth",
    block: "start",
  });
}

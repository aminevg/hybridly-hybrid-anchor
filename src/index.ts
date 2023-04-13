import { definePlugin, router } from "hybridly"

export default definePlugin({
  name: "hybrid-anchor",
  initialized: (context) => {
    document.documentElement.addEventListener("click", clickHandler)
  },
})

function clickHandler(event: MouseEvent) {
  /**
   * Heavily inspired by SvelteKit, in turn inspired by page.js
   * https://github.com/sveltejs/kit/blob/ec240ae1083334bf6aa3c47e6378f48d14668b94/packages/kit/src/runtime/client/client.js
   * https://github.com/visionmedia/page.js/blob/4f9991658f9b9e3de9b6059bade93693af24d6bd/index.js
   */
  if (event.button) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (event.defaultPrevented) return

  const element = (event.composedPath() as Element[]).reduce(
    (previousValue, currentValue) => {
      if (previousValue) return previousValue
      if (isAnchor(currentValue)) {
        return currentValue
      }
      return null
    },
    null as HTMLAnchorElement | SVGAElement | null
  )
  if (!element) return

  const { url, external, target } = getLinkInfo(element)
  if (!url || external) return

  if (target === "_parent" || target === "_top") {
    if (window.parent !== window) return
  } else if (target && target !== "_self") {
    return
  }

  if (
    !(element instanceof SVGAElement) &&
    url.protocol !== location.protocol &&
    !(url.protocol === "https:" || url.protocol === "http:")
  ) {
    return
  }

  const [nonhash, hash] = url.href.split("#")
  if (hash !== undefined && nonhash === location.href.split("#")[0]) {
    return
  }

  event.preventDefault()
  router.navigate({ url, method: "GET" })
}

function isAnchor(
  element: Element
): element is HTMLAnchorElement | SVGAElement {
  return element.nodeName.toUpperCase() === "A" && element.hasAttribute("href")
}

function getLinkInfo(a: HTMLAnchorElement | SVGAElement) {
  let url: URL | undefined
  try {
    url = new URL(
      a instanceof SVGAElement ? a.href.baseVal : a.href,
      document.baseURI
    )
  } catch {}

  const target = a instanceof SVGAElement ? a.target.baseVal : a.target

  // TODO: add check for external validation
  const external = false

  return { url, external, target }
}

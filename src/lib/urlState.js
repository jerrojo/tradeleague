/* ═══════════════════════ URL AS THE VIEW ═══════════════════════
   Deep-links used to live only in localStorage. You could CLICK "the 20 losers the
   filter dodged" and land on exactly those rows — but you could never SEND that view
   to anyone, because the address bar never changed. For an institutional tool the
   primary workflow is "mail me that screen", so a view has to be a URL.

   Rules:
   · Navigating to a new section/profile PUSHES a history entry (it's a destination).
   · Twiddling a filter REPLACES it (it's a refinement — it must not spam the back button).
   · Defaults are omitted from the query string, so a clean view has a clean URL. */

const DEFAULT_OMIT = new Set(["all", "", null, undefined]);

export const readUrl = () => {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out = {};
  q.forEach((v, k) => { out[k] = v; });
  return out;
};

export const buildUrl = (patch) => {
  const q = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  Object.entries(patch).forEach(([k, v]) => {
    if (DEFAULT_OMIT.has(v)) q.delete(k);
    else q.set(k, String(v));
  });
  const s = q.toString();
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  return `${path}${s ? `?${s}` : ""}`;
};

/* Merge a patch into the query string. `push` for destinations, replace for refinements. */
export const patchUrl = (patch, { push = false } = {}) => {
  if (typeof window === "undefined") return;
  const url = buildUrl(patch);
  const state = { ...(window.history.state || {}), tlNav: true };
  if (push) window.history.pushState(state, "", url);
  else window.history.replaceState(state, "", url);
};

/* Absolute link to the current view — for a "copy link" affordance. */
export const currentShareUrl = () =>
  (typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}${window.location.search}`);

(() => {
  "use strict";

  const ENDPOINT = "https://portfolio-visit-notifier.karenbarseghyan.workers.dev/visit";
  const COOLDOWN_MS = 15 * 60 * 1000;
  const STORAGE_KEY = "portfolioVisitNotificationAt";

  window.addEventListener("load", () => {
    window.setTimeout(() => void notifyVisit(), 800);
  }, { once: true });

  async function notifyVisit() {
    const now = Date.now();
    const previous = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (Number.isFinite(previous) && now - previous < COOLDOWN_MS) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, String(now));
    try {
      const payload = await collectPayload();
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        mode: "cors",
        credentials: "omit",
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Notification endpoint returned ${response.status}`);
      }
    } catch {
      if (localStorage.getItem(STORAGE_KEY) === String(now)) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  async function collectPayload() {
    const url = new URL(window.location.href);
    const nav = performance.getEntriesByType("navigation")[0];
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const clientHints = await collectClientHints();

    return {
      visitedAt: new Date().toISOString(),
      browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      utcOffsetMinutes: new Date().getTimezoneOffset(),
      pageTitle: document.title,
      pageUrl: url.href,
      pagePath: url.pathname,
      pageQuery: url.search,
      pageHash: url.hash,
      referrer: document.referrer || null,
      utmSource: url.searchParams.get("utm_source"),
      utmMedium: url.searchParams.get("utm_medium"),
      utmCampaign: url.searchParams.get("utm_campaign"),
      utmContent: url.searchParams.get("utm_content"),
      utmTerm: url.searchParams.get("utm_term"),
      historyLength: history.length,
      language: navigator.language,
      languages: navigator.languages ? Array.from(navigator.languages) : [],
      platform: clientHints.platform || navigator.platform || null,
      platformVersion: clientHints.platformVersion,
      architecture: clientHints.architecture,
      bitness: clientHints.bitness,
      deviceModel: clientHints.model,
      uaBrands: clientHints.brands,
      uaFullVersionList: clientHints.fullVersionList,
      uaMobile: clientHints.mobile,
      vendor: navigator.vendor || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      deviceMemory: navigator.deviceMemory || null,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      webdriver: navigator.webdriver,
      screenWidth: screen.width,
      screenHeight: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      colorDepth: screen.colorDepth,
      orientation: screen.orientation ? `${screen.orientation.type} (${screen.orientation.angle}°)` : null,
      colorScheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      connectionType: connection ? connection.type : null,
      effectiveType: connection ? connection.effectiveType : null,
      downlinkMbps: connection ? connection.downlink : null,
      rttMs: connection ? connection.rtt : null,
      saveData: connection ? connection.saveData : null,
      navigationType: nav ? nav.type : null,
      nextHopProtocol: nav ? nav.nextHopProtocol : null,
      redirectCount: nav ? nav.redirectCount : null,
      dnsMs: nav ? round(nav.domainLookupEnd - nav.domainLookupStart) : null,
      tcpMs: nav ? round(nav.connectEnd - nav.connectStart) : null,
      tlsMs: nav && nav.secureConnectionStart > 0 ? round(nav.connectEnd - nav.secureConnectionStart) : null,
      ttfbMs: nav ? round(nav.responseStart - nav.requestStart) : null,
      responseMs: nav ? round(nav.responseEnd - nav.responseStart) : null,
      domInteractiveMs: nav ? round(nav.domInteractive) : null,
      domContentLoadedMs: nav ? round(nav.domContentLoadedEventEnd) : null,
      loadCompleteMs: nav ? round(nav.loadEventEnd) : null,
      transferSize: nav ? nav.transferSize : null,
      encodedBodySize: nav ? nav.encodedBodySize : null,
      decodedBodySize: nav ? nav.decodedBodySize : null,
    };
  }

  async function collectClientHints() {
    const data = navigator.userAgentData;
    if (!data) return {};

    const basic = {
      brands: data.brands ? data.brands.map((item) => `${item.brand} ${item.version}`) : [],
      mobile: data.mobile,
      platform: data.platform,
    };
    if (!data.getHighEntropyValues) return basic;

    try {
      const high = await data.getHighEntropyValues([
        "architecture", "bitness", "fullVersionList", "model", "platformVersion",
      ]);
      return {
        ...basic,
        architecture: high.architecture || null,
        bitness: high.bitness || null,
        model: high.model || null,
        platformVersion: high.platformVersion || null,
        fullVersionList: high.fullVersionList
          ? high.fullVersionList.map((item) => `${item.brand} ${item.version}`)
          : [],
      };
    } catch {
      return basic;
    }
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }
})();

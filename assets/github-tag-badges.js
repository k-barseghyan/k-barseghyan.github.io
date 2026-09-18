(() => {
  "use strict";

  const TAG_BADGE_BASE = "https://img.shields.io/github/v/tag/";
  const TAG_BADGE_QUERY = "sort=date&label=GitHub&color=2ea44f&logo=github&logoColor=white";
  const SUCCESS_COLOR = "#2ea44f";

  const resolveLatestTag = async (link) => {
    const repository = link.dataset.githubLatestTag;
    const badge = link.querySelector("img");

    if (!repository || !badge) {
      return;
    }

    try {
      const metadataUrl = `${TAG_BADGE_BASE}${repository}.json?${TAG_BADGE_QUERY}`;
      const response = await fetch(metadataUrl, {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        return;
      }

      const metadata = await response.json();
      const tag = typeof metadata.message === "string" ? metadata.message.trim() : "";
      const color = typeof metadata.color === "string" ? metadata.color.toLowerCase() : "";

      if (!tag || color !== SUCCESS_COLOR) {
        return;
      }

      const project = repository.slice(repository.indexOf("/") + 1);
      const encodedTag = encodeURIComponent(tag);

      link.href = `https://github.com/${repository}/tree/${encodedTag}`;
      link.title = `GitHub tag ${tag}`;
      link.setAttribute("aria-label", `Open ${project} GitHub tag ${tag}`);

      badge.src = `${TAG_BADGE_BASE}${repository}.svg?${TAG_BADGE_QUERY}`;
      badge.alt = `GitHub tag ${tag}`;
    } catch {
      // The repository badge and link in the HTML remain the fallback.
    }
  };

  document.querySelectorAll("[data-github-latest-tag]").forEach(resolveLatestTag);
})();

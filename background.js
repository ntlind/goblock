chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "sync" && changes.blockedSites) {
    await updateBlockingRules();
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await updateBlockingRules();
});

async function updateBlockingRules() {
  const result = await chrome.storage.sync.get(["blockedSites"]);
  const blockedSites = result.blockedSites || [];
  const activeBlocks = blockedSites.filter((site) => !site.paused);

  const rules = activeBlocks.map((site, index) => {
    let urlPattern;

    const url = new URL(site.url);
    const hostname = url.hostname;
    const pathname = url.pathname;

    urlPattern = `*${hostname}${pathname}*`;

    return {
      id: index + 1,
      priority: 1,
      action: {
        type: "block",
      },
      condition: {
        urlFilter: urlPattern,
        resourceTypes: ["main_frame", "sub_frame"],
      },
    };
  });

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ruleIds = existingRules.map((rule) => rule.id);
  if (ruleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
    });
  }

  if (rules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
    });
  }
}

chrome.runtime.onStartup.addListener(async () => {
  await updateBlockingRules();
});

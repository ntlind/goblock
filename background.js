async function updateBlockingRules() {
  const result = await chrome.storage.sync.get(["blockedSites"]);
  const blockedSites = result.blockedSites || [];

  const activeBlocks = blockedSites.filter((site) => !site.paused);

  // Create rules for each blocked site
  // We need to create multiple rules per site to handle www and non-www
  const allRules = [];

  activeBlocks.forEach((site, siteIndex) => {
    try {
      const urlObj = new URL(site.url);
      const hostname = urlObj.hostname;
      const path = urlObj.pathname;

      // Remove www. prefix to get base domain
      const baseDomain = hostname.replace(/^www\./, "");
      const domains = [baseDomain];

      // Add www variant if it doesn't start with www
      if (!hostname.startsWith("www.")) {
        domains.push(`www.${baseDomain}`);
      }

      // Create a rule for each domain variant
      domains.forEach((domain, domainIndex) => {
        const ruleId = siteIndex * 10 + domainIndex + 1;

        let condition;
        if (path && path !== "/") {
          // Block specific path - use urlFilter with full pattern
          condition = {
            urlFilter: `*://${domain}${path}*`,
            resourceTypes: ["main_frame", "sub_frame"],
          };
        } else {
          // Block entire domain - use requestDomains (more reliable)
          condition = {
            requestDomains: [domain],
            resourceTypes: ["main_frame", "sub_frame"],
          };
        }

        allRules.push({
          id: ruleId,
          priority: 1,
          action: {
            type: "block",
          },
          condition: condition,
        });
      });
    } catch (error) {
      // Fallback to domain-only blocking with urlFilter
      const ruleId = siteIndex * 10 + 1;
      allRules.push({
        id: ruleId,
        priority: 1,
        action: {
          type: "block",
        },
        condition: {
          urlFilter: `*://${site.domain}/*`,
          resourceTypes: ["main_frame", "sub_frame"],
        },
      });
    }
  });

  const rules = allRules;

  // Remove all existing rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ruleIds = existingRules.map((rule) => rule.id);
  if (ruleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
    });
  }

  // Add new rules
  if (rules.length > 0) {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules,
      });
      console.log(`goblock: Updated ${rules.length} blocking rules`);
    } catch (error) {
      console.error("goblock: Error updating rules:", error);
    }
  } else {
    console.log("goblock: No active blocks");
  }
}

// Update blocking rules when storage changes
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "sync" && changes.blockedSites) {
    await updateBlockingRules();
  }
});
i;

chrome.runtime.onInstalled.addListener(async () => {
  await updateBlockingRules();
});

chrome.runtime.onStartup.addListener(async () => {
  await updateBlockingRules();
});

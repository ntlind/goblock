async function loadBlockedSites() {
  const result = await chrome.storage.sync.get(["blockedSites"]);
  const blockedSites = result.blockedSites || [];

  const container = document.getElementById("blockedSites");
  const emptyState = document.getElementById("emptyState");

  container.innerHTML = "";

  if (blockedSites.length === 0) {
    emptyState.style.display = "block";
    updateToggleAllButton();
    return;
  }

  emptyState.style.display = "none";
  updateToggleAllButton();

  blockedSites.forEach((site, index) => {
    const item = document.createElement("div");
    item.className = `blocked-item ${site.paused ? "paused" : ""}`;

    item.innerHTML = `
      <div class="blocked-item-info">
        <div class="blocked-item-url">${escapeHtml(site.url)}</div>
        <div class="blocked-item-domain">${escapeHtml(site.domain)}</div>
      </div>
      <div class="blocked-item-actions">
        ${
          site.paused
            ? `<button class="btn btn-resume" data-index="${index}">Resume</button>`
            : `<button class="btn btn-pause" data-index="${index}">Pause</button>`
        }
        <button class="btn btn-unblock" data-index="${index}">Unblock</button>
      </div>
    `;

    container.appendChild(item);
  });

  document.getElementById("toggleAllBtn").addEventListener("click", toggleAll);
  document.querySelectorAll(".btn-pause").forEach((btn) => {
    btn.addEventListener("click", () =>
      pauseBlock(parseInt(btn.dataset.index))
    );
  });

  document.querySelectorAll(".btn-resume").forEach((btn) => {
    btn.addEventListener("click", () =>
      resumeBlock(parseInt(btn.dataset.index))
    );
  });

  document.querySelectorAll(".btn-unblock").forEach((btn) => {
    btn.addEventListener("click", () =>
      unblockSite(parseInt(btn.dataset.index))
    );
  });
}

async function blockSite() {
  const input = document.getElementById("urlInput");
  const url = input.value.trim();

  if (!url) {
    alert("Please enter a URL");
    return;
  }

  try {
    const { domain, normalizedUrl } = normalizeUrl(url);

    const result = await chrome.storage.sync.get(["blockedSites"]);
    const blockedSites = result.blockedSites || [];

    blockedSites.push({
      url: normalizedUrl,
      domain: domain,
      paused: false,
      blockedAt: new Date().toISOString(),
    });

    await chrome.storage.sync.set({ blockedSites });

    // Rules will be updated automatically by background.js via storage.onChanged listener

    input.value = "";
    loadBlockedSites();
  } catch (error) {
    alert("Invalid URL: " + error.message);
  }
}

async function unblockSite(index) {
  const result = await chrome.storage.sync.get(["blockedSites"]);
  const blockedSites = result.blockedSites || [];

  blockedSites.splice(index, 1);

  await chrome.storage.sync.set({ blockedSites });
  // Rules will be updated automatically by background.js via storage.onChanged listener
  loadBlockedSites();
}

async function pauseBlock(index) {
  const result = await chrome.storage.sync.get(["blockedSites"]);
  const blockedSites = result.blockedSites || [];

  blockedSites[index].paused = true;

  await chrome.storage.sync.set({ blockedSites });
  // Rules will be updated automatically by background.js via storage.onChanged listener
  loadBlockedSites();
}

async function resumeBlock(index) {
  const result = await chrome.storage.sync.get(["blockedSites"]);
  const blockedSites = result.blockedSites || [];

  blockedSites[index].paused = false;

  await chrome.storage.sync.set({ blockedSites });
  // Rules will be updated automatically by background.js via storage.onChanged listener
  loadBlockedSites();
}

function normalizeUrl(input) {
  let url = input.trim();

  // Add protocol if missing
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const normalizedUrl = urlObj.href;

    return { domain, normalizedUrl };
  } catch (error) {
    throw new Error("Invalid URL format");
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById("blockBtn").addEventListener("click", blockSite);
document.getElementById("urlInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    blockSite();
  }
});

async function toggleAll() {
  const result = await chrome.storage.sync.get(["blockedSites"]);
  const blockedSites = result.blockedSites || [];

  if (blockedSites.length === 0) return;

  // Check if all are paused
  const allPaused = blockedSites.every((site) => site.paused);

  // Toggle: if all paused, resume all. Otherwise, pause all.
  blockedSites.forEach((site) => {
    site.paused = !allPaused;
  });

  await chrome.storage.sync.set({ blockedSites });
  loadBlockedSites();
  updateToggleAllButton();
}

async function updateToggleAllButton() {
  const result = await chrome.storage.sync.get(["blockedSites"]);
  const blockedSites = result.blockedSites || [];
  const btn = document.getElementById("toggleAllBtn");

  if (blockedSites.length === 0) {
    btn.style.display = "none";
    return;
  }

  btn.style.display = "block";
  const allPaused = blockedSites.every((site) => site.paused);
  btn.textContent = allPaused ? "Resume All" : "Pause All";
}

loadBlockedSites();

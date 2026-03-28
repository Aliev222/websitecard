const STORAGE_KEYS = {
  apiBase: "spirit_admin_api_base",
  adminToken: "spirit_admin_token",
  selectedSeason: "spirit_admin_selected_season",
};

const state = {
  apiBase: "",
  adminToken: "",
  seasons: [],
  selectedSeason: "",
};

const el = {
  apiBaseInput: document.getElementById("api-base-input"),
  adminTokenInput: document.getElementById("admin-token-input"),
  saveSettingsBtn: document.getElementById("save-settings-btn"),
  testConnectionBtn: document.getElementById("test-connection-btn"),
  refreshAllBtn: document.getElementById("refresh-all-btn"),
  connectionStatus: document.getElementById("connection-status"),
  onlineNow: document.getElementById("online-now"),
  totalUsers: document.getElementById("total-users"),
  currentSeasonKey: document.getElementById("current-season-key"),
  seasonTimeLeft: document.getElementById("season-time-left"),
  seasonHistory: document.getElementById("season-history"),
  leagueSnapshot: document.getElementById("league-snapshot"),
  rewardedAdsSummary: document.getElementById("rewarded-ads-summary"),
  starsSalesSummary: document.getElementById("stars-sales-summary"),
  fraudOverview: document.getElementById("fraud-overview"),
  seasonSelect: document.getElementById("season-select"),
  loadSeasonBtn: document.getElementById("load-season-btn"),
  seasonMeta: document.getElementById("season-meta"),
  seasonLeagues: document.getElementById("season-leagues"),
  fundForm: document.getElementById("fund-form"),
  fundSeasonKey: document.getElementById("fund-season-key"),
  grossRevenueInput: document.getElementById("gross-revenue-input"),
  payoutFundInput: document.getElementById("payout-fund-input"),
};

function loadSettings() {
  state.apiBase = localStorage.getItem(STORAGE_KEYS.apiBase) || "https://ryoho.onrender.com";
  state.adminToken = localStorage.getItem(STORAGE_KEYS.adminToken) || "";
  state.selectedSeason = localStorage.getItem(STORAGE_KEYS.selectedSeason) || "";
  el.apiBaseInput.value = state.apiBase;
  el.adminTokenInput.value = state.adminToken;
}

function saveSettings() {
  state.apiBase = (el.apiBaseInput.value || "").trim().replace(/\/+$/, "");
  state.adminToken = (el.adminTokenInput.value || "").trim();
  localStorage.setItem(STORAGE_KEYS.apiBase, state.apiBase);
  localStorage.setItem(STORAGE_KEYS.adminToken, state.adminToken);
}

function setStatus(type, text) {
  el.connectionStatus.className = `status-pill status-${type}`;
  el.connectionStatus.textContent = text;
}

function formatCurrencyCents(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format((Number(cents) || 0) / 100);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function apiFetch(path, options = {}) {
  if (!state.apiBase) {
    throw new Error("API base URL is empty");
  }

  const response = await fetch(`${state.apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(state.adminToken ? { "X-Admin-Token": state.adminToken } : {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || `HTTP ${response.status}`);
  }

  return payload;
}

function renderSeasonHistory(seasons) {
  el.seasonHistory.innerHTML = "";
  if (!seasons.length) {
    el.seasonHistory.innerHTML = '<div class="empty-state">No seasons yet.</div>';
    return;
  }

  const template = document.getElementById("season-item-template");
  seasons.forEach((season) => {
    const fragment = template.content.cloneNode(true);
    const button = fragment.querySelector(".season-item");
    fragment.querySelector(".season-item-key").textContent = season.season_key;
    fragment.querySelector(".season-item-status").textContent = season.status || "unknown";
    fragment.querySelector(".season-item-fund").textContent = formatCurrencyCents(season.payout_fund_cents);
    if (state.selectedSeason === season.season_key) {
      button.classList.add("is-active");
    }
    button.addEventListener("click", () => {
      state.selectedSeason = season.season_key;
      localStorage.setItem(STORAGE_KEYS.selectedSeason, state.selectedSeason);
      syncSeasonSelect();
      renderSeasonHistory(state.seasons);
      Promise.all([loadSeasonDetail(), loadFraudOverview()]).catch((error) => {
        setStatus("error", error.message || "Load failed");
      });
    });
    el.seasonHistory.appendChild(fragment);
  });
}

function renderLeagueSnapshot(overview) {
  el.leagueSnapshot.innerHTML = "";
  const template = document.getElementById("league-card-template");
  const leagueRanges = {
    bronze: "Lvl 1-32",
    silver: "Lvl 33-65",
    gold: "Lvl 66-99",
    diamond: "Lvl 100+",
  };

  Object.entries(overview.top_preview || {}).forEach(([league, players]) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".league-name").textContent = league;
    fragment.querySelector(".league-range").textContent = leagueRanges[league] || "";
    fragment.querySelector(".league-count").textContent = `${formatNumber(overview.league_counts?.[league] || 0)} players`;
    const list = fragment.querySelector(".mini-top-list");

    if (!players.length) {
      list.innerHTML = '<div class="empty-state">No players in this league yet.</div>';
    } else {
      players.forEach((player) => {
        const line = document.createElement("div");
        line.className = "mini-top-line";
        line.innerHTML = `
          <span>#${player.rank} ${player.username || `User ${player.user_id}`}</span>
          <strong>${formatNumber(player.score)}</strong>
        `;
        list.appendChild(line);
      });
    }

    el.leagueSnapshot.appendChild(fragment);
  });
}

function renderSeasonMeta(detail) {
  const season = detail.season || {};
  el.seasonMeta.innerHTML = `
    <div class="meta-card">
      <span>Season</span>
      <strong>${detail.season_key}</strong>
    </div>
    <div class="meta-card">
      <span>Status</span>
      <strong>${season.status || "active"}</strong>
    </div>
    <div class="meta-card">
      <span>Gross Revenue</span>
      <strong>${formatCurrencyCents(season.gross_ad_revenue_cents)}</strong>
    </div>
    <div class="meta-card">
      <span>Payout Fund</span>
      <strong>${formatCurrencyCents(season.payout_fund_cents)}</strong>
    </div>
    <div class="meta-card">
      <span>Payout Split</span>
      <strong>30 / 20 / 15 / 35</strong>
    </div>
  `;
}

function renderRewardedAdsSummary(summary) {
  const actions = summary.actions || {};
  const labels = {
    boost: "Boost",
    autoclicker: "Autoclicker",
    tasks: "Tasks",
    ghost: "Ghost",
    energy_restore: "Energy Restore",
    skins: "Skin Ads",
  };

  const actionRows = Object.entries(labels).map(([key, label]) => `
    <div class="analytics-row">
      <span>${label}</span>
      <strong>${formatNumber(actions[key]?.total || 0)} total - ${formatNumber(actions[key]?.recent || 0)} / ${summary.hours_window}h</strong>
    </div>
  `).join("");

  el.rewardedAdsSummary.innerHTML = `
    <div class="analytics-kpi-grid">
      <div class="meta-card">
        <span>Total successful ads</span>
        <strong>${formatNumber(summary.total_claims || 0)}</strong>
      </div>
      <div class="meta-card">
        <span>Recent successful ads</span>
        <strong>${formatNumber(summary.recent_claims || 0)}</strong>
      </div>
    </div>
    <div class="analytics-list">
      ${actionRows}
    </div>
  `;
}

function renderStarsSalesSummary(summary) {
  const topSkins = (summary.by_skin || []).slice(0, 8).map((item) => `
    <div class="analytics-row">
      <span>${item.skin_id}</span>
      <strong>${formatNumber(item.purchases)} sales - ${formatNumber(item.stars_amount)} Stars</strong>
    </div>
  `).join("");

  const recent = (summary.recent || []).slice(0, 8).map((item) => `
    <div class="analytics-row analytics-row-stack">
      <span>${item.username || `User ${item.user_id}`}</span>
      <strong>${item.skin_id} - ${formatNumber(item.stars_amount)} Stars</strong>
    </div>
  `).join("");

  el.starsSalesSummary.innerHTML = `
    <div class="analytics-kpi-grid">
      <div class="meta-card">
        <span>Total Stars skin sales</span>
        <strong>${formatNumber(summary.total_purchases || 0)}</strong>
      </div>
      <div class="meta-card">
        <span>Total Stars earned</span>
        <strong>${formatNumber(summary.total_stars || 0)}</strong>
      </div>
    </div>
    <div class="analytics-split">
      <div class="analytics-box">
        <h3>Top skins</h3>
        <div class="analytics-list">
          ${topSkins || '<div class="empty-state">No Stars skin purchases yet.</div>'}
        </div>
      </div>
      <div class="analytics-box">
        <h3>Recent purchases</h3>
        <div class="analytics-list">
          ${recent || '<div class="empty-state">No recent purchases yet.</div>'}
        </div>
      </div>
    </div>
  `;
}

async function updateFraudStatus(userId, status, disqualifyFromPayout) {
  const reason = window.prompt(
    status === "fraud"
      ? "Reason for fraud flag / disqualify:"
      : "Reason for allow payout / clear fraud flag:",
    ""
  );
  if (reason === null) return;

  await apiFetch(`/api/admin/fraud/user/${encodeURIComponent(userId)}`, {
    method: "POST",
    body: JSON.stringify({
      status,
      reason,
      disqualify_from_payout: disqualifyFromPayout,
      season_key: state.selectedSeason || null,
    }),
  });

  await loadFraudOverview();
  await loadSeasonDetail();
}

function renderFraudOverview(payload) {
  const players = payload.players || [];
  if (!players.length) {
    el.fraudOverview.innerHTML = '<div class="empty-state">No suspicious players for this season right now.</div>';
    return;
  }

  el.fraudOverview.innerHTML = "";
  players.forEach((player) => {
    const card = document.createElement("article");
    card.className = "fraud-card";
    const reasons = (player.reasons || []).map((reason) => `<li>${reason}</li>`).join("");

    card.innerHTML = `
      <div class="fraud-card-head">
        <div>
          <span class="fraud-status ${player.fraud_flag ? "fraud" : "ok"}">${player.fraud_flag ? "Fraud" : "OK"}</span>
          <h3>${player.username || `User ${player.user_id}`}</h3>
          <p class="panel-sub">User ${player.user_id} - ${player.league} - Level ${formatNumber(player.display_level)}</p>
        </div>
        <div class="fraud-score">
          <span>Weekly score</span>
          <strong>${formatNumber(player.score)}</strong>
        </div>
      </div>
      <div class="fraud-metrics">
        <div class="fraud-metric"><span>Account age</span><strong>${player.account_age_hours}h</strong></div>
        <div class="fraud-metric"><span>Rewarded ads 1h</span><strong>${formatNumber(player.rewarded_ads_1h)}</strong></div>
        <div class="fraud-metric"><span>Rewarded ads 24h</span><strong>${formatNumber(player.rewarded_ads_24h)}</strong></div>
        <div class="fraud-metric"><span>Payout</span><strong>${player.eligible_for_payout ? "Allowed" : "Blocked"}</strong></div>
      </div>
      <ul class="fraud-reasons">
        ${reasons || "<li>No reasons listed.</li>"}
      </ul>
      <div class="fraud-actions">
        <button class="btn btn-danger fraud-disqualify-btn">Disqualify from payout</button>
        <button class="btn btn-secondary fraud-allow-btn">Allow payout</button>
      </div>
    `;

    card.querySelector(".fraud-disqualify-btn").addEventListener("click", () => {
      updateFraudStatus(player.user_id, "fraud", true).catch((error) => {
        setStatus("error", error.message || "Fraud update failed");
      });
    });

    card.querySelector(".fraud-allow-btn").addEventListener("click", () => {
      updateFraudStatus(player.user_id, "ok", false).catch((error) => {
        setStatus("error", error.message || "Fraud update failed");
      });
    });

    el.fraudOverview.appendChild(card);
  });
}

function buildLeagueTable(title, leagueData) {
  const block = document.createElement("section");
  block.className = "season-league-block";
  const range = leagueData.range?.max_level
    ? `Lvl ${leagueData.range.min_level}-${leagueData.range.max_level}`
    : `Lvl ${leagueData.range.min_level}+`;

  const top50 = leagueData.top50 || [];
  const winners = new Map((leagueData.winners || []).map((winner) => [winner.rank, winner]));

  const rows = top50.map((player) => {
    const winner = winners.get(player.rank);
    return `
      <tr>
        <td data-label="Rank">#${player.rank}</td>
        <td data-label="Player">${player.username || `User ${player.user_id}`}</td>
        <td data-label="Level">${formatNumber(player.display_level)}</td>
        <td data-label="Weekly Click Score">${formatNumber(player.score)}</td>
        <td data-label="Payout">${winner ? formatCurrencyCents(winner.payout_cents) : "-"}</td>
        <td data-label="Stars">${winner ? formatNumber(winner.stars_reward) : "-"}</td>
        <td data-label="Eligible">${player.eligible_for_payout ? "Yes" : "No"}</td>
        <td data-label="Fraud">${player.fraud_flag ? "Flagged" : "OK"}</td>
      </tr>
    `;
  }).join("");

  block.innerHTML = `
    <div class="season-league-head">
      <div>
        <h3>${title}</h3>
        <p class="panel-sub">${range} - Fund split ${Math.round((leagueData.fund_split || 0) * 100)}%</p>
      </div>
      <strong>${formatNumber(top50.length)} / 50</strong>
    </div>
    <div class="season-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Level</th>
            <th>Weekly Click Score</th>
            <th>Payout</th>
            <th>Stars</th>
            <th>Eligible</th>
            <th>Fraud</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="8">No players in this league.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  return block;
}

function renderSeasonDetail(detail) {
  renderSeasonMeta(detail);
  el.seasonLeagues.innerHTML = "";
  Object.entries(detail.leagues || {}).forEach(([league, leagueData]) => {
    el.seasonLeagues.appendChild(buildLeagueTable(league, leagueData));
  });

  el.fundSeasonKey.value = detail.season_key || "";
  if (detail.season) {
    el.grossRevenueInput.value = detail.season.gross_ad_revenue_cents || 0;
    el.payoutFundInput.value = detail.season.payout_fund_cents || 0;
  }
}

function syncSeasonSelect() {
  el.seasonSelect.innerHTML = "";
  state.seasons.forEach((season) => {
    const option = document.createElement("option");
    option.value = season.season_key;
    option.textContent = `${season.season_key} (${season.status})`;
    if (season.season_key === state.selectedSeason) {
      option.selected = true;
    }
    el.seasonSelect.appendChild(option);
  });
}

async function loadOverview() {
  const overview = await apiFetch("/api/admin/overview");
  el.onlineNow.textContent = formatNumber(overview.online_now);
  el.totalUsers.textContent = formatNumber(overview.total_users);
  el.currentSeasonKey.textContent = overview.season_key || "-";
  el.seasonTimeLeft.textContent = formatDuration(overview.time_left_seconds);
  renderLeagueSnapshot(overview);

  if (!state.selectedSeason && overview.season_key) {
    state.selectedSeason = overview.season_key;
    localStorage.setItem(STORAGE_KEYS.selectedSeason, state.selectedSeason);
  }
}

async function loadSeasons() {
  const data = await apiFetch("/api/admin/weekly-tournament/seasons?limit=20");
  state.seasons = data.seasons || [];
  if (!state.selectedSeason && state.seasons[0]) {
    state.selectedSeason = state.seasons[0].season_key;
    localStorage.setItem(STORAGE_KEYS.selectedSeason, state.selectedSeason);
  }
  syncSeasonSelect();
  renderSeasonHistory(state.seasons);
}

async function loadRewardedAdsSummary() {
  const summary = await apiFetch("/api/admin/rewarded-ads/summary?hours=24");
  renderRewardedAdsSummary(summary);
}

async function loadStarsSalesSummary() {
  const summary = await apiFetch("/api/admin/stars-skins/summary?limit=12");
  renderStarsSalesSummary(summary);
}

async function loadFraudOverview() {
  const effectiveSeason = state.selectedSeason || "";
  const path = effectiveSeason
    ? `/api/admin/fraud/overview?season_key=${encodeURIComponent(effectiveSeason)}`
    : "/api/admin/fraud/overview";
  const payload = await apiFetch(path);
  renderFraudOverview(payload);
}

async function loadSeasonDetail() {
  if (!state.selectedSeason) {
    el.seasonMeta.innerHTML = '<div class="empty-state">No season selected.</div>';
    el.seasonLeagues.innerHTML = "";
    return;
  }
  const detail = await apiFetch(`/api/admin/weekly-tournament/season/${encodeURIComponent(state.selectedSeason)}`);
  renderSeasonDetail(detail);
}

async function refreshAll() {
  try {
    saveSettings();
    setStatus("idle", "Loading");
    await loadOverview();
    await loadSeasons();
    await loadRewardedAdsSummary();
    await loadStarsSalesSummary();
    await loadSeasonDetail();
    await loadFraudOverview();
    setStatus("ok", "Connected");
  } catch (error) {
    console.error(error);
    setStatus("error", error.message || "Request failed");
  }
}

async function testConnection() {
  try {
    saveSettings();
    setStatus("idle", "Testing");
    await apiFetch("/api/admin/overview");
    setStatus("ok", "Connected");
  } catch (error) {
    console.error(error);
    setStatus("error", error.message || "Request failed");
  }
}

async function saveFund(event) {
  event.preventDefault();
  try {
    saveSettings();
    const seasonKey = (el.fundSeasonKey.value || "").trim();
    const payload = {
      gross_ad_revenue_cents: Number(el.grossRevenueInput.value || 0),
      payout_fund_cents: Number(el.payoutFundInput.value || 0),
    };
    await apiFetch(`/api/admin/weekly-tournament/season/${encodeURIComponent(seasonKey)}/fund`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await refreshAll();
    setStatus("ok", "Fund saved");
  } catch (error) {
    console.error(error);
    setStatus("error", error.message || "Save failed");
  }
}

function bindEvents() {
  el.saveSettingsBtn.addEventListener("click", () => {
    saveSettings();
    setStatus("ok", "Saved");
  });
  el.testConnectionBtn.addEventListener("click", testConnection);
  el.refreshAllBtn.addEventListener("click", refreshAll);
  el.loadSeasonBtn.addEventListener("click", () => {
    state.selectedSeason = el.seasonSelect.value;
    localStorage.setItem(STORAGE_KEYS.selectedSeason, state.selectedSeason);
    renderSeasonHistory(state.seasons);
    Promise.all([loadSeasonDetail(), loadFraudOverview()]).catch((error) => {
      setStatus("error", error.message || "Load failed");
    });
  });
  el.fundForm.addEventListener("submit", saveFund);
}

function init() {
  loadSettings();
  bindEvents();
  refreshAll();
}

init();

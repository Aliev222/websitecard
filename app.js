const STORAGE_KEYS = {
  apiBase: "spirit_admin_api_base",
  adminToken: "spirit_admin_token",
  selectedSeason: "spirit_admin_selected_season",
};
const SESSION_KEYS = {
  adminToken: "spirit_admin_token_session",
};

const state = {
  apiBase: "",
  adminToken: "",
  seasons: [],
  selectedSeason: "",
  selectedPlayer: null,
  availableSkins: [],
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
  tonSkinsSummary: document.getElementById("ton-skins-summary"),
  fraudOverview: document.getElementById("fraud-overview"),
  seasonSelect: document.getElementById("season-select"),
  loadSeasonBtn: document.getElementById("load-season-btn"),
  seasonMeta: document.getElementById("season-meta"),
  seasonLeagues: document.getElementById("season-leagues"),
  fundForm: document.getElementById("fund-form"),
  fundSeasonKey: document.getElementById("fund-season-key"),
  grossRevenueInput: document.getElementById("gross-revenue-input"),
  payoutFundInput: document.getElementById("payout-fund-input"),
  tonSendForm: document.getElementById("ton-send-form"),
  tonFundInput: document.getElementById("ton-fund-input"),
  tonSendNoteInput: document.getElementById("ton-send-note-input"),
  tonSendBtn: document.getElementById("ton-send-btn"),
  tonSendResult: document.getElementById("ton-send-result"),
  diagnosticsList: document.getElementById("diagnostics-list"),
  playerSearchForm: document.getElementById("player-search-form"),
  playerSearchInput: document.getElementById("player-search-input"),
  playerSearchResults: document.getElementById("player-search-results"),
  playerSelectedSummary: document.getElementById("player-selected-summary"),
  grantCoinsForm: document.getElementById("grant-coins-form"),
  grantCoinsAmount: document.getElementById("grant-coins-amount"),
  grantCoinsReason: document.getElementById("grant-coins-reason"),
  grantSkinForm: document.getElementById("grant-skin-form"),
  grantSkinId: document.getElementById("grant-skin-id"),
  grantSkinReason: document.getElementById("grant-skin-reason"),
  grantSkinSelectNow: document.getElementById("grant-skin-select-now"),
  playerActionResult: document.getElementById("player-action-result"),
};

const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
const viewSections = Array.from(document.querySelectorAll(".view-section"));

function loadSettings() {
  state.apiBase = localStorage.getItem(STORAGE_KEYS.apiBase) || "https://ryoho.onrender.com";
  state.adminToken =
    sessionStorage.getItem(SESSION_KEYS.adminToken) ||
    localStorage.getItem(STORAGE_KEYS.adminToken) ||
    "";
  if (state.adminToken) {
    sessionStorage.setItem(SESSION_KEYS.adminToken, state.adminToken);
  }
  localStorage.removeItem(STORAGE_KEYS.adminToken);
  state.selectedSeason = localStorage.getItem(STORAGE_KEYS.selectedSeason) || "";
  el.apiBaseInput.value = state.apiBase;
  el.adminTokenInput.value = state.adminToken;
}

function saveSettings() {
  state.apiBase = (el.apiBaseInput.value || "").trim().replace(/\/+$/, "");
  state.adminToken = (el.adminTokenInput.value || "").trim();
  localStorage.setItem(STORAGE_KEYS.apiBase, state.apiBase);
  sessionStorage.setItem(SESSION_KEYS.adminToken, state.adminToken);
  localStorage.removeItem(STORAGE_KEYS.adminToken);
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

function formatTon(value) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value) || 0)} TON`;
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const FALLBACK_SKIN_IDS = [
  "default.pngSP",
  "refferal.pngSP",
  "retro.pngSP",
  "10lvl.pngSP",
  "25lvl.pngSP",
  "50lvl.pngSP",
  "75lvl.pngSP",
  "100lvl.pngSP",
  "video.pngSP",
  "video2.pngSP",
  "video3.pngSP",
  "video4.pngSP",
  "video5.pngSP",
  "video6.pngSP",
  "video7.pngSP",
  "video8.pngSP",
  "telega.pngSP",
  "tiktok.pngSP",
  "insta.pngSP",
  "stars1.pngSP",
  "stars2.pngSP",
  "stars3.pngSP",
  "stars4.pngSP",
  "stars5.pngSP",
  "stars6.pngSP",
  "stars7.pngSP",
  "stars8.pngSP",
];

async function apiFetch(path, options = {}) {
  if (!state.apiBase) {
    throw new Error("Пустой API Base URL");
  }

  const response = await fetch(`${state.apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(state.adminToken ? { "X-Admin-Token": state.adminToken } : {}),
    },
  });

  const rawBody = await response.text().catch(() => "");
  let payload = null;
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      payload = { detail: rawBody };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || `HTTP ${response.status}`);
  }

  return payload;
}

function openSection(sectionId) {
  navButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.section === sectionId);
  });
  viewSections.forEach((section) => {
    section.classList.toggle("is-active", section.id === sectionId);
  });
}

function initNavigation() {
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      openSection(btn.dataset.section);
    });
  });
}

function renderSeasonHistory(seasons) {
  el.seasonHistory.innerHTML = "";
  if (!seasons.length) {
    el.seasonHistory.innerHTML = '<div class="empty-state">Пока нет сезонов.</div>';
    return;
  }

  const template = document.getElementById("season-item-template");
  seasons.forEach((season) => {
    const fragment = template.content.cloneNode(true);
    const button = fragment.querySelector(".season-item");
    fragment.querySelector(".season-item-key").textContent = season.season_key;
    const seasonStatus = season.status === "active" ? "активный" : season.status === "finalized" ? "завершён" : (season.status || "неизвестно");
    fragment.querySelector(".season-item-status").textContent = seasonStatus;
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
        setStatus("error", error.message || "Ошибка загрузки");
      });
    });
    el.seasonHistory.appendChild(fragment);
  });
}

function renderLeagueSnapshot(overview) {
  el.leagueSnapshot.innerHTML = "";
  const template = document.getElementById("league-card-template");
  const leagueRanges = {
    bronze: "Ур. 1-32",
    silver: "Ур. 33-65",
    gold: "Ур. 66-99",
    diamond: "Ур. 100+",
  };

  Object.entries(overview.top_preview || {}).forEach(([league, players]) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".league-name").textContent = league;
    fragment.querySelector(".league-range").textContent = leagueRanges[league] || "";
    fragment.querySelector(".league-count").textContent = `${formatNumber(overview.league_counts?.[league] || 0)} игроков`;
    const list = fragment.querySelector(".mini-top-list");

    if (!players.length) {
      list.innerHTML = '<div class="empty-state">В этой лиге пока нет игроков.</div>';
    } else {
      players.forEach((player) => {
        const line = document.createElement("div");
        line.className = "mini-top-line";
        line.innerHTML = `
          <span>#${formatNumber(player.rank)} ${escapeHtml(player.username || `Игрок ${player.user_id}`)}</span>
          <strong>${formatNumber(getFiniteNumber(player.score))}</strong>
        `;
        list.appendChild(line);
      });
    }

    el.leagueSnapshot.appendChild(fragment);
  });
}

function renderSeasonMeta(detail) {
  const season = detail.season || {};
  const rawStatus = String(season.status || "active");
  const statusLabel = rawStatus === "active" ? "Активный" : rawStatus === "finalized" ? "Завершён" : rawStatus;
  el.seasonMeta.innerHTML = `
    <div class="meta-card">
      <span>Сезон</span>
      <strong>${escapeHtml(detail.season_key)}</strong>
    </div>
    <div class="meta-card">
      <span>Статус</span>
      <strong>${escapeHtml(statusLabel)}</strong>
    </div>
    <div class="meta-card">
      <span>Валовая выручка</span>
      <strong>${formatCurrencyCents(season.gross_ad_revenue_cents)}</strong>
    </div>
    <div class="meta-card">
      <span>Призовой фонд</span>
      <strong>${formatCurrencyCents(season.payout_fund_cents)}</strong>
    </div>
    <div class="meta-card">
      <span>Распределение</span>
      <strong>30 / 20 / 15 / 35</strong>
    </div>
  `;
}

function renderRewardedAdsSummary(summary) {
  const actions = summary.actions || {};
  const labels = {
    boost: "Буст",
    autoclicker: "Автокликер",
    tasks: "Задания",
    ghost: "Ghost",
    energy_restore: "Восстановление энергии",
    skins: "Реклама скинов",
  };

  const actionRows = Object.entries(labels).map(([key, label]) => `
    <div class="analytics-row">
      <span>${escapeHtml(label)}</span>
      <strong>${formatNumber(actions[key]?.total || 0)} всего - ${formatNumber(actions[key]?.recent || 0)} за ${formatNumber(summary.hours_window)}ч</strong>
    </div>
  `).join("");

  el.rewardedAdsSummary.innerHTML = `
    <div class="analytics-kpi-grid">
      <div class="meta-card">
        <span>Успешных просмотров</span>
        <strong>${formatNumber(summary.total_claims || 0)}</strong>
      </div>
      <div class="meta-card">
        <span>Недавние успешные</span>
        <strong>${formatNumber(summary.recent_claims || 0)}</strong>
      </div>
    </div>
    <div class="analytics-list">
      ${actionRows}
    </div>
  `;
}

function renderTonSkinSummary(summary) {
  if (!el.tonSkinsSummary) return;
  const totalTon = Number(summary.total_ton || 0);
  const topSkins = (summary.by_skin || []).slice(0, 8).map((item) => `
    <div class="analytics-row">
      <span>${escapeHtml(item.skin_id)}</span>
      <strong>${formatNumber(item.purchases)} sales - ${formatTon(item.amount_ton)}</strong>
    </div>
  `).join("");

  const recent = (summary.recent || []).slice(0, 8).map((item) => `
    <div class="analytics-row analytics-row-stack">
      <span>${escapeHtml(item.username || `Игрок ${item.user_id}`)}</span>
      <strong>${escapeHtml(item.skin_id)} - ${formatTon(item.amount_ton)}</strong>
    </div>
  `).join("");

  el.tonSkinsSummary.innerHTML = `
    <div class="analytics-kpi-grid">
      <div class="meta-card">
        <span>Всего продаж TON скинов</span>
        <strong>${formatNumber(summary.total_purchases || 0)}</strong>
      </div>
      <div class="meta-card">
        <span>Общий объём TON</span>
        <strong>${formatTon(totalTon)}</strong>
      </div>
    </div>
    <div class="analytics-split">
      <div class="analytics-box">
        <h3>Топ скинов</h3>
        <div class="analytics-list">
          ${topSkins || '<div class="empty-state">Покупок за TON пока нет.</div>'}
        </div>
      </div>
      <div class="analytics-box">
        <h3>Последние покупки</h3>
        <div class="analytics-list">
          ${recent || '<div class="empty-state">Недавних покупок пока нет.</div>'}
        </div>
      </div>
    </div>
  `;
}

function renderSkinOptions() {
  if (!el.grantSkinId) return;
  const skins = (state.availableSkins && state.availableSkins.length)
    ? state.availableSkins
    : FALLBACK_SKIN_IDS;

  el.grantSkinId.innerHTML = skins
    .map((skinId) => `<option value="${escapeHtml(skinId)}">${escapeHtml(skinId)}</option>`)
    .join("");
}

function renderSelectedPlayer() {
  if (!el.playerSelectedSummary) return;
  const player = state.selectedPlayer;
  if (!player) {
    el.playerSelectedSummary.innerHTML = `
      <span>Выбранный игрок</span>
      <strong>Игрок не выбран</strong>
    `;
    return;
  }

  el.playerSelectedSummary.innerHTML = `
    <span>Выбранный игрок</span>
    <strong>${escapeHtml(player.username || `Игрок ${player.user_id}`)} (ID ${formatNumber(player.user_id)})</strong>
    <span>Уровень ${formatNumber(player.level || 0)} - Коины ${formatNumber(player.coins || 0)} - Скинов ${formatNumber(player.owned_skins_count || 0)}</span>
    <span>Активный скин: ${escapeHtml(player.selected_skin || "default.pngSP")}</span>
  `;
}

function renderPlayerSearchResults(players) {
  if (!el.playerSearchResults) return;
  if (!players.length) {
    el.playerSearchResults.innerHTML = '<div class="empty-state">Игроки не найдены.</div>';
    return;
  }

  el.playerSearchResults.innerHTML = "";
  players.forEach((player) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "player-result-item";
    button.innerHTML = `
        <strong>${escapeHtml(player.username || `Игрок ${player.user_id}`)}</strong>
      <span>ID ${formatNumber(player.user_id)} - Ур. ${formatNumber(player.level || 0)} - Коины ${formatNumber(player.coins || 0)}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedPlayer = player;
      renderSelectedPlayer();
      el.playerActionResult.textContent = `Выбран: ${player.username || `Игрок ${player.user_id}`}`;
    });
    el.playerSearchResults.appendChild(button);
  });
}

async function loadSkinCatalog() {
  try {
    const data = await apiFetch("/api/admin/skins/catalog");
    const skins = Array.isArray(data.skins) ? data.skins : [];
    state.availableSkins = skins.length ? skins : FALLBACK_SKIN_IDS;
  } catch (error) {
    state.availableSkins = FALLBACK_SKIN_IDS;
  }
  renderSkinOptions();
}

async function searchPlayers(event) {
  event.preventDefault();
  try {
    saveSettings();
    const query = (el.playerSearchInput.value || "").trim();
    if (!query) {
      throw new Error("Введи никнейм или user_id");
    }
    const path = `/api/admin/players/search?query=${encodeURIComponent(query)}&limit=20`;
    const payload = await apiFetch(path);
    renderPlayerSearchResults(payload.players || []);
    setStatus("ok", "Игроки загружены");
  } catch (error) {
    console.error(error);
    setStatus("error", error.message || "Ошибка поиска игроков");
  }
}

async function refreshSelectedPlayer() {
  const userId = Number(state.selectedPlayer?.user_id || 0);
  if (!Number.isFinite(userId) || userId <= 0) return;
  const detail = await apiFetch(`/api/admin/players/${encodeURIComponent(String(userId))}`);
  if (detail?.player) {
    state.selectedPlayer = detail.player;
    renderSelectedPlayer();
  }
}

async function grantCoins(event) {
  event.preventDefault();
  try {
    saveSettings();
    const userId = Number(state.selectedPlayer?.user_id || 0);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error("Сначала выбери игрока");
    }
    const amount = Number(el.grantCoinsAmount.value || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Сумма коинов должна быть больше 0");
    }
    const reason = (el.grantCoinsReason.value || "").trim();
    const result = await apiFetch(
      `/api/admin/players/${encodeURIComponent(String(userId))}/grant-coins`,
      {
        method: "POST",
        body: JSON.stringify({
          amount: Math.floor(amount),
          reason: reason || null,
        }),
      }
    );
    await refreshSelectedPlayer();
    el.playerActionResult.textContent = `Выдано коинов: +${formatNumber(result.amount)} (новый баланс: ${formatNumber(result.hot_coins_after)})`;
    setStatus("ok", "Коины выданы");
  } catch (error) {
    console.error(error);
    setStatus("error", error.message || "Ошибка выдачи коинов");
  }
}

async function grantSkin(event) {
  event.preventDefault();
  try {
    saveSettings();
    const userId = Number(state.selectedPlayer?.user_id || 0);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error("Сначала выбери игрока");
    }
    const skinId = (el.grantSkinId.value || "").trim();
    if (!skinId) {
      throw new Error("Выбери скин");
    }
    const reason = (el.grantSkinReason.value || "").trim();
    const result = await apiFetch(
      `/api/admin/players/${encodeURIComponent(String(userId))}/grant-skin`,
      {
        method: "POST",
        body: JSON.stringify({
          skin_id: skinId,
          reason: reason || null,
          select_immediately: Boolean(el.grantSkinSelectNow.checked),
        }),
      }
    );
    await refreshSelectedPlayer();
    el.playerActionResult.textContent = result.already_owned
      ? `Скин уже был у игрока: ${result.skin_id}`
      : `Скин выдан: ${result.skin_id}`;
    setStatus("ok", "Скин выдан");
  } catch (error) {
    console.error(error);
    setStatus("error", error.message || "Ошибка выдачи скина");
  }
}

async function updateFraudStatus(userId, status, disqualifyFromPayout) {
  const normalizedUserId = Number(userId);
  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    throw new Error("Некорректный user_id");
  }
  const reason = window.prompt(
    status === "fraud"
      ? "Причина фрода / дисквалификации:"
      : "Причина снятия фрода / разрешения выплаты:",
    ""
  );
  if (reason === null) return;

  await apiFetch(`/api/admin/fraud/user/${encodeURIComponent(String(normalizedUserId))}`, {
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
    el.fraudOverview.innerHTML = '<div class="empty-state">Подозрительных игроков за этот сезон сейчас нет.</div>';
    return;
  }

  el.fraudOverview.innerHTML = "";
  players.forEach((player) => {
    const card = document.createElement("article");
    card.className = "fraud-card";
    const reasons = (player.reasons || []).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");

    card.innerHTML = `
      <div class="fraud-card-head">
        <div>
          <span class="fraud-status ${player.fraud_flag ? "fraud" : "ok"}">${player.fraud_flag ? "Фрод" : "OK"}</span>
          <h3>${escapeHtml(player.username || `Игрок ${player.user_id}`)}</h3>
          <p class="panel-sub">ID ${formatNumber(player.user_id)} - ${escapeHtml(player.league)} - Уровень ${formatNumber(player.display_level)}</p>
        </div>
        <div class="fraud-score">
          <span>Счёт за неделю</span>
          <strong>${formatNumber(player.score)}</strong>
        </div>
      </div>
      <div class="fraud-metrics">
        <div class="fraud-metric"><span>Возраст аккаунта</span><strong>${formatNumber(player.account_age_hours)}ч</strong></div>
        <div class="fraud-metric"><span>Реклама за 1ч</span><strong>${formatNumber(player.rewarded_ads_1h)}</strong></div>
        <div class="fraud-metric"><span>Реклама за 24ч</span><strong>${formatNumber(player.rewarded_ads_24h)}</strong></div>
        <div class="fraud-metric"><span>Выплата</span><strong>${player.eligible_for_payout ? "Разрешена" : "Блок"}</strong></div>
      </div>
      <ul class="fraud-reasons">
        ${reasons || "<li>Причины не указаны.</li>"}
      </ul>
      <div class="fraud-actions">
        <button class="btn btn-danger fraud-disqualify-btn">Дисквалифицировать</button>
        <button class="btn btn-secondary fraud-allow-btn">Разрешить выплату</button>
      </div>
    `;

    card.querySelector(".fraud-disqualify-btn").addEventListener("click", () => {
      updateFraudStatus(player.user_id, "fraud", true).catch((error) => {
        setStatus("error", error.message || "Ошибка обновления статуса фрода");
      });
    });

    card.querySelector(".fraud-allow-btn").addEventListener("click", () => {
      updateFraudStatus(player.user_id, "ok", false).catch((error) => {
        setStatus("error", error.message || "Ошибка обновления статуса фрода");
      });
    });

    el.fraudOverview.appendChild(card);
  });
}

function buildLeagueTable(title, leagueData) {
  const block = document.createElement("section");
  block.className = "season-league-block";
  const range = leagueData.range?.max_level
    ? `Ур. ${leagueData.range.min_level}-${leagueData.range.max_level}`
    : `Ур. ${leagueData.range.min_level}+`;

  const top50 = leagueData.top50 || [];
  const winners = new Map((leagueData.winners || []).map((winner) => [winner.rank, winner]));

  const rows = top50.map((player) => {
    const winner = winners.get(player.rank);
    return `
      <tr>
        <td data-label="Rank">#${formatNumber(player.rank)}</td>
        <td data-label="Игрок">${escapeHtml(player.username || `Игрок ${player.user_id}`)}</td>
        <td data-label="Уровень">${formatNumber(player.display_level)}</td>
        <td data-label="Счёт">${formatNumber(player.score)}</td>
        <td data-label="Выплата">${winner ? formatCurrencyCents(winner.payout_cents) : "-"}</td>
        <td data-label="Звёзды">${winner ? formatNumber(winner.stars_reward) : "-"}</td>
        <td data-label="Допуск">${player.eligible_for_payout ? "Да" : "Нет"}</td>
        <td data-label="Фрод">${player.fraud_flag ? "Флаг" : "OK"}</td>
      </tr>
    `;
  }).join("");

  block.innerHTML = `
    <div class="season-league-head">
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p class="panel-sub">${escapeHtml(range)} - Доля фонда ${Math.round((leagueData.fund_split || 0) * 100)}%</p>
      </div>
      <strong>${formatNumber(top50.length)} / 50</strong>
    </div>
    <div class="season-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ранг</th>
            <th>Игрок</th>
            <th>Уровень</th>
            <th>Счёт недели</th>
            <th>Выплата</th>
            <th>Звёзды</th>
            <th>Допуск</th>
            <th>Фрод</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="8">В этой лиге нет игроков.</td></tr>'}
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
    const statusLabel = season.status === "active" ? "активный" : season.status === "finalized" ? "завершён" : (season.status || "-");
    option.textContent = `${season.season_key} (${statusLabel})`;
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

async function loadTonSkinSummary() {
  const summary = await apiFetch("/api/admin/stars-skins/summary?limit=12&currency=TON");
  renderTonSkinSummary(summary);
}

function renderDiagnostics(data) {
  if (!el.diagnosticsList) return;
  const endpoints = Array.isArray(data?.endpoints) ? data.endpoints : [];
  if (!endpoints.length) {
    el.diagnosticsList.innerHTML = '<div class="empty-state">Диагностика пока пустая.</div>';
    return;
  }

  const rows = endpoints.slice(0, 25).map((item) => {
    const status = (item.status || "unknown").toLowerCase();
    const errorCount = Number(item.error_count || 0);
    const avgMs = Number(item.avg_duration_ms || 0);
    return `
      <div class="analytics-row analytics-row-stack">
        <span><strong>${escapeHtml(item.endpoint || "-")}</strong></span>
        <span>Статус: ${escapeHtml(status)} | Ошибок: ${formatNumber(errorCount)} | Ср. время: ${formatNumber(Math.round(avgMs))} мс</span>
      </div>
    `;
  }).join("");
  el.diagnosticsList.innerHTML = rows;
}

async function loadDiagnostics() {
  const data = await apiFetch("/api/admin/diagnostics/endpoints");
  renderDiagnostics(data);
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
    el.seasonMeta.innerHTML = '<div class="empty-state">Сезон не выбран.</div>';
    el.seasonLeagues.innerHTML = "";
    return;
  }
  const detail = await apiFetch(`/api/admin/weekly-tournament/season/${encodeURIComponent(state.selectedSeason)}`);
  renderSeasonDetail(detail);
}

async function refreshAll() {
  saveSettings();
  setStatus("idle", "Загрузка");

  const tasks = [
    loadOverview(),
    loadSeasons(),
    loadRewardedAdsSummary(),
    loadTonSkinSummary(),
    loadDiagnostics(),
    loadSeasonDetail(),
    loadFraudOverview(),
  ];

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((result) => result.status === "rejected");

  if (!failed.length) {
    setStatus("ok", "Подключено");
    return;
  }

  if (failed.length < results.length) {
    setStatus("warning", `Частично: ${failed.length} секц. с ошибкой`);
    console.warn("Partial refresh errors:", failed.map((item) => item.reason));
    return;
  }

  const firstError = failed[0]?.reason;
  setStatus("error", firstError?.message || "Ошибка запроса");
}

async function testConnection() {
  try {
    saveSettings();
    setStatus("idle", "Проверка");
    await apiFetch("/api/admin/overview");
    setStatus("ok", "Подключено");
  } catch (error) {
    console.error(error);
    setStatus("error", error.message || "Ошибка запроса");
  }
}

async function saveFund(event) {
  event.preventDefault();
  try {
    saveSettings();
    const seasonKey = (el.fundSeasonKey.value || "").trim();
    const grossRevenueCents = Number(el.grossRevenueInput.value || 0);
    const payoutFundCents = Number(el.payoutFundInput.value || 0);
    if (!seasonKey) {
      throw new Error("Укажи ключ сезона");
    }
    if (!Number.isFinite(grossRevenueCents) || grossRevenueCents < 0) {
      throw new Error("Валовая выручка должна быть неотрицательной");
    }
    if (!Number.isFinite(payoutFundCents) || payoutFundCents < 0) {
      throw new Error("Фонд должен быть неотрицательным");
    }
    const payload = {
      gross_ad_revenue_cents: Math.floor(grossRevenueCents),
      payout_fund_cents: Math.floor(payoutFundCents),
    };
    await apiFetch(`/api/admin/weekly-tournament/season/${encodeURIComponent(seasonKey)}/fund`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await refreshAll();
    setStatus("ok", "Фонд сохранён");
  } catch (error) {
    console.error(error);
    setStatus("error", error.message || "Ошибка сохранения");
  }
}

async function sendTonPayouts(event) {
  event.preventDefault();
  try {
    saveSettings();
    const seasonKey = (state.selectedSeason || el.fundSeasonKey.value || "").trim();
    const totalFundTon = Number(el.tonFundInput.value || 0);
    const note = (el.tonSendNoteInput.value || "").trim();
    if (!seasonKey) {
      throw new Error("Сначала выбери сезон");
    }
    if (!Number.isFinite(totalFundTon) || totalFundTon <= 0) {
      throw new Error("TON фонд должен быть больше 0");
    }

    el.tonSendBtn.disabled = true;
    el.tonSendResult.textContent = "Отправка...";
    const payload = {
      total_fund_ton: totalFundTon,
      note: note || null,
    };
    const result = await apiFetch(
      `/api/admin/weekly-tournament/season/${encodeURIComponent(seasonKey)}/ton-payouts/send`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    const summary = `В очереди: ${formatNumber(result.queued)} | Отправлено: ${formatNumber(result.submitted)} | Ошибок: ${formatNumber(result.failed)} | Нет кошелька: ${formatNumber(result.skipped_without_wallet)}`;
    const senderHint = result.sender_configured
      ? ""
      : " (на backend не настроен sender, только постановка в очередь)";
    el.tonSendResult.textContent = `${summary}${senderHint}`;
    await refreshAll();
    setStatus("ok", "Запрос на TON выплаты выполнен");
  } catch (error) {
    console.error(error);
    el.tonSendResult.textContent = "";
    setStatus("error", error.message || "Ошибка TON отправки");
  } finally {
    el.tonSendBtn.disabled = false;
  }
}

function bindEvents() {
  el.saveSettingsBtn.addEventListener("click", () => {
    saveSettings();
    setStatus("ok", "Сохранено");
  });
  el.testConnectionBtn.addEventListener("click", testConnection);
  el.refreshAllBtn.addEventListener("click", refreshAll);
  el.loadSeasonBtn.addEventListener("click", () => {
    state.selectedSeason = el.seasonSelect.value;
    localStorage.setItem(STORAGE_KEYS.selectedSeason, state.selectedSeason);
    renderSeasonHistory(state.seasons);
    Promise.all([loadSeasonDetail(), loadFraudOverview()]).catch((error) => {
      setStatus("error", error.message || "Ошибка загрузки");
    });
  });
  el.fundForm.addEventListener("submit", saveFund);
  el.tonSendForm.addEventListener("submit", sendTonPayouts);
  if (el.playerSearchForm) {
    el.playerSearchForm.addEventListener("submit", searchPlayers);
  }
  if (el.grantCoinsForm) {
    el.grantCoinsForm.addEventListener("submit", grantCoins);
  }
  if (el.grantSkinForm) {
    el.grantSkinForm.addEventListener("submit", grantSkin);
  }
}

function init() {
  loadSettings();
  initNavigation();
  renderSkinOptions();
  renderSelectedPlayer();
  bindEvents();
  loadSkinCatalog().catch(() => {});
  refreshAll();
}

init();

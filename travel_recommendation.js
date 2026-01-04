let travelData = null;

document.addEventListener("DOMContentLoaded", () => {
  // Enable navigation immediately (doesn't depend on JSON)
  setupNavigation();

  // Load JSON once
  fetch("./travel_recommendation_api.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status} (${response.statusText})`
        );
      }
      return response.json();
    })
    .then((data) => {
      travelData = data;

      // Task 6 verification logs
      console.log("Travel recommendation data loaded successfully:");
      console.log(data);
      console.log("Countries count:", data.countries?.length);
      console.log("Temples count:", data.temples?.length);
      console.log("Beaches count:", data.beaches?.length);

      // Wire up Search + Reset once data is ready
      setupSearchHandlers();
    })
    .catch((error) => {
      console.error("Failed to load travel_recommendation_api.json:", error);
      console.error(
        "If you're opening the HTML as a file (file://), fetch may be blocked. Use a local server instead."
      );
    });
});

/* ----------------------------- Navigation ----------------------------- */

function setupNavigation() {
  const screens = Array.from(document.querySelectorAll(".screen"));
  const navLinks = Array.from(document.querySelectorAll("[data-screen]"));

  function showScreen(id) {
    screens.forEach((s) => s.classList.toggle("active", s.id === id));
    history.replaceState(null, "", "#" + id);
    updateNavbarForScreen(id); // <-- hide/show search based on screen
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("data-screen");
      showScreen(id);
    });
  });

  // If someone loads directly to #about or #contact, show it
  const initial = (location.hash || "#home").replace("#", "");
  showScreen(document.getElementById(initial) ? initial : "home");
}

/* Hide the search form unless on Home */
function updateNavbarForScreen(activeScreenId) {
  const searchForm = document.getElementById("searchForm");
  if (!searchForm) return;

  // Show only on Home
  searchForm.style.display = activeScreenId === "home" ? "flex" : "none";
}

/* ------------------------- Search + Recommendations ------------------------- */

function setupSearchHandlers() {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const resultsDiv = document.getElementById("results");
  const resetBtn = document.getElementById("resetBtn");

  if (!searchForm || !searchInput || !resultsDiv) return;

  // Search: show results ONLY after clicking Search
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!travelData) return;

    // Always show results on Home
    showScreenById("home");

    const keyword = normalizeKeyword(searchInput.value);
    const category = classifyKeyword(keyword);

    if (!keyword) {
      renderMessage(resultsDiv, "Please enter a keyword: beach, temple, or country.");
      return;
    }

    if (!category) {
      renderMessage(
        resultsDiv,
        `No matching keyword for "${keyword}". Try: beach, temple, or country.`
      );
      return;
    }

    const items = getRecommendations(category, travelData);

    // Screenshot-style behavior: show all matching results (internal scroll if needed)
    renderCards(resultsDiv, category, items);
  });

  // Reset: clear input AND results
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      resultsDiv.innerHTML = "";
    });
  }
}

/* Programmatically show a screen (used when Search is clicked) */
function showScreenById(id) {
  const screens = Array.from(document.querySelectorAll(".screen"));
  screens.forEach((s) => s.classList.toggle("active", s.id === id));
  history.replaceState(null, "", "#" + id);
  updateNavbarForScreen(id);
}

/* Normalize input to accept BEACH / Beach / beaches etc. */
function normalizeKeyword(input) {
  return input.trim().toLowerCase();
}

/* Accept keyword variations + case-insensitivity */
function classifyKeyword(keyword) {
  if (keyword === "beach" || keyword === "beaches") return "beach";
  if (keyword === "temple" || keyword === "temples") return "temple";
  if (keyword === "country" || keyword === "countries") return "country";
  return null;
}

/*
  Returns objects with:
  { name, description, imageUrl, tag }
*/
function getRecommendations(category, data) {
  if (category === "beach") {
    return data.beaches.map((b) => ({
      name: b.name,
      description: b.description,
      imageUrl: b.imageUrl,
      tag: "Visit",
    }));
  }

  if (category === "temple") {
    return data.temples.map((t) => ({
      name: t.name,
      description: t.description,
      imageUrl: t.imageUrl,
      tag: "Visit",
    }));
  }

  // category === "country"
  // Show cities from all countries (multiple results, scroll if needed)
  const cityItems = [];
  data.countries.forEach((c) => {
    c.cities.forEach((city) => {
      cityItems.push({
        name: city.name,
        description: city.description,
        imageUrl: city.imageUrl,
        tag: c.name, // show the country name as the pill
      });
    });
  });

  return cityItems;
}

/* ----------------------------- Rendering ----------------------------- */

function renderMessage(resultsDiv, message) {
  resultsDiv.innerHTML = `
    <div style="margin-top:16px; color: rgba(245,247,251,0.85);">
      ${escapeHtml(message)}
    </div>
  `;
}

function renderCards(resultsDiv, category, items) {
  const heading =
    category === "beach"
      ? "Beach Recommendations"
      : category === "temple"
      ? "Temple Recommendations"
      : "Country Recommendations";

  resultsDiv.innerHTML = `
    <h3 style="margin: 16px 0 12px 0;">${heading}</h3>
    <div class="results-scroll">
      <div class="results-grid">
        ${items.map(cardHtml).join("")}
      </div>
    </div>
  `;
}

function cardHtml(item) {
  return `
    <article class="result-card">
      <img class="result-img" src="./${encodeURI(item.imageUrl)}" alt="${escapeHtml(item.name)}" />
      <div class="result-body">
        <h4 class="result-title">${escapeHtml(item.name)}</h4>
        <p class="result-desc">${escapeHtml(item.description)}</p>
        <div class="result-meta">
          <span class="result-pill">${escapeHtml(item.tag)}</span>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

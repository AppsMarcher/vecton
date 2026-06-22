(function attachVectonReportsHelpers(window) {
  function createReportsHelpersModule(deps) {
    const {
      escapeHtml,
      formatMonthLabel,
      formatSignedCurrency,
      getCurrentPeriodMonth,
      getReportsLastLoadedYear,
      getReportsLastLoadedAt
    } = deps;

    const REPORTS_FAV_KEY = "forecastapp-report-favs-v1";

    function loadReportFavs() {
      try {
        return new Set(JSON.parse(localStorage.getItem(REPORTS_FAV_KEY) || "[]"));
      } catch {
        return new Set();
      }
    }

    function saveReportFavs(set) {
      try {
        localStorage.setItem(REPORTS_FAV_KEY, JSON.stringify([...set]));
      } catch {}
    }

    function syncReportFavoriteButtons(cardGrid) {
      if (!cardGrid) return;

      const favorites = loadReportFavs();
      cardGrid.querySelectorAll(".rrc-fav").forEach((button) => {
        const id = button.dataset.favId;
        button.classList.toggle("is-fav", favorites.has(id));
        button.onclick = (event) => {
          event.stopPropagation();
          const updated = loadReportFavs();
          if (updated.has(id)) {
            updated.delete(id);
          } else {
            updated.add(id);
          }
          saveReportFavs(updated);
          button.classList.toggle("is-fav", updated.has(id));
        };
      });
    }

    function buildReportsSummaryMarkup(year, report, cacheEntry) {
      const monthIndex = Math.max(0, Math.min(11, Number(getCurrentPeriodMonth() || 1) - 1));
      const monthValue = report.monthTotals[monthIndex] || 0;
      const appliedRows = cacheEntry?.rows?.length || 0;
      const nonZeroRows = report.rows.filter((row) => row.months.some((value) => Math.abs(value) > 0.0001)).length;
      const loadedAt = getReportsLastLoadedAt();
      const loadedLabel = getReportsLastLoadedYear() === year && loadedAt
        ? `Atualizado ${new Date(loadedAt).toLocaleString("pt-BR")}`
        : "Aguardando carga aplicada";

      return [
        { label: "Ano base", value: String(year) },
        { label: "Mes em foco", value: formatMonthLabel(monthIndex + 1) },
        { label: `Realizado de ${formatMonthLabel(monthIndex + 1)}`, value: formatSignedCurrency(monthValue) },
        { label: "Linhas oficiais", value: String(appliedRows) },
        { label: "Linhas DRE com movimento", value: String(nonZeroRows) },
        { label: "Total anual", value: formatSignedCurrency(report.grandTotal) },
        { label: "Leitura", value: loadedLabel }
      ].map((item) => `
        <div class="reports-summary-box">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </div>
      `).join("");
    }

    return {
      buildReportsSummaryMarkup,
      syncReportFavoriteButtons
    };
  }

  window.VECTON_REPORTS_HELPERS = {
    createReportsHelpersModule
  };
})(window);

(function attachVectonReportsHeadcountModule(window) {
  function createReportsHeadcountModule(deps) {
    const { renderHcReport } = deps;

    function renderSelectedHeadcountReport(selectedReportId) {
      if (selectedReportId === "headcountReal") {
        renderHcReport("real");
        return true;
      }
      if (selectedReportId === "headcountBudget") {
        renderHcReport("budget");
        return true;
      }
      return false;
    }

    return {
      renderSelectedHeadcountReport
    };
  }

  window.VECTON_REPORTS_HEADCOUNT = {
    createReportsHeadcountModule
  };
})(window);

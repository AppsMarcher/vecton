(function attachVectonCoreStorage(global) {
const {
  branchSeed,
  ccSeed,
  defaultProfile,
  dreSeed,
  extractedSeed
} = global.VECTON_CORE_CONSTANTS;

function buildInitialDreNodes() {
  const accountMap = new Map(
    (Array.isArray(extractedSeed.accounts) ? extractedSeed.accounts : []).map((account) => [account.number, account])
  );

  return (Array.isArray(dreSeed.nodes) ? dreSeed.nodes : []).map((node) => {
    const sourceAccount = accountMap.get(node.code);
    return {
      id: crypto.randomUUID(),
      code: node.code,
      name: node.name,
      class: node.class,
      parentCode: node.parentCode,
      origin: sourceAccount ? "actuals+structure" : "estrutura",
      note: "",
      sourceName: sourceAccount?.name || null
    };
  });
}

function buildInitialCcNodes() {
  return (Array.isArray(ccSeed.nodes) ? ccSeed.nodes : []).map((node) => ({
    id: crypto.randomUUID(),
    code: node.code,
    name: node.name,
    class: node.class,
    parentCode: node.parentCode,
    type: node.type,
    origin: node.origin || "estrutura",
    note: ""
  }));
}

function createDemoState() {
  return {
    currentPeriod: {
      year: 2026,
      month: 6
    },
    profile: { ...defaultProfile },
    branches: branchSeed.branches.map((branch) => ({ id: crypto.randomUUID(), ...branch })),
    accounts: Array.isArray(extractedSeed.accounts) && extractedSeed.accounts.length
      ? extractedSeed.accounts.map((account) => ({ id: crypto.randomUUID(), ...account }))
      : [],
    costCenters: Array.isArray(ccSeed.costCenters) && ccSeed.costCenters.length
      ? ccSeed.costCenters.map((costCenter) => ({ id: crypto.randomUUID(), ...costCenter }))
      : [],
    dreNodes: buildInitialDreNodes(),
    ccNodes: buildInitialCcNodes(),
    actualsBatches: [],
    actualsRowsByBatch: {},
    budgetBatches: [],
    budgetRowsByBatch: {},
    headcountBatches: [],
    headcountRowsByBatch: {}
  };
}

function loadState(storageKey, normalizeHcBatch) {
  const demoState = createDemoState();
  const saved = localStorage.getItem(storageKey);
  if (!saved) return structuredClone(demoState);

  try {
    const parsed = JSON.parse(saved);
    const parsedProfile = parsed.profile && typeof parsed.profile === "object" ? parsed.profile : {};
    const normalizedProfile = {
      ...defaultProfile,
      ...parsedProfile
    };
    if (!normalizedProfile.photoKind && parsedProfile.photo) {
      normalizedProfile.photoKind = "upload";
      normalizedProfile.photoValue = parsedProfile.photo;
    }

    return {
      currentPeriod: parsed.currentPeriod && typeof parsed.currentPeriod === "object"
        ? {
            year: Number(parsed.currentPeriod.year) || 2026,
            month: Number(parsed.currentPeriod.month) || 6
          }
        : { year: 2026, month: 6 },
      profile: normalizedProfile,
      branches: Array.isArray(parsed.branches) && parsed.branches.length
        ? parsed.branches
        : structuredClone(demoState.branches),
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : structuredClone(demoState.accounts),
      costCenters: Array.isArray(parsed.costCenters) ? parsed.costCenters : structuredClone(demoState.costCenters),
      actualsBatches: Array.isArray(parsed.actualsBatches) ? parsed.actualsBatches : [],
      actualsRowsByBatch: parsed.actualsRowsByBatch && typeof parsed.actualsRowsByBatch === "object"
        ? parsed.actualsRowsByBatch
        : {},
      budgetBatches: Array.isArray(parsed.budgetBatches) ? parsed.budgetBatches : [],
      budgetRowsByBatch: parsed.budgetRowsByBatch && typeof parsed.budgetRowsByBatch === "object"
        ? parsed.budgetRowsByBatch
        : {},
      headcountBatches: Array.isArray(parsed.headcountBatches) ? parsed.headcountBatches.map(normalizeHcBatch) : [],
      headcountRowsByBatch: parsed.headcountRowsByBatch && typeof parsed.headcountRowsByBatch === "object"
        ? parsed.headcountRowsByBatch
        : {},
      dreNodes: Array.isArray(parsed.dreNodes) && parsed.dreNodes.length
        ? parsed.dreNodes
        : structuredClone(demoState.dreNodes),
      ccNodes: Array.isArray(parsed.ccNodes) && parsed.ccNodes.length
        ? parsed.ccNodes
        : structuredClone(demoState.ccNodes)
    };
  } catch (error) {
    console.error("Falha ao carregar dados locais", error);
    return structuredClone(demoState);
  }
}

function getPersistableState(state, isSupabaseConfigured) {
  return {
    ...state,
    actualsRowsByBatch: isSupabaseConfigured ? {} : state.actualsRowsByBatch,
    budgetRowsByBatch: isSupabaseConfigured ? {} : state.budgetRowsByBatch,
    headcountRowsByBatch: isSupabaseConfigured ? {} : (state.headcountRowsByBatch || {})
  };
}

global.VECTON_CORE_STORAGE = {
  buildInitialCcNodes,
  buildInitialDreNodes,
  createDemoState,
  getPersistableState,
  loadState
};
})(window);

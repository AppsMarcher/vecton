(function attachVectonBranchTreeModule(window) {
  function createBranchTreeModule(deps) {
    const {
      branchTree,
      branchNodeForm,
      ROOT_BRANCH_NODE,
      escapeHtml,
      getBranches,
      findBranch,
      describeBranchOrigin,
      getSelectedBranchCode,
      setSelectedBranchCode,
      renderBranchTreeRef,
      renderBranchEditorRef
    } = deps;

    function renderBranchTree() {
      if (!branchTree) {
        return;
      }

      branchTree.innerHTML = "";
      branchTree.append(renderBranchRoot());
    }

    function renderBranchRoot() {
      const wrapper = document.createElement("div");
      wrapper.className = "tree-node";

      const rootRow = document.createElement("div");
      rootRow.className = "tree-row selected";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "tree-toggle";
      toggle.textContent = "−";

      const bullet = document.createElement("span");
      bullet.className = "tree-bullet synthetic";

      const label = document.createElement("div");
      label.className = "tree-label";
      label.innerHTML = `<strong>${escapeHtml(ROOT_BRANCH_NODE.name)}</strong>`;

      rootRow.append(toggle, bullet, label);
      wrapper.append(rootRow);

      const childrenWrap = document.createElement("div");
      childrenWrap.className = "tree-children";
      getBranches().forEach((branch) => childrenWrap.append(renderBranchNode(branch)));
      wrapper.append(childrenWrap);
      return wrapper;
    }

    function renderBranchNode(branch) {
      const wrapper = document.createElement("div");
      wrapper.className = "tree-node";

      const row = document.createElement("div");
      row.className = "tree-row";
      if (branch.code === getSelectedBranchCode()) {
        row.classList.add("selected");
      }

      row.addEventListener("click", () => {
        setSelectedBranchCode(branch.code);
        renderBranchTreeRef();
        renderBranchEditorRef();
      });

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "tree-toggle empty";
      toggle.textContent = ".";
      toggle.disabled = true;

      const bullet = document.createElement("span");
      bullet.className = "tree-bullet actual";

      const label = document.createElement("div");
      label.className = "tree-label";
      label.innerHTML = `
        <strong>${escapeHtml(branch.code)} - ${escapeHtml(branch.name)}</strong>
        <span>${escapeHtml(describeBranchOrigin(branch.origin))}</span>
      `;

      row.append(toggle, bullet, label);
      wrapper.append(row);
      return wrapper;
    }

    function renderBranchEditor() {
      const branch = findBranch(getSelectedBranchCode());
      const title = document.querySelector("#branch-editor-title");
      if (!title) {
        return;
      }

      if (!branch) {
        title.textContent = "Selecione uma empresa ou filial";
        branchNodeForm.reset();
        document.querySelector("#branch-node-origin").value = "";
        document.querySelector("#branch-node-parent").value = ROOT_BRANCH_NODE.name;
        return;
      }

      title.textContent = `[ ${branch.code} - ${branch.name} ]`;
      document.querySelector("#branch-node-code").value = branch.code;
      document.querySelector("#branch-node-name").value = branch.name;
      document.querySelector("#branch-node-origin").value = describeBranchOrigin(branch.origin);
      document.querySelector("#branch-node-parent").value = ROOT_BRANCH_NODE.name;
      document.querySelector("#branch-node-note").value = branch.note || "";
    }

    return {
      renderBranchTree,
      renderBranchEditor
    };
  }

  window.VECTON_BRANCH_TREE = {
    createBranchTreeModule
  };
})(window);

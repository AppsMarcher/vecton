(function attachVectonDreTreeModule(window) {
  function createDreTreeModule(deps) {
    const {
      dreTree,
      dreNodeForm,
      ROOT_DRE_NODE,
      escapeHtml,
      getDreChildren,
      findDreNode,
      getNodeTone,
      describeOrigin,
      describeParent,
      getSelectedDreCode,
      setSelectedDreCode,
      getExpandedDreCodes,
      setDragPayload,
      getDragPayload,
      handleDreDrop
    } = deps;

    function renderDreTree() {
      if (!dreTree) {
        return;
      }

      dreTree.innerHTML = "";
      dreTree.append(renderDreNode({ ...ROOT_DRE_NODE }, 0));
    }

    function renderDreNode(node, depth) {
      const wrapper = document.createElement("div");
      wrapper.className = "tree-node";
      wrapper.style.setProperty("--depth", String(depth));

      const row = document.createElement("div");
      row.className = "tree-row";
      if (node.code === getSelectedDreCode()) {
        row.classList.add("selected");
      }

      if (node.code !== ROOT_DRE_NODE.code) {
        row.draggable = true;
        row.addEventListener("dragstart", (event) => {
          setDragPayload({ source: "dre", code: node.code });
          row.classList.add("dragging");
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", node.code);
        });
        row.addEventListener("dragend", () => {
          setDragPayload(null);
          row.classList.remove("dragging");
          document.querySelectorAll(".tree-row.drop-target").forEach((item) => item.classList.remove("drop-target"));
        });
      }

      row.addEventListener("click", () => {
        if (node.code !== ROOT_DRE_NODE.code) {
          setSelectedDreCode(node.code);
          renderDreTree();
          renderDreEditor();
        }
      });

      row.addEventListener("dragover", (event) => {
        const dragPayload = getDragPayload();
        if (!dragPayload || dragPayload.source !== "dre" || dragPayload.code === node.code) {
          return;
        }
        event.preventDefault();
        row.classList.add("drop-target");
      });

      row.addEventListener("dragleave", () => {
        row.classList.remove("drop-target");
      });

      row.addEventListener("drop", (event) => {
        event.preventDefault();
        row.classList.remove("drop-target");
        const dragPayload = getDragPayload();
        if (!dragPayload || dragPayload.source !== "dre" || dragPayload.code === node.code) {
          return;
        }
        handleDreDrop(dragPayload.code, node.code);
      });

      const children = getDreChildren(node.code);
      const canExpand = children.length > 0;
      const expandedDreCodes = getExpandedDreCodes();

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = `tree-toggle ${canExpand ? "" : "empty"}`.trim();
      toggle.textContent = canExpand ? (expandedDreCodes.has(node.code) ? "−" : "+") : "·";
      toggle.disabled = !canExpand;
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!canExpand) {
          return;
        }
        if (expandedDreCodes.has(node.code)) {
          expandedDreCodes.delete(node.code);
        } else {
          expandedDreCodes.add(node.code);
        }
        renderDreTree();
      });

      const bullet = document.createElement("span");
      bullet.className = `tree-bullet ${getNodeTone(node)}`;

      const label = document.createElement("div");
      label.className = "tree-label";
      if (node.code === ROOT_DRE_NODE.code) {
        label.innerHTML = `<strong>${escapeHtml(node.name)}</strong>`;
      } else {
        label.innerHTML = `
          <strong>${escapeHtml(node.code)} - ${escapeHtml(node.name)}</strong>
          <span>${escapeHtml(node.class)}${node.origin === "actuals+structure" ? " | base real + DRE Soc" : node.origin === "estrutura" ? " | DRE Soc" : " | manual"}</span>
        `;
      }

      row.append(toggle, bullet, label);
      wrapper.append(row);

      if (canExpand && expandedDreCodes.has(node.code)) {
        const childrenWrap = document.createElement("div");
        childrenWrap.className = "tree-children";
        children.forEach((child) => {
          childrenWrap.append(renderDreNode(child, depth + 1));
        });
        wrapper.append(childrenWrap);
      }

      return wrapper;
    }

    function renderDreEditor() {
      const node = findDreNode(getSelectedDreCode());
      const title = document.querySelector("#dre-editor-title");
      if (!title) {
        return;
      }

      if (!node) {
        title.textContent = "Selecione uma conta";
        dreNodeForm.reset();
        document.querySelector("#dre-node-origin").value = "";
        document.querySelector("#dre-node-parent").value = "";
        return;
      }

      title.textContent = `[ ${node.code} - ${node.name} ]`;
      document.querySelector("#dre-node-code").value = node.code;
      document.querySelector("#dre-node-class").value = node.class;
      document.querySelector("#dre-node-name").value = node.name;
      document.querySelector("#dre-node-origin").value = describeOrigin(node.origin);
      document.querySelector("#dre-node-parent").value = describeParent(node.parentCode);
      document.querySelector("#dre-node-note").value = node.note || "";
    }

    return {
      renderDreTree,
      renderDreEditor
    };
  }

  window.VECTON_DRE_TREE = {
    createDreTreeModule
  };
})(window);

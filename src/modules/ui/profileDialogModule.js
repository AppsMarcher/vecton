(function attachVectonProfileDialogModule(window) {
  function createProfileDialogModule(deps) {
    const {
      state,
      profileDialog,
      profileForm,
      profilePhotoFile,
      profilePhotoTrigger,
      getEditableProfile,
      setProfileDraft,
      updateProfileDraftFromForm,
      applyPhotoPreview,
      readFileAsDataUrl,
      persistAndRender,
      syncUserProfile,
      renderAccessTrees
    } = deps;

    function bindProfileEvents() {
      if (!profileForm) {
        return;
      }

      profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(profileForm);
        const draft = getEditableProfile();
        state.profile = {
          name: String(formData.get("name") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          phone: String(formData.get("phone") || "").trim(),
          photoKind: draft.photoKind || "none",
          photoValue: draft.photoValue || "",
          department: String(formData.get("department") || "").trim(),
          role: draft.role || "Administrador"
        };
        setProfileDraft({ ...state.profile });
        persistAndRender();
        closeProfileDialog();
        await syncUserProfile();
      });

      profilePhotoTrigger?.addEventListener("click", () => {
        profilePhotoFile?.click();
      });

      profilePhotoFile?.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
          return;
        }

        const dataUrl = await readFileAsDataUrl(file);
        setProfileDraft({
          ...getEditableProfile(),
          photoKind: "upload",
          photoValue: dataUrl
        });
        renderProfileEditor();
      });

      ["#profile-name", "#profile-email", "#profile-department", "#profile-role", "#profile-phone"].forEach((selector) => {
        document.querySelector(selector)?.addEventListener("input", () => {
          updateProfileDraftFromForm();
        });
      });

      document.querySelector("#profile-dialog-close")?.addEventListener("click", closeProfileDialog);
      document.querySelector("#profile-dialog-cancel")?.addEventListener("click", closeProfileDialog);

      profileDialog?.addEventListener("click", (event) => {
        if (event.target === profileDialog) {
          closeProfileDialog();
        }
      });

      profileDialog?.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeProfileDialog();
      });
    }

    function renderProfileEditor() {
      if (!profileForm) {
        return;
      }

      const editableProfile = getEditableProfile();
      document.querySelector("#profile-name").value = editableProfile.name;
      document.querySelector("#profile-email").value = editableProfile.email;
      if (document.querySelector("#profile-phone")) {
        document.querySelector("#profile-phone").value = editableProfile.phone || "";
      }
      document.querySelector("#profile-department").value = editableProfile.department;
      document.querySelector("#profile-role").value = editableProfile.role;
      document.querySelector("#profile-preview-name").textContent = editableProfile.name || "Usuario";
      document.querySelector("#profile-preview-role").textContent = editableProfile.role || "Administrador";
      applyPhotoPreview(profilePhotoTrigger, editableProfile.photoKind, editableProfile.photoValue, editableProfile.name);
    }

    function openProfileDialog() {
      if (!profileDialog) return;
      renderProfileEditor();
      renderAccessTrees();
      profileDialog.showModal();
      document.body.classList.add("dialog-open");
    }

    function closeProfileDialog() {
      if (!profileDialog) return;
      profileDialog.close();
      document.body.classList.remove("dialog-open");
      setProfileDraft(null);
    }

    return {
      bindProfileEvents,
      renderProfileEditor,
      openProfileDialog,
      closeProfileDialog
    };
  }

  window.VECTON_PROFILE_DIALOG = {
    createProfileDialogModule
  };
})(window);

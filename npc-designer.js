(() => {
  "use strict";

  const POSE_IDS = ["normal", "panic", "ko"];
  const TOOL_IDS = ["select", "move", "rect", "ellipse", "line", "curve", "polygon", "color", "gradient", "eyedropper", "hand"];

  const DESIGN_CANVAS_WIDTH = 960;
  const DESIGN_CANVAS_HEIGHT = 540;
  const DESIGN_CENTER_X = 480;
  const DESIGN_BASELINE_Y = 430;
  const GAME_BASE_W = 24;
  const GAME_BASE_H = 46;
  const GAME_TO_EDITOR_SCALE = 3.2;
  const HANDLE_SCREEN_SIZE = 10;
  const CONSTRAINTS = window.NPCDesignerConstraints || null;
  const SHARED_RENDER = window.NPCRenderShared || null;
  const SUNDRESS_HAIR_PROFILE = Object.freeze({
    topLift: 0.46,
    backWidth: 1.18,
    backDrop: 2.35,
    sideOutset: 1.04,
    templeOutset: 1.0,
    templeDrop: 0.56,
    bangLift: 0.54,
    bangDrop: 0.22
  });

  // Mirrored from teabag-simulator.html BASE_W/BASE_H + CHARACTER_DEFS wScale/hScale.
  const GAME_CHARACTER_HEIGHT_REFERENCES = [
    { id: "player", label: "Player", widthPx: 26, heightPx: 48 },
    { id: "normal", label: "Pedestrian", widthPx: 24, heightPx: 46 },
    { id: "small", label: "Small", widthPx: 19, heightPx: 39 },
    { id: "tall", label: "Tall", widthPx: 23, heightPx: 53 },
    { id: "muscle", label: "Muscle", widthPx: 34, heightPx: 51 },
    { id: "sumo", label: "Sumo", widthPx: 38, heightPx: 44 },
    { id: "giant", label: "Giant", widthPx: 26, heightPx: 62 },
    { id: "chad", label: "Chad", widthPx: 31, heightPx: 53 },
    { id: "karen", label: "Karen", widthPx: 25, heightPx: 46 },
    { id: "babushka", label: "Babushka", widthPx: 36, heightPx: 39 },
    { id: "gymgirl", label: "Gym Girl", widthPx: 23, heightPx: 48 },
    { id: "baller", label: "Baller", widthPx: 28, heightPx: 60 },
    { id: "gothmommy", label: "Goth Mommy", widthPx: 32, heightPx: 58 },
    { id: "shopaholic", label: "Shopaholic", widthPx: 23, heightPx: 46 },
    { id: "influencer", label: "Influencer", widthPx: 22, heightPx: 44 },
    { id: "jogger", label: "Jogger", widthPx: 23, heightPx: 51 },
    { id: "dog_walker", label: "Dog Walker", widthPx: 23, heightPx: 46 },
    { id: "club_dude", label: "Club Dude", widthPx: 26, heightPx: 51 },
    { id: "party_girl", label: "Party Girl", widthPx: 22, heightPx: 44 },
    { id: "sundress_girl", label: "Sundress Girl", widthPx: 22, heightPx: 44 },
    { id: "bouncer", label: "Bouncer", widthPx: 36, heightPx: 55 },
    { id: "hard_hat", label: "Hard Hat", widthPx: 26, heightPx: 51 },
    { id: "forklift_phil", label: "Forklift Phil", widthPx: 34, heightPx: 53 },
    { id: "soccer_mom", label: "Soccer Mom", widthPx: 25, heightPx: 46 },
    { id: "mailman", label: "Mailman", widthPx: 24, heightPx: 48 },
    { id: "lawn_dad", label: "Lawn Dad", widthPx: 28, heightPx: 48 }
  ];

  const ui = {};

  const state = {
    document: null,
    activePose: "normal",
    activeTool: "select",
    selectedIds: new Set(),
    layerListAnchorId: null,
    interaction: null,
    polygonDraft: null,
    rafId: 0,
    renderDirty: false,
    statusTimer: 0,
    view: {
      zoom: 1,
      panX: 0,
      panY: 0,
      facing: 1
    },
    styleDraft: {
      fill: "#3b82f6",
      stroke: "#0f172a",
      strokeWidth: 2,
      opacity: 1,
      gradientStart: "#f97316",
      gradientEnd: "#06b6d4",
      gradientAngle: 90
    },
    layerIdCounter: 1,
    hitCanvas: null,
    hitCtx: null,
    strictVisualRules: true,
    autoFixVisualIssues: true,
    validation: null,
    constraintReference: [],
    runtimeRenderer: null,
    runtimePreview: {
      pose: "normal",
      facing: 1,
      scale: 1,
      tick: 0,
      worldContext: true
    },
    runtimeCharDefs: Object.create(null),
    skipAutoFixOnce: false
  };

  function initDesigner() {
    cacheUI();
    initConstraintScaffold();
    bindUI();
    initHitCanvas();
    loadInitialDocument();
    updateToolButtons();
    updatePoseTabs();
    updateZoomUI();
    requestRender();
    setStatus("Designer ready.");
  }

  function cacheUI() {
    ui.templateSelect = document.getElementById("templateSelect");
    ui.resetPoseBtn = document.getElementById("resetPoseBtn");
    ui.resetAllBtn = document.getElementById("resetAllBtn");
    ui.poseTabs = Array.from(document.querySelectorAll(".pose-tab"));
    ui.copyToPoseSelect = document.getElementById("copyToPoseSelect");
    ui.copyPoseBtn = document.getElementById("copyPoseBtn");
    ui.applySundressHairBtn = document.getElementById("applySundressHairBtn");
    ui.applySundressHairAllBtn = document.getElementById("applySundressHairAllBtn");
    ui.facingToggleBtn = document.getElementById("facingToggleBtn");
    ui.zoomOutBtn = document.getElementById("zoomOutBtn");
    ui.zoomInBtn = document.getElementById("zoomInBtn");
    ui.zoomFitBtn = document.getElementById("zoomFitBtn");
    ui.zoomRange = document.getElementById("zoomRange");
    ui.zoomValue = document.getElementById("zoomValue");

    ui.charIdInput = document.getElementById("charIdInput");
    ui.charLabelInput = document.getElementById("charLabelInput");
    ui.issueFieldMap = {
      "field:char-id": document.getElementById("issue-char-id"),
      "field:char-label": document.getElementById("issue-char-label"),
      "field:runtime-base-type": document.getElementById("issue-runtime-base-type"),
      "field:runtime-npc-type": document.getElementById("issue-runtime-npc-type"),
      "field:runtime-scale": document.getElementById("issue-runtime-scale"),
      "field:runtime-health": document.getElementById("issue-runtime-health"),
      "field:runtime-colors": document.getElementById("issue-runtime-colors"),
      "field:runtime-dress": document.getElementById("issue-runtime-dress")
    };

    ui.runtimeBaseTypeSelect = document.getElementById("runtimeBaseTypeSelect");
    ui.runtimeNpcTypeInput = document.getElementById("runtimeNpcTypeInput");
    ui.runtimeWScaleInput = document.getElementById("runtimeWScaleInput");
    ui.runtimeHScaleInput = document.getElementById("runtimeHScaleInput");
    ui.runtimeHealthMinInput = document.getElementById("runtimeHealthMinInput");
    ui.runtimeHealthMaxInput = document.getElementById("runtimeHealthMaxInput");
    ui.runtimeBodyColorInput = document.getElementById("runtimeBodyColorInput");
    ui.runtimeSkinColorInput = document.getElementById("runtimeSkinColorInput");
    ui.runtimeHairColorInput = document.getElementById("runtimeHairColorInput");
    ui.runtimeHairStyleSelect = document.getElementById("runtimeHairStyleSelect");
    ui.runtimeEyeColorInput = document.getElementById("runtimeEyeColorInput");
    ui.runtimeLegColorInput = document.getElementById("runtimeLegColorInput");
    ui.runtimeShoeColorInput = document.getElementById("runtimeShoeColorInput");
    ui.runtimeFeminineBodyToggle = document.getElementById("runtimeFeminineBodyToggle");
    ui.runtimeBustScaleInput = document.getElementById("runtimeBustScaleInput");
    ui.runtimeHasDressToggle = document.getElementById("runtimeHasDressToggle");
    ui.runtimeShortDressToggle = document.getElementById("runtimeShortDressToggle");

    ui.toolButtons = Array.from(document.querySelectorAll(".tool-btn"));

    ui.showGridToggle = document.getElementById("showGridToggle");
    ui.showHeightToggle = document.getElementById("showHeightToggle");
    ui.showSilhouetteToggle = document.getElementById("showSilhouetteToggle");
    ui.heightFilterInput = document.getElementById("heightFilterInput");

    ui.exportJsonBtn = document.getElementById("exportJsonBtn");
    ui.importJsonBtn = document.getElementById("importJsonBtn");
    ui.copyJsonBtn = document.getElementById("copyJsonBtn");
    ui.downloadJsonBtn = document.getElementById("downloadJsonBtn");
    ui.exportCompactBtn = document.getElementById("exportCompactBtn");
    ui.copyCompactBtn = document.getElementById("copyCompactBtn");
    ui.jsonWorkspace = document.getElementById("jsonWorkspace");
    ui.importFileInput = document.getElementById("importFileInput");

    ui.editorCanvas = document.getElementById("editorCanvas");
    ui.editorCtx = ui.editorCanvas.getContext("2d");
    ui.canvasStatus = document.getElementById("canvasStatus");

    ui.layerList = document.getElementById("layerList");
    ui.layerUpBtn = document.getElementById("layerUpBtn");
    ui.layerDownBtn = document.getElementById("layerDownBtn");
    ui.layerDuplicateBtn = document.getElementById("layerDuplicateBtn");
    ui.layerDeleteBtn = document.getElementById("layerDeleteBtn");

    ui.fillColorInput = document.getElementById("fillColorInput");
    ui.strokeColorInput = document.getElementById("strokeColorInput");
    ui.strokeWidthInput = document.getElementById("strokeWidthInput");
    ui.strokeWidthValue = document.getElementById("strokeWidthValue");
    ui.opacityInput = document.getElementById("opacityInput");
    ui.opacityValue = document.getElementById("opacityValue");
    ui.applyStyleBtn = document.getElementById("applyStyleBtn");
    ui.solidFillBtn = document.getElementById("solidFillBtn");

    ui.gradStartInput = document.getElementById("gradStartInput");
    ui.gradEndInput = document.getElementById("gradEndInput");
    ui.gradAngleInput = document.getElementById("gradAngleInput");
    ui.gradAngleValue = document.getElementById("gradAngleValue");
    ui.applyGradientBtn = document.getElementById("applyGradientBtn");

    ui.previewCanvases = {
      normal: document.getElementById("previewNormal"),
      panic: document.getElementById("previewPanic"),
      ko: document.getElementById("previewKo")
    };
    ui.selectionInfo = document.getElementById("selectionInfo");
    ui.strictVisualRulesToggle = document.getElementById("strictVisualRulesToggle");
    ui.autoFixVisualToggle = document.getElementById("autoFixVisualToggle");
    ui.readinessSummary = document.getElementById("readinessSummary");
    ui.hardBlockerList = document.getElementById("hardBlockerList");
    ui.warningList = document.getElementById("warningList");
    ui.readinessMeta = document.getElementById("readinessMeta");
    ui.constraintReferenceList = document.getElementById("constraintReferenceList");

    ui.runtimePreviewPoseSelect = document.getElementById("runtimePreviewPoseSelect");
    ui.runtimePreviewFacingSelect = document.getElementById("runtimePreviewFacingSelect");
    ui.runtimePreviewScaleInput = document.getElementById("runtimePreviewScaleInput");
    ui.runtimePreviewScaleValue = document.getElementById("runtimePreviewScaleValue");
    ui.runtimePreviewTickInput = document.getElementById("runtimePreviewTickInput");
    ui.runtimePreviewTickValue = document.getElementById("runtimePreviewTickValue");
    ui.runtimePreviewWorldToggle = document.getElementById("runtimePreviewWorldToggle");
    ui.runtimePreviewCanvas = document.getElementById("runtimePreviewCanvas");
    ui.runtimePreviewStatus = document.getElementById("runtimePreviewStatus");
    ui.runtimePreviewCtx = ui.runtimePreviewCanvas.getContext("2d");

    ui.editorCanvas.width = DESIGN_CANVAS_WIDTH;
    ui.editorCanvas.height = DESIGN_CANVAS_HEIGHT;
  }

  function initConstraintScaffold() {
    if (CONSTRAINTS && typeof CONSTRAINTS.getConstraintReference === "function") {
      state.constraintReference = CONSTRAINTS.getConstraintReference();
    } else {
      state.constraintReference = [];
    }

    const runtimeBaseDefs = CONSTRAINTS && typeof CONSTRAINTS.getRuntimeBaseDefs === "function"
      ? CONSTRAINTS.getRuntimeBaseDefs()
      : [];
    state.runtimeCharDefs = Object.create(null);
    runtimeBaseDefs.forEach((def) => {
      if (!def || !def.name) return;
      state.runtimeCharDefs[def.name] = deepClone(def);
    });

    populateRuntimeProfileOptionLists(runtimeBaseDefs);

    if (SHARED_RENDER && typeof SHARED_RENDER.createCharacterRenderer === "function") {
      state.runtimeRenderer = SHARED_RENDER.createCharacterRenderer({
        ctx: ui.runtimePreviewCtx,
        CHAR_BY_NAME: state.runtimeCharDefs,
        clamp,
        roundRect: fillRoundRect
      });
    } else {
      state.runtimeRenderer = null;
    }
  }

  function populateRuntimeProfileOptionLists(runtimeBaseDefs) {
    const baseDefs = Array.isArray(runtimeBaseDefs) ? runtimeBaseDefs : [];
    ui.runtimeBaseTypeSelect.replaceChildren();
    baseDefs.forEach((def) => {
      if (!def || !def.name) return;
      const opt = document.createElement("option");
      opt.value = def.name;
      opt.textContent = `${def.name}${def.label ? ` (${def.label})` : ""}`;
      ui.runtimeBaseTypeSelect.append(opt);
    });
    if (!ui.runtimeBaseTypeSelect.options.length) {
      const opt = document.createElement("option");
      opt.value = "normal";
      opt.textContent = "normal";
      ui.runtimeBaseTypeSelect.append(opt);
    }

    const hairStyles = CONSTRAINTS && Array.isArray(CONSTRAINTS.HAIR_STYLE_OPTIONS)
      ? CONSTRAINTS.HAIR_STYLE_OPTIONS
      : ["short", "long", "ponytail", "mohawk", "bun", "spiky", "fade", "buzz"];
    ui.runtimeHairStyleSelect.replaceChildren();
    hairStyles.forEach((styleName) => {
      const opt = document.createElement("option");
      opt.value = styleName;
      opt.textContent = styleName;
      ui.runtimeHairStyleSelect.append(opt);
    });
  }

  function bindRuntimeProfileEvents() {
    ui.runtimeBaseTypeSelect.addEventListener("change", () => {
      ensureRuntimeProfile();
      applyRuntimeBasePreset(ui.runtimeBaseTypeSelect.value);
      stampUpdatedAt();
      requestRender();
    });

    ui.runtimeNpcTypeInput.addEventListener("input", () => {
      ensureRuntimeProfile();
      state.document.runtimeProfile.npcType = ui.runtimeNpcTypeInput.value.trim();
      stampUpdatedAt();
      requestRender();
    });

    [
      ui.runtimeWScaleInput,
      ui.runtimeHScaleInput,
      ui.runtimeHealthMinInput,
      ui.runtimeHealthMaxInput,
      ui.runtimeBustScaleInput
    ].forEach((inputEl) => {
      inputEl.addEventListener("input", onRuntimeProfileNumericInput);
    });

    [
      ui.runtimeBodyColorInput,
      ui.runtimeSkinColorInput,
      ui.runtimeHairColorInput,
      ui.runtimeEyeColorInput,
      ui.runtimeLegColorInput,
      ui.runtimeShoeColorInput
    ].forEach((inputEl) => {
      inputEl.addEventListener("input", onRuntimeProfileColorInput);
    });

    ui.runtimeHairStyleSelect.addEventListener("change", () => {
      ensureRuntimeProfile();
      state.document.runtimeProfile.hairStyle = ui.runtimeHairStyleSelect.value;
      stampUpdatedAt();
      requestRender();
    });

    [ui.runtimeFeminineBodyToggle, ui.runtimeHasDressToggle, ui.runtimeShortDressToggle].forEach((toggle) => {
      toggle.addEventListener("change", onRuntimeProfileToggleInput);
    });
  }

  function bindReadinessPanelEvents() {
    ui.strictVisualRulesToggle.addEventListener("change", () => {
      state.strictVisualRules = !!ui.strictVisualRulesToggle.checked;
      if (state.strictVisualRules && !ui.autoFixVisualToggle.checked) {
        ui.autoFixVisualToggle.checked = true;
      }
      state.autoFixVisualIssues = !!ui.autoFixVisualToggle.checked;
      updateReadinessToggleState();
      requestRender();
    });

    ui.autoFixVisualToggle.addEventListener("change", () => {
      state.autoFixVisualIssues = !!ui.autoFixVisualToggle.checked;
      requestRender();
    });

    [ui.hardBlockerList, ui.warningList].forEach((listEl) => {
      listEl.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-target]");
        if (!button) return;
        jumpToIssueTarget(button.dataset.target || "");
      });
    });

    Object.entries(ui.issueFieldMap).forEach((entry) => {
      const [, el] = entry;
      if (!el) return;
      el.addEventListener("click", () => {
        const target = el.dataset.target || "";
        if (!target) return;
        jumpToIssueTarget(target);
      });
    });
  }

  function bindRuntimePreviewEvents() {
    ui.runtimePreviewPoseSelect.addEventListener("change", () => {
      state.runtimePreview.pose = POSE_IDS.includes(ui.runtimePreviewPoseSelect.value)
        ? ui.runtimePreviewPoseSelect.value
        : "normal";
      requestRender();
    });

    ui.runtimePreviewFacingSelect.addEventListener("change", () => {
      state.runtimePreview.facing = ui.runtimePreviewFacingSelect.value === "-1" ? -1 : 1;
      requestRender();
    });

    ui.runtimePreviewScaleInput.addEventListener("input", () => {
      state.runtimePreview.scale = clamp(parseFloat(ui.runtimePreviewScaleInput.value), 0.5, 1.8);
      updateRuntimePreviewLabels();
      requestRender();
    });

    ui.runtimePreviewTickInput.addEventListener("input", () => {
      state.runtimePreview.tick = clamp(parseFloat(ui.runtimePreviewTickInput.value), 0, 10);
      updateRuntimePreviewLabels();
      requestRender();
    });

    ui.runtimePreviewWorldToggle.addEventListener("change", () => {
      state.runtimePreview.worldContext = !!ui.runtimePreviewWorldToggle.checked;
      requestRender();
    });
  }

  function onRuntimeProfileNumericInput() {
    ensureRuntimeProfile();
    const profile = state.document.runtimeProfile;
    profile.wScale = num(ui.runtimeWScaleInput.value, profile.wScale);
    profile.hScale = num(ui.runtimeHScaleInput.value, profile.hScale);
    profile.healthMin = num(ui.runtimeHealthMinInput.value, profile.healthMin);
    profile.healthMax = num(ui.runtimeHealthMaxInput.value, profile.healthMax);
    profile.bustScale = num(ui.runtimeBustScaleInput.value, profile.bustScale);
    stampUpdatedAt();
    requestRender();
  }

  function onRuntimeProfileColorInput() {
    ensureRuntimeProfile();
    const profile = state.document.runtimeProfile;
    profile.color = ui.runtimeBodyColorInput.value;
    profile.skinColor = ui.runtimeSkinColorInput.value;
    profile.hairColor = ui.runtimeHairColorInput.value;
    profile.eyeColor = ui.runtimeEyeColorInput.value;
    profile.legColor = ui.runtimeLegColorInput.value;
    profile.shoeColor = ui.runtimeShoeColorInput.value;
    stampUpdatedAt();
    requestRender();
  }

  function onRuntimeProfileToggleInput() {
    ensureRuntimeProfile();
    const profile = state.document.runtimeProfile;
    profile.feminineBody = !!ui.runtimeFeminineBodyToggle.checked;
    profile.hasDress = !!ui.runtimeHasDressToggle.checked;
    profile.shortDress = !!ui.runtimeShortDressToggle.checked;
    stampUpdatedAt();
    requestRender();
  }

  function bindUI() {
    ui.templateSelect.addEventListener("change", () => {
      ensureDocument();
      state.document.meta.baseTemplate = ui.templateSelect.value;
      ensureRuntimeProfile();
      stampUpdatedAt();
      requestRender();
    });

    ui.resetPoseBtn.addEventListener("click", () => {
      resetPoseToTemplate(ui.templateSelect.value, state.activePose);
    });

    ui.resetAllBtn.addEventListener("click", () => {
      resetAllPosesToTemplate(ui.templateSelect.value);
    });

    ui.poseTabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        setActivePose(btn.dataset.pose || "normal");
      });
    });

    ui.copyPoseBtn.addEventListener("click", () => {
      copyPoseToPose(state.activePose, ui.copyToPoseSelect.value);
    });
    ui.applySundressHairBtn.addEventListener("click", () => {
      const applied = applySundressHairPresetToPose(state.activePose);
      if (!applied) return;
      stampUpdatedAt();
      requestRender();
      setStatus(`Sundress Hair preset applied to ${state.activePose}.`);
    });
    ui.applySundressHairAllBtn.addEventListener("click", () => {
      const count = applySundressHairPresetToAllPoses();
      if (!count) return;
      stampUpdatedAt();
      requestRender();
      setStatus(`Sundress Hair preset applied to ${count} pose(s).`);
    });

    ui.facingToggleBtn.addEventListener("click", () => {
      state.view.facing = state.view.facing === 1 ? -1 : 1;
      ui.facingToggleBtn.textContent = state.view.facing === 1 ? "Facing: Right" : "Facing: Left";
      requestRender();
    });

    ui.zoomRange.addEventListener("input", () => {
      setZoom(parseFloat(ui.zoomRange.value), { anchorCanvas: { x: DESIGN_CANVAS_WIDTH / 2, y: DESIGN_CANVAS_HEIGHT / 2 } });
    });

    ui.zoomInBtn.addEventListener("click", () => adjustZoom(1.15));
    ui.zoomOutBtn.addEventListener("click", () => adjustZoom(1 / 1.15));
    ui.zoomFitBtn.addEventListener("click", () => fitToModel());

    ui.charIdInput.addEventListener("input", () => {
      ensureDocument();
      state.document.meta.id = ui.charIdInput.value.trim();
      stampUpdatedAt();
      requestRender();
    });

    ui.charLabelInput.addEventListener("input", () => {
      ensureDocument();
      state.document.meta.label = ui.charLabelInput.value;
      stampUpdatedAt();
      requestRender();
    });

    ui.toolButtons.forEach((btn) => {
      btn.addEventListener("click", () => setActiveTool(btn.dataset.tool || "select"));
    });

    ui.showGridToggle.addEventListener("change", () => {
      ensureDocument();
      state.document.editor.showGrid = ui.showGridToggle.checked;
      requestRender();
    });
    ui.showHeightToggle.addEventListener("change", () => {
      ensureDocument();
      state.document.editor.showHeightLines = ui.showHeightToggle.checked;
      requestRender();
    });
    ui.showSilhouetteToggle.addEventListener("change", () => {
      ensureDocument();
      state.document.editor.showSilhouettes = ui.showSilhouetteToggle.checked;
      requestRender();
    });
    ui.heightFilterInput.addEventListener("input", requestRender);

    ui.strokeWidthInput.addEventListener("input", () => {
      state.styleDraft.strokeWidth = parseFloat(ui.strokeWidthInput.value);
      ui.strokeWidthValue.textContent = String(state.styleDraft.strokeWidth);
    });

    ui.opacityInput.addEventListener("input", () => {
      state.styleDraft.opacity = parseFloat(ui.opacityInput.value);
      ui.opacityValue.textContent = state.styleDraft.opacity.toFixed(2);
    });

    ui.fillColorInput.addEventListener("input", () => { state.styleDraft.fill = ui.fillColorInput.value; });
    ui.strokeColorInput.addEventListener("input", () => { state.styleDraft.stroke = ui.strokeColorInput.value; });

    ui.gradStartInput.addEventListener("input", () => { state.styleDraft.gradientStart = ui.gradStartInput.value; });
    ui.gradEndInput.addEventListener("input", () => { state.styleDraft.gradientEnd = ui.gradEndInput.value; });
    ui.gradAngleInput.addEventListener("input", () => {
      state.styleDraft.gradientAngle = parseFloat(ui.gradAngleInput.value);
      ui.gradAngleValue.textContent = `${Math.round(state.styleDraft.gradientAngle)}°`;
    });

    ui.applyStyleBtn.addEventListener("click", applySolidStyleToSelection);
    ui.solidFillBtn.addEventListener("click", () => {
      withSelectedLayers((layer) => {
        layer.style.fillMode = "solid";
      });
      setStatus("Selected layers set to solid fill.");
    });

    ui.applyGradientBtn.addEventListener("click", () => {
      applyGradientToSelection({
        type: "linear",
        angle: state.styleDraft.gradientAngle,
        stops: [
          { offset: 0, color: state.styleDraft.gradientStart },
          { offset: 1, color: state.styleDraft.gradientEnd }
        ]
      });
    });

    ui.layerDuplicateBtn.addEventListener("click", duplicateSelectedLayers);
    ui.layerDeleteBtn.addEventListener("click", deleteSelectedLayers);
    ui.layerUpBtn.addEventListener("click", () => reorderSelectedLayers("up"));
    ui.layerDownBtn.addEventListener("click", () => reorderSelectedLayers("down"));

    ui.layerList.addEventListener("click", onLayerListClick);
    ui.layerList.addEventListener("dblclick", onLayerListDoubleClick);

    ui.exportJsonBtn.addEventListener("click", () => {
      const text = exportEditableJson();
      ui.jsonWorkspace.value = text;
      setStatus("Editable JSON exported to workspace.");
    });

    ui.importJsonBtn.addEventListener("click", () => {
      const text = ui.jsonWorkspace.value.trim();
      if (text) {
        importEditableJson(text);
        return;
      }
      ui.importFileInput.click();
    });

    ui.copyJsonBtn.addEventListener("click", async () => {
      const text = ui.jsonWorkspace.value.trim() || exportEditableJson();
      await copyJsonToClipboard(text);
    });

    ui.downloadJsonBtn.addEventListener("click", () => {
      const text = ui.jsonWorkspace.value.trim() || exportEditableJson();
      downloadJson(`${safeName(state.document.meta.id || "npc-designer")}.json`, text);
    });

    ui.exportCompactBtn.addEventListener("click", () => {
      const payload = exportIntegrationPayload();
      if (!payload) return;
      const text = JSON.stringify(payload, null, 2);
      ui.jsonWorkspace.value = text;
      setStatus("Compact payload exported.");
    });

    ui.copyCompactBtn.addEventListener("click", async () => {
      const payload = exportIntegrationPayload();
      if (!payload) return;
      await copyJsonToClipboard(JSON.stringify(payload, null, 2));
    });

    ui.importFileInput.addEventListener("change", async () => {
      const file = ui.importFileInput.files && ui.importFileInput.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        ui.jsonWorkspace.value = text;
        importEditableJson(text);
      } catch (err) {
        setStatus(`Import failed: ${err.message}`);
      } finally {
        ui.importFileInput.value = "";
      }
    });

    ui.editorCanvas.addEventListener("pointerdown", onCanvasPointerDown);
    ui.editorCanvas.addEventListener("pointermove", onCanvasPointerMove);
    ui.editorCanvas.addEventListener("pointerup", onCanvasPointerUp);
    ui.editorCanvas.addEventListener("pointerleave", onCanvasPointerUp);
    ui.editorCanvas.addEventListener("wheel", onCanvasWheel, { passive: false });

    window.addEventListener("keydown", onWindowKeyDown);
    window.addEventListener("resize", requestRender);

    bindRuntimeProfileEvents();
    bindReadinessPanelEvents();
    bindRuntimePreviewEvents();
  }

  function initHitCanvas() {
    state.hitCanvas = document.createElement("canvas");
    state.hitCanvas.width = DESIGN_CANVAS_WIDTH;
    state.hitCanvas.height = DESIGN_CANVAS_HEIGHT;
    state.hitCtx = state.hitCanvas.getContext("2d");
  }

  function ensureDocument() {
    if (!state.document) {
      state.document = createDesignerDocument("male_base");
    }
  }

  function loadInitialDocument() {
    state.document = createDesignerDocument("male_base");
    state.activePose = "normal";
    state.selectedIds.clear();
    state.layerListAnchorId = null;
    state.validation = null;
    syncControlsFromDocument();
    fitToModel();
  }

  function createDesignerDocument(templateId) {
    const now = new Date().toISOString();
    const templates = createBaseTemplate(templateId);
    return {
      version: 1,
      meta: {
        id: "npc_custom_001",
        label: "Custom NPC",
        baseTemplate: templateId,
        createdAt: now,
        updatedAt: now
      },
      canvas: {
        width: DESIGN_CANVAS_WIDTH,
        height: DESIGN_CANVAS_HEIGHT,
        unit: "game_px"
      },
      editor: {
        zoom: 1,
        panX: 0,
        panY: 0,
        facing: 1,
        showGrid: true,
        showHeightLines: true,
        showSilhouettes: false
      },
      runtimeProfile: createDefaultRuntimeProfile(templateId),
      poses: {
        normal: { layers: templates.normal },
        panic: { layers: templates.panic },
        ko: { layers: templates.ko }
      }
    };
  }

  function stampUpdatedAt() {
    if (!state.document) return;
    state.document.meta.updatedAt = new Date().toISOString();
  }

  function syncControlsFromDocument() {
    ensureDocument();
    ensureRuntimeProfile();
    ui.templateSelect.value = state.document.meta.baseTemplate || "male_base";
    ui.charIdInput.value = state.document.meta.id || "";
    ui.charLabelInput.value = state.document.meta.label || "";

    state.view.zoom = clamp(state.document.editor.zoom || 1, 0.25, 4);
    state.view.panX = state.document.editor.panX || 0;
    state.view.panY = state.document.editor.panY || 0;
    state.view.facing = state.document.editor.facing === -1 ? -1 : 1;

    ui.showGridToggle.checked = !!state.document.editor.showGrid;
    ui.showHeightToggle.checked = !!state.document.editor.showHeightLines;
    ui.showSilhouetteToggle.checked = !!state.document.editor.showSilhouettes;

    ui.facingToggleBtn.textContent = state.view.facing === 1 ? "Facing: Right" : "Facing: Left";

    ui.strokeWidthValue.textContent = String(state.styleDraft.strokeWidth);
    ui.opacityValue.textContent = state.styleDraft.opacity.toFixed(2);
    ui.gradAngleValue.textContent = `${Math.round(state.styleDraft.gradientAngle)}°`;
    syncRuntimeProfileInputs();
    updateReadinessToggleState();
    updateRuntimePreviewLabels();
    renderConstraintReferenceList();
    updateZoomUI();
  }

  function createDefaultRuntimeProfile(baseTemplate) {
    if (CONSTRAINTS && typeof CONSTRAINTS.createDefaultRuntimeProfile === "function") {
      return CONSTRAINTS.createDefaultRuntimeProfile(baseTemplate);
    }
    return {
      baseType: "normal",
      npcType: "normal_custom",
      wScale: 1,
      hScale: 1,
      healthMin: 60,
      healthMax: 100,
      color: "#3182CE",
      skinColor: "#F0C8A0",
      hairColor: "#8B4513",
      hairStyle: "long",
      eyeColor: "#1A1A2E",
      legColor: "#4A5568",
      shoeColor: "#2D3748",
      feminineBody: baseTemplate === "female_base",
      bustScale: baseTemplate === "female_base" ? 0.85 : 0,
      hasDress: false,
      shortDress: false
    };
  }

  function normalizeRuntimeProfile(profile, baseTemplate) {
    if (CONSTRAINTS && typeof CONSTRAINTS.normalizeRuntimeProfile === "function") {
      return CONSTRAINTS.normalizeRuntimeProfile(profile, baseTemplate);
    }
    const fallback = createDefaultRuntimeProfile(baseTemplate);
    const raw = (profile && typeof profile === "object") ? profile : {};
    return {
      baseType: typeof raw.baseType === "string" ? raw.baseType : fallback.baseType,
      npcType: typeof raw.npcType === "string" ? raw.npcType.trim() : fallback.npcType,
      wScale: num(raw.wScale, fallback.wScale),
      hScale: num(raw.hScale, fallback.hScale),
      healthMin: num(raw.healthMin, fallback.healthMin),
      healthMax: num(raw.healthMax, fallback.healthMax),
      color: isColor(raw.color) ? raw.color : fallback.color,
      skinColor: isColor(raw.skinColor) ? raw.skinColor : fallback.skinColor,
      hairColor: isColor(raw.hairColor) ? raw.hairColor : fallback.hairColor,
      hairStyle: typeof raw.hairStyle === "string" ? raw.hairStyle : fallback.hairStyle,
      eyeColor: isColor(raw.eyeColor) ? raw.eyeColor : fallback.eyeColor,
      legColor: isColor(raw.legColor) ? raw.legColor : fallback.legColor,
      shoeColor: isColor(raw.shoeColor) ? raw.shoeColor : fallback.shoeColor,
      feminineBody: raw.feminineBody !== undefined ? !!raw.feminineBody : !!fallback.feminineBody,
      bustScale: num(raw.bustScale, fallback.bustScale),
      hasDress: raw.hasDress !== undefined ? !!raw.hasDress : !!fallback.hasDress,
      shortDress: raw.shortDress !== undefined ? !!raw.shortDress : !!fallback.shortDress
    };
  }

  function ensureRuntimeProfile() {
    ensureDocument();
    state.document.runtimeProfile = normalizeRuntimeProfile(
      state.document.runtimeProfile,
      state.document.meta.baseTemplate
    );
    return state.document.runtimeProfile;
  }

  function applyRuntimeBasePreset(baseType) {
    ensureDocument();
    const baseTemplate = state.document.meta.baseTemplate;
    const current = ensureRuntimeProfile();
    const preset = createDefaultRuntimeProfile(baseTemplate);
    if (CONSTRAINTS && typeof CONSTRAINTS.getRuntimeBaseDefs === "function") {
      const selected = CONSTRAINTS.getRuntimeBaseDefs().find((def) => def.name === baseType);
      if (selected) {
        const normalizedPreset = normalizeRuntimeProfile({ ...selected, baseType: selected.name }, baseTemplate);
        state.document.runtimeProfile = {
          ...normalizedPreset,
          npcType: `${selected.name}_custom`
        };
      } else {
        state.document.runtimeProfile = {
          ...preset,
          npcType: current.npcType || preset.npcType
        };
      }
    } else {
      state.document.runtimeProfile = {
        ...preset,
        baseType: baseType || preset.baseType,
        npcType: current.npcType || preset.npcType
      };
    }
    syncRuntimeProfileInputs();
  }

  function syncRuntimeProfileInputs() {
    const profile = ensureRuntimeProfile();
    if (ui.runtimeBaseTypeSelect.querySelector(`option[value="${profile.baseType}"]`)) {
      ui.runtimeBaseTypeSelect.value = profile.baseType;
    } else {
      ui.runtimeBaseTypeSelect.value = ui.runtimeBaseTypeSelect.options[0]?.value || "normal";
    }
    ui.runtimeNpcTypeInput.value = profile.npcType || "";
    ui.runtimeWScaleInput.value = String(num(profile.wScale, 1));
    ui.runtimeHScaleInput.value = String(num(profile.hScale, 1));
    ui.runtimeHealthMinInput.value = String(Math.round(num(profile.healthMin, 60)));
    ui.runtimeHealthMaxInput.value = String(Math.round(num(profile.healthMax, 100)));
    ui.runtimeBodyColorInput.value = isColor(profile.color) ? profile.color : "#3182ce";
    ui.runtimeSkinColorInput.value = isColor(profile.skinColor) ? profile.skinColor : "#f0c8a0";
    ui.runtimeHairColorInput.value = isColor(profile.hairColor) ? profile.hairColor : "#8b4513";
    if (ui.runtimeHairStyleSelect.querySelector(`option[value="${profile.hairStyle}"]`)) {
      ui.runtimeHairStyleSelect.value = profile.hairStyle;
    }
    ui.runtimeEyeColorInput.value = isColor(profile.eyeColor) ? profile.eyeColor : "#1a1a2e";
    ui.runtimeLegColorInput.value = isColor(profile.legColor) ? profile.legColor : "#4a5568";
    ui.runtimeShoeColorInput.value = isColor(profile.shoeColor) ? profile.shoeColor : "#2d3748";
    ui.runtimeFeminineBodyToggle.checked = !!profile.feminineBody;
    ui.runtimeBustScaleInput.value = String(num(profile.bustScale, 0));
    ui.runtimeHasDressToggle.checked = !!profile.hasDress;
    ui.runtimeShortDressToggle.checked = !!profile.shortDress;
  }

  function updateReadinessToggleState() {
    ui.strictVisualRulesToggle.checked = !!state.strictVisualRules;
    ui.autoFixVisualToggle.checked = !!state.autoFixVisualIssues;
    ui.autoFixVisualToggle.disabled = !state.strictVisualRules;
  }

  function updateRuntimePreviewLabels() {
    ui.runtimePreviewPoseSelect.value = state.runtimePreview.pose;
    ui.runtimePreviewFacingSelect.value = state.runtimePreview.facing === -1 ? "-1" : "1";
    ui.runtimePreviewScaleInput.value = String(state.runtimePreview.scale);
    ui.runtimePreviewTickInput.value = String(state.runtimePreview.tick);
    ui.runtimePreviewScaleValue.textContent = `${state.runtimePreview.scale.toFixed(2)}x`;
    ui.runtimePreviewTickValue.textContent = state.runtimePreview.tick.toFixed(2);
    ui.runtimePreviewWorldToggle.checked = !!state.runtimePreview.worldContext;
  }

  function renderConstraintReferenceList() {
    const frag = document.createDocumentFragment();
    state.constraintReference.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = `${entry.type === "hard" ? "Hard" : "Visual"}: ${entry.title} - ${entry.guidance}`;
      frag.append(li);
    });
    ui.constraintReferenceList.replaceChildren(frag);
  }

  function createBaseTemplate(templateId) {
    return {
      normal: buildTemplatePoseLayers(templateId, "normal"),
      panic: buildTemplatePoseLayers(templateId, "panic"),
      ko: buildTemplatePoseLayers(templateId, "ko")
    };
  }

  function buildTemplatePoseLayers(templateId, poseId) {
    const palette = templateId === "female_base"
      ? {
          skin: "#f8c9a6",
          hair: "#5b2d16",
          clothMain: "#ef4444",
          clothAlt: "#7c3aed",
          shoe: "#111827"
        }
      : {
          skin: "#e9b289",
          hair: "#2f1f14",
          clothMain: "#2563eb",
          clothAlt: "#0f766e",
          shoe: "#111827"
        };

    if (poseId === "ko") {
      return buildKoPoseLayers(templateId, palette);
    }
    return buildUprightPoseLayers(templateId, poseId, palette);
  }

  function buildUprightPoseLayers(templateId, poseId, palette) {
    const isFemale = templateId === "female_base";
    const scale = GAME_TO_EDITOR_SCALE;
    const bodyW = (isFemale ? 22 : 24) * scale;
    const bodyH = 46 * scale;
    const headW = bodyW * 0.62;
    const headH = bodyH * 0.30;
    const torsoW = bodyW * (isFemale ? 0.8 : 0.86);
    const torsoH = bodyH * 0.44;

    const cx = DESIGN_CENTER_X;
    const baseline = DESIGN_BASELINE_Y;

    const shoulderY = baseline - bodyH * 0.66;
    const handYNormal = baseline - bodyH * 0.34;
    const handYPanic = baseline - bodyH * 0.9;
    const handY = poseId === "panic" ? handYPanic : handYNormal;

    const armSpread = bodyW * (poseId === "panic" ? 0.85 : 0.74);

    const layers = [];

    layers.push(createEllipseLayer("Head", cx - headW / 2, baseline - bodyH - headH * 0.14, headW, headH, {
      fill: palette.skin,
      stroke: "#0f172a",
      strokeWidth: 2
    }));

    if (isFemale) {
      layers.push(createPolygonLayer("Hair", [
        { x: cx - headW * 0.56, y: baseline - bodyH - headH * 0.1 },
        { x: cx + headW * 0.56, y: baseline - bodyH - headH * 0.1 },
        { x: cx + headW * 0.48, y: baseline - bodyH + headH * 0.4 },
        { x: cx - headW * 0.48, y: baseline - bodyH + headH * 0.4 }
      ], {
        fill: palette.hair,
        stroke: "#1f2937",
        strokeWidth: 2
      }));
    } else {
      layers.push(createRectLayer("Hair", cx - headW * 0.5, baseline - bodyH - headH * 0.2, headW, headH * 0.25, {
        fill: palette.hair,
        stroke: "#111827",
        strokeWidth: 1.5
      }));
    }

    layers.push(createRectLayer("Torso", cx - torsoW / 2, baseline - bodyH * 0.68, torsoW, torsoH, {
      fill: palette.clothMain,
      stroke: "#0f172a",
      strokeWidth: 2,
      fillMode: "gradient",
      gradient: {
        type: "linear",
        angle: 95,
        stops: [
          { offset: 0, color: palette.clothMain },
          { offset: 1, color: palette.clothAlt }
        ]
      }
    }));

    if (isFemale) {
      layers.push(createEllipseLayer("Chest", cx - torsoW * 0.18, baseline - bodyH * 0.59, torsoW * 0.36, torsoH * 0.24, {
        fill: palette.clothMain,
        stroke: "#0f172a",
        strokeWidth: 1.2,
        opacity: 0.8
      }));
    }

    layers.push(createLineLayer("Left Arm", cx - torsoW * 0.5, shoulderY, cx - armSpread, handY, {
      fill: "#000000",
      stroke: palette.skin,
      strokeWidth: 9
    }));

    layers.push(createLineLayer("Right Arm", cx + torsoW * 0.5, shoulderY, cx + armSpread, handY, {
      fill: "#000000",
      stroke: palette.skin,
      strokeWidth: 9
    }));

    const hipY = baseline - bodyH * 0.24;
    const legTop = hipY;
    const legH = bodyH * 0.27;
    const legW = bodyW * 0.28;
    const legStance = poseId === "panic" ? bodyW * 0.26 : bodyW * 0.22;

    layers.push(createRectLayer("Left Leg", cx - legStance - legW * 0.9, legTop, legW, legH, {
      fill: palette.skin,
      stroke: "#0f172a",
      strokeWidth: 1.4
    }));

    layers.push(createRectLayer("Right Leg", cx + legStance - legW * 0.1, legTop, legW, legH, {
      fill: palette.skin,
      stroke: "#0f172a",
      strokeWidth: 1.4
    }));

    const shoeW = legW * 1.22;
    const shoeH = bodyH * 0.07;
    layers.push(createRectLayer("Left Shoe", cx - legStance - legW, baseline - shoeH, shoeW, shoeH, {
      fill: palette.shoe,
      stroke: "#0f172a",
      strokeWidth: 1
    }));
    layers.push(createRectLayer("Right Shoe", cx + legStance - legW * 0.2, baseline - shoeH, shoeW, shoeH, {
      fill: palette.shoe,
      stroke: "#0f172a",
      strokeWidth: 1
    }));

    return layers;
  }

  function buildKoPoseLayers(templateId, palette) {
    const isFemale = templateId === "female_base";
    const scale = GAME_TO_EDITOR_SCALE;
    const bodyW = (isFemale ? 22 : 24) * scale;
    const bodyH = 46 * scale;
    const cx = DESIGN_CENTER_X;
    const baseline = DESIGN_BASELINE_Y;

    const torsoL = cx - bodyH * 0.35;
    const torsoY = baseline - bodyW * 0.42;
    const torsoW = bodyH * 0.56;
    const torsoH = bodyW * 0.84;

    const layers = [];

    layers.push(createRectLayer("Torso", torsoL, torsoY, torsoW, torsoH, {
      fill: palette.clothMain,
      stroke: "#0f172a",
      strokeWidth: 2,
      fillMode: "gradient",
      gradient: {
        type: "linear",
        angle: 20,
        stops: [
          { offset: 0, color: palette.clothMain },
          { offset: 1, color: palette.clothAlt }
        ]
      }
    }));

    layers.push(createEllipseLayer("Head", torsoL + torsoW + bodyW * 0.05, baseline - bodyW * 0.58, bodyW * 0.64, bodyW * 0.64, {
      fill: palette.skin,
      stroke: "#0f172a",
      strokeWidth: 2
    }));

    layers.push(createRectLayer("Hair", torsoL + torsoW + bodyW * 0.08, baseline - bodyW * 0.6, bodyW * 0.45, bodyW * 0.18, {
      fill: palette.hair,
      stroke: "#111827",
      strokeWidth: 1
    }));

    layers.push(createLineLayer("Left Arm", torsoL + torsoW * 0.2, torsoY + torsoH * 0.18, torsoL - bodyW * 0.2, torsoY + torsoH * 0.1, {
      fill: "#000000",
      stroke: palette.skin,
      strokeWidth: 8
    }));

    layers.push(createLineLayer("Right Arm", torsoL + torsoW * 0.78, torsoY + torsoH * 0.82, torsoL + torsoW + bodyW * 0.2, torsoY + torsoH * 0.95, {
      fill: "#000000",
      stroke: palette.skin,
      strokeWidth: 8
    }));

    layers.push(createRectLayer("Left Leg", torsoL - bodyW * 0.1, torsoY + torsoH * 0.14, bodyW * 0.38, bodyW * 0.3, {
      fill: palette.skin,
      stroke: "#0f172a",
      strokeWidth: 1.3
    }));

    layers.push(createRectLayer("Right Leg", torsoL - bodyW * 0.1, torsoY + torsoH * 0.56, bodyW * 0.42, bodyW * 0.3, {
      fill: palette.skin,
      stroke: "#0f172a",
      strokeWidth: 1.3
    }));

    layers.push(createRectLayer("Left Shoe", torsoL - bodyW * 0.1, torsoY + torsoH * 0.1, bodyW * 0.35, bodyW * 0.12, {
      fill: palette.shoe,
      stroke: "#111827",
      strokeWidth: 1
    }));

    layers.push(createRectLayer("Right Shoe", torsoL - bodyW * 0.12, torsoY + torsoH * 0.84, bodyW * 0.35, bodyW * 0.12, {
      fill: palette.shoe,
      stroke: "#111827",
      strokeWidth: 1
    }));

    return layers;
  }

  function applySundressHairPresetToAllPoses() {
    let applied = 0;
    POSE_IDS.forEach((poseId) => {
      if (applySundressHairPresetToPose(poseId)) applied += 1;
    });
    return applied;
  }

  function applySundressHairPresetToPose(poseId) {
    if (!POSE_IDS.includes(poseId)) return false;

    const layers = getLayers(poseId);
    if (!layers.length) return false;

    const headIndex = findHeadLayerIndex(layers);
    if (headIndex === -1) {
      setStatus(`No head layer found in ${poseId}; cannot place hair preset.`);
      return false;
    }

    const headLayer = layers[headIndex];
    const headBounds = getLayerBounds(headLayer);
    if (!headBounds) return false;

    const torsoBounds = getPrimaryNamedLayerBounds(layers, "torso");
    const hairColor = pickHairColor(layers);
    const hairStroke = pickHairStroke(layers);
    const preset = buildSundressHairLayers(headBounds, torsoBounds, hairColor, hairStroke);

    const cleaned = layers.filter((layer) => !isHairLayerForSundressReplacement(layer));
    const headIdx = cleaned.findIndex((layer) => layer.id === headLayer.id);
    if (headIdx === -1) return false;

    cleaned.splice(headIdx, 0, ...preset.back);
    const headAfterBack = cleaned.findIndex((layer) => layer.id === headLayer.id);
    cleaned.splice(headAfterBack + 1, 0, ...preset.mid);

    const eyeIdx = findLastEyeLayerIndex(cleaned);
    const frontInsertIdx = eyeIdx !== -1
      ? eyeIdx + 1
      : cleaned.findIndex((layer) => layer.id === headLayer.id) + 1 + preset.mid.length;
    cleaned.splice(frontInsertIdx, 0, ...preset.front);

    state.document.poses[poseId].layers = cleaned;
    if (poseId === state.activePose) {
      setSelection([
        ...preset.back.map((l) => l.id),
        ...preset.mid.map((l) => l.id),
        ...preset.front.map((l) => l.id)
      ]);
    }
    return true;
  }

  function buildSundressHairLayers(headBounds, torsoBounds, hairColor, hairStroke) {
    const p = SUNDRESS_HAIR_PROFILE;
    const cx = headBounds.x + headBounds.w * 0.5;
    const topY = headBounds.y;
    const bottomY = headBounds.y + headBounds.h;

    const hairTop = topY - headBounds.h * p.topLift;
    const shoulderY = torsoBounds
      ? torsoBounds.y + torsoBounds.h * 0.52
      : bottomY + headBounds.h * 0.92;
    const hairBottom = torsoBounds
      ? Math.max(torsoBounds.y + torsoBounds.h * 1.02, bottomY + headBounds.h * 1.84)
      : bottomY + headBounds.h * p.backDrop;

    const hairStyle = {
      fill: hairColor,
      stroke: hairStroke,
      strokeWidth: 1.6
    };

    const back = [
      createPolygonLayer("Sundress Hair Back Curtain", [
        { x: cx - headBounds.w * p.backWidth, y: hairTop + headBounds.h * 0.16 },
        { x: cx - headBounds.w * 0.52, y: hairTop - headBounds.h * 0.68 },
        { x: cx + headBounds.w * 0.52, y: hairTop - headBounds.h * 0.68 },
        { x: cx + headBounds.w * p.backWidth, y: hairTop + headBounds.h * 0.16 },
        { x: cx + headBounds.w * 1.22, y: shoulderY + headBounds.h * 0.62 },
        { x: cx + headBounds.w * 0.9, y: hairBottom },
        { x: cx + headBounds.w * 0.38, y: hairBottom + headBounds.h * 0.22 },
        { x: cx - headBounds.w * 0.38, y: hairBottom + headBounds.h * 0.22 },
        { x: cx - headBounds.w * 0.9, y: hairBottom },
        { x: cx - headBounds.w * 1.22, y: shoulderY + headBounds.h * 0.62 }
      ], hairStyle),
      createPolygonLayer("Sundress Hair Left Outer Lock", [
        { x: cx - headBounds.w * p.sideOutset, y: hairTop + headBounds.h * 0.24 },
        { x: cx - headBounds.w * 1.3, y: shoulderY - headBounds.h * 0.2 },
        { x: cx - headBounds.w * 1.12, y: hairBottom + headBounds.h * 0.1 },
        { x: cx - headBounds.w * 0.76, y: hairBottom + headBounds.h * 0.26 },
        { x: cx - headBounds.w * 0.52, y: shoulderY + headBounds.h * 0.64 },
        { x: cx - headBounds.w * 0.72, y: topY + headBounds.h * 0.2 }
      ], hairStyle),
      createPolygonLayer("Sundress Hair Right Outer Lock", [
        { x: cx + headBounds.w * p.sideOutset, y: hairTop + headBounds.h * 0.24 },
        { x: cx + headBounds.w * 1.3, y: shoulderY - headBounds.h * 0.2 },
        { x: cx + headBounds.w * 1.12, y: hairBottom + headBounds.h * 0.1 },
        { x: cx + headBounds.w * 0.76, y: hairBottom + headBounds.h * 0.26 },
        { x: cx + headBounds.w * 0.52, y: shoulderY + headBounds.h * 0.64 },
        { x: cx + headBounds.w * 0.72, y: topY + headBounds.h * 0.2 }
      ], hairStyle),
      createPolygonLayer("Sundress Hair Left Inner Fill", [
        { x: cx - headBounds.w * 0.58, y: topY + headBounds.h * 0.42 },
        { x: cx - headBounds.w * 0.9, y: shoulderY + headBounds.h * 0.08 },
        { x: cx - headBounds.w * 0.72, y: hairBottom - headBounds.h * 0.06 },
        { x: cx - headBounds.w * 0.34, y: hairBottom + headBounds.h * 0.08 },
        { x: cx - headBounds.w * 0.24, y: shoulderY + headBounds.h * 0.6 }
      ], hairStyle),
      createPolygonLayer("Sundress Hair Right Inner Fill", [
        { x: cx + headBounds.w * 0.58, y: topY + headBounds.h * 0.42 },
        { x: cx + headBounds.w * 0.9, y: shoulderY + headBounds.h * 0.08 },
        { x: cx + headBounds.w * 0.72, y: hairBottom - headBounds.h * 0.06 },
        { x: cx + headBounds.w * 0.34, y: hairBottom + headBounds.h * 0.08 },
        { x: cx + headBounds.w * 0.24, y: shoulderY + headBounds.h * 0.6 }
      ], hairStyle)
    ];

    const mid = [
      createPolygonLayer("Sundress Hair Crown", [
        { x: cx - headBounds.w * 0.94, y: hairTop + headBounds.h * 0.06 },
        { x: cx - headBounds.w * 0.46, y: hairTop - headBounds.h * 0.56 },
        { x: cx, y: hairTop - headBounds.h * 0.44 },
        { x: cx + headBounds.w * 0.46, y: hairTop - headBounds.h * 0.56 },
        { x: cx + headBounds.w * 0.94, y: hairTop + headBounds.h * 0.06 },
        { x: cx + headBounds.w * 0.74, y: topY + headBounds.h * 0.2 },
        { x: cx, y: topY + headBounds.h * 0.02 },
        { x: cx - headBounds.w * 0.74, y: topY + headBounds.h * 0.2 }
      ], hairStyle),
      createPolygonLayer("Sundress Hair Left Temple", [
        { x: cx - headBounds.w * p.templeOutset, y: topY + headBounds.h * 0.08 },
        { x: cx - headBounds.w * 1.08, y: topY + headBounds.h * p.templeDrop },
        { x: cx - headBounds.w * 0.84, y: topY + headBounds.h * 0.86 },
        { x: cx - headBounds.w * 0.66, y: topY + headBounds.h * 0.4 },
        { x: cx - headBounds.w * 0.74, y: topY + headBounds.h * 0.14 }
      ], hairStyle),
      createPolygonLayer("Sundress Hair Right Temple", [
        { x: cx + headBounds.w * p.templeOutset, y: topY + headBounds.h * 0.08 },
        { x: cx + headBounds.w * 1.08, y: topY + headBounds.h * p.templeDrop },
        { x: cx + headBounds.w * 0.84, y: topY + headBounds.h * 0.86 },
        { x: cx + headBounds.w * 0.66, y: topY + headBounds.h * 0.4 },
        { x: cx + headBounds.w * 0.74, y: topY + headBounds.h * 0.14 }
      ], hairStyle),
      createEllipseLayer(
        "Sundress Hair Highlight",
        cx - headBounds.w * 0.22,
        hairTop - headBounds.h * 0.22,
        headBounds.w * 0.44,
        headBounds.h * 0.22,
        { fill: "#ffffff", stroke: "#ffffff", strokeWidth: 0, opacity: 0.14 }
      )
    ];

    const front = [
      createPolygonLayer("Sundress Hair Bangs", [
        { x: cx - headBounds.w, y: topY + headBounds.h * p.bangLift },
        { x: cx - headBounds.w * 0.42, y: topY - headBounds.h * 0.1 },
        { x: cx, y: topY + headBounds.h * 0.02 },
        { x: cx + headBounds.w * 0.42, y: topY - headBounds.h * 0.1 },
        { x: cx + headBounds.w, y: topY + headBounds.h * p.bangLift },
        { x: cx + headBounds.w * 0.72, y: topY + headBounds.h * (1 + p.bangDrop) },
        { x: cx + headBounds.w * 0.24, y: topY + headBounds.h * (1.08 + p.bangDrop * 0.5) },
        { x: cx, y: topY + headBounds.h * (1.12 + p.bangDrop * 0.48) },
        { x: cx - headBounds.w * 0.24, y: topY + headBounds.h * (1.08 + p.bangDrop * 0.5) },
        { x: cx - headBounds.w * 0.72, y: topY + headBounds.h * (1 + p.bangDrop) }
      ], hairStyle),
      createPolygonLayer("Sundress Hair Left Wisp", [
        { x: cx - headBounds.w * 0.74, y: topY + headBounds.h * 1.02 },
        { x: cx - headBounds.w * 0.94, y: topY + headBounds.h * 1.34 },
        { x: cx - headBounds.w * 0.66, y: topY + headBounds.h * 1.88 },
        { x: cx - headBounds.w * 0.46, y: topY + headBounds.h * 1.48 },
        { x: cx - headBounds.w * 0.52, y: topY + headBounds.h * 1.1 }
      ], hairStyle),
      createPolygonLayer("Sundress Hair Right Wisp", [
        { x: cx + headBounds.w * 0.74, y: topY + headBounds.h * 1.02 },
        { x: cx + headBounds.w * 0.94, y: topY + headBounds.h * 1.34 },
        { x: cx + headBounds.w * 0.66, y: topY + headBounds.h * 1.88 },
        { x: cx + headBounds.w * 0.46, y: topY + headBounds.h * 1.48 },
        { x: cx + headBounds.w * 0.52, y: topY + headBounds.h * 1.1 }
      ], hairStyle)
    ];

    return { back, mid, front };
  }

  function findHeadLayerIndex(layers) {
    return layers.findIndex((layer) => /\bhead\b/i.test(layer.name || ""));
  }

  function findLastEyeLayerIndex(layers) {
    let found = -1;
    for (let i = 0; i < layers.length; i++) {
      const name = (layers[i].name || "").toLowerCase();
      if (name.includes("eye") || name.includes("pupil") || name.includes("brow")) found = i;
    }
    return found;
  }

  function getPrimaryNamedLayerBounds(layers, term) {
    const idx = layers.findIndex((layer) => (layer.name || "").toLowerCase().includes(term));
    if (idx === -1) return null;
    return getLayerBounds(layers[idx]);
  }

  function pickHairColor(layers) {
    const layer = [...layers].reverse().find((entry) => {
      const name = (entry.name || "").toLowerCase();
      return (name.includes("hair") || name.includes("bang")) && isColor(entry.style?.fill);
    });
    return layer?.style?.fill || "#DAA520";
  }

  function pickHairStroke(layers) {
    const layer = [...layers].reverse().find((entry) => {
      const name = (entry.name || "").toLowerCase();
      return (name.includes("hair") || name.includes("bang")) && isColor(entry.style?.stroke);
    });
    return layer?.style?.stroke || "#1f2937";
  }

  function isHairLayerForSundressReplacement(layer) {
    const name = (layer.name || "").toLowerCase();
    if (name.startsWith("sundress hair")) return true;
    return name === "hair" || name === "bangs" || name === "front bangs" || name === "hair highlight";
  }

  function createLayerBase(name, type, geometry, style = {}) {
    return {
      id: nextLayerId(),
      name,
      type,
      visible: true,
      locked: false,
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      geometry,
      style: normalizeStyle(style)
    };
  }

  function createRectLayer(name, x, y, w, h, style) {
    return createLayerBase(name, "rect", { x, y, w, h }, style);
  }

  function createEllipseLayer(name, x, y, w, h, style) {
    return createLayerBase(name, "ellipse", { x, y, w, h }, style);
  }

  function createLineLayer(name, x1, y1, x2, y2, style) {
    return createLayerBase(name, "line", { x1, y1, x2, y2 }, style);
  }

  function createCurveLayer(name, x1, y1, cx, cy, x2, y2, style) {
    return createLayerBase(name, "curve", { x1, y1, cx, cy, x2, y2 }, style);
  }

  function createPolygonLayer(name, points, style) {
    return createLayerBase(name, "polygon", { points: points.map(copyPoint), closed: true }, style);
  }

  function normalizeStyle(style) {
    const merged = {
      fill: "#3b82f6",
      stroke: "#0f172a",
      strokeWidth: 2,
      opacity: 1,
      fillMode: "solid",
      gradient: {
        type: "linear",
        angle: 90,
        stops: [
          { offset: 0, color: "#f97316" },
          { offset: 1, color: "#06b6d4" }
        ]
      }
    };

    if (!style || typeof style !== "object") return merged;
    merged.fill = style.fill || merged.fill;
    merged.stroke = style.stroke || merged.stroke;
    merged.strokeWidth = num(style.strokeWidth, merged.strokeWidth);
    merged.opacity = clamp(num(style.opacity, merged.opacity), 0.05, 1);
    merged.fillMode = style.fillMode === "gradient" ? "gradient" : "solid";

    if (style.gradient && typeof style.gradient === "object") {
      merged.gradient = {
        type: "linear",
        angle: num(style.gradient.angle, 90),
        stops: Array.isArray(style.gradient.stops) && style.gradient.stops.length > 1
          ? style.gradient.stops
              .map((s) => ({
                offset: clamp(num(s.offset, 0), 0, 1),
                color: isColor(s.color) ? s.color : "#ffffff"
              }))
              .sort((a, b) => a.offset - b.offset)
          : merged.gradient.stops
      };
    }

    return merged;
  }

  function nextLayerId() {
    const id = `layer_${String(state.layerIdCounter).padStart(4, "0")}`;
    state.layerIdCounter += 1;
    return id;
  }

  function setActivePose(poseId) {
    if (!POSE_IDS.includes(poseId)) return;
    state.activePose = poseId;
    state.selectedIds.clear();
    state.layerListAnchorId = null;
    updatePoseTabs();
    requestRender();
  }

  function setActiveTool(toolId) {
    if (!TOOL_IDS.includes(toolId)) return;
    state.activeTool = toolId;
    if (toolId !== "polygon") {
      state.polygonDraft = null;
    }
    updateToolButtons();
    updateCanvasCursor();
    requestRender();
  }

  function updateToolButtons() {
    ui.toolButtons.forEach((btn) => {
      const active = (btn.dataset.tool || "") === state.activeTool;
      btn.classList.toggle("is-active", active);
    });
  }

  function updatePoseTabs() {
    const issueMaps = collectIssueMaps(state.validation);
    ui.poseTabs.forEach((btn) => {
      const poseId = btn.dataset.pose || "";
      const active = poseId === state.activePose;
      const poseIssues = issueMaps.poseMap[poseId] || { hard: 0, visual: 0 };
      btn.classList.toggle("is-active", active);
      btn.classList.toggle("has-hard-issue", poseIssues.hard > 0);
      btn.classList.toggle("has-visual-issue", poseIssues.visual > 0 && poseIssues.hard === 0);
      if (poseIssues.hard > 0 || poseIssues.visual > 0) {
        btn.title = `${poseId}: ${poseIssues.hard} hard, ${poseIssues.visual} warning`;
      } else {
        btn.title = poseId;
      }
    });
  }

  function updateCanvasCursor() {
    const map = {
      select: "default",
      move: "move",
      rect: "crosshair",
      ellipse: "crosshair",
      line: "crosshair",
      curve: "crosshair",
      polygon: "crosshair",
      color: "copy",
      gradient: "copy",
      eyedropper: "cell",
      hand: "grab"
    };
    ui.editorCanvas.style.cursor = map[state.activeTool] || "default";
  }

  function onCanvasWheel(e) {
    e.preventDefault();

    const canvasPt = eventToCanvas(e);
    if (e.ctrlKey || e.metaKey || state.activeTool === "hand") {
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      setZoom(state.view.zoom * factor, { anchorCanvas: canvasPt });
      return;
    }

    state.view.panX -= e.deltaX;
    state.view.panY -= e.deltaY;
    persistEditorView();
    requestRender();
  }

  function setZoom(zoomValue, opts = {}) {
    const nextZoom = clamp(zoomValue, 0.25, 4);
    const anchorCanvas = opts.anchorCanvas || { x: DESIGN_CANVAS_WIDTH / 2, y: DESIGN_CANVAS_HEIGHT / 2 };
    const beforeWorld = canvasToWorld(anchorCanvas);

    state.view.zoom = nextZoom;

    const afterCanvasX = beforeWorld.x * state.view.zoom + state.view.panX;
    const afterCanvasY = beforeWorld.y * state.view.zoom + state.view.panY;
    state.view.panX += anchorCanvas.x - afterCanvasX;
    state.view.panY += anchorCanvas.y - afterCanvasY;

    persistEditorView();
    updateZoomUI();
    requestRender();
  }

  function adjustZoom(multiplier) {
    setZoom(state.view.zoom * multiplier, { anchorCanvas: { x: DESIGN_CANVAS_WIDTH / 2, y: DESIGN_CANVAS_HEIGHT / 2 } });
  }

  function fitToModel() {
    const layers = getLayers();
    if (!layers.length) {
      state.view.zoom = 1;
      state.view.panX = 0;
      state.view.panY = 0;
      persistEditorView();
      updateZoomUI();
      requestRender();
      return;
    }

    const bounds = getLayersBounds(layers.filter((l) => l.visible));
    if (!bounds) return;

    const margin = 80;
    const availableW = DESIGN_CANVAS_WIDTH - margin * 2;
    const availableH = DESIGN_CANVAS_HEIGHT - margin * 2;
    const targetZoom = clamp(Math.min(availableW / Math.max(bounds.w, 1), availableH / Math.max(bounds.h, 1)), 0.25, 4);

    state.view.zoom = targetZoom;
    state.view.panX = DESIGN_CANVAS_WIDTH * 0.5 - (bounds.x + bounds.w * 0.5) * targetZoom;
    state.view.panY = DESIGN_CANVAS_HEIGHT * 0.5 - (bounds.y + bounds.h * 0.5) * targetZoom;

    persistEditorView();
    updateZoomUI();
    requestRender();
  }

  function updateZoomUI() {
    ui.zoomRange.value = String(state.view.zoom);
    ui.zoomValue.textContent = `${Math.round(state.view.zoom * 100)}%`;
  }

  function persistEditorView() {
    ensureDocument();
    state.document.editor.zoom = state.view.zoom;
    state.document.editor.panX = state.view.panX;
    state.document.editor.panY = state.view.panY;
    state.document.editor.facing = state.view.facing;
    stampUpdatedAt();
  }

  function onCanvasPointerDown(e) {
    if (e.button !== 0) return;

    const canvasPt = eventToCanvas(e);
    const worldPt = canvasToWorld(canvasPt);
    const additive = isAdditiveSelect(e);

    ui.editorCanvas.setPointerCapture(e.pointerId);

    if (state.activeTool === "hand") {
      state.interaction = {
        kind: "pan",
        startCanvas: canvasPt,
        startPanX: state.view.panX,
        startPanY: state.view.panY
      };
      ui.editorCanvas.style.cursor = "grabbing";
      return;
    }

    if (state.activeTool === "polygon") {
      handlePolygonPointerDown(worldPt, e);
      requestRender();
      return;
    }

    const resizeHit = (state.activeTool === "select" || state.activeTool === "move") ? getResizeHandleHit(worldPt) : null;
    if (resizeHit) {
      beginResizeInteraction(resizeHit, worldPt, e.shiftKey);
      requestRender();
      return;
    }

    const pointHandleHit = state.activeTool === "select" ? getPointHandleHit(worldPt) : null;
    if (pointHandleHit) {
      beginReshapeInteraction(pointHandleHit, worldPt);
      requestRender();
      return;
    }

    const hitLayer = hitTestLayers(worldPt, {
      includeLocked: state.activeTool === "eyedropper"
    });

    if (["rect", "ellipse", "line", "curve"].includes(state.activeTool)) {
      beginDrawInteraction(state.activeTool, worldPt, e.shiftKey);
      requestRender();
      return;
    }

    if (state.activeTool === "color") {
      if (hitLayer && !hitLayer.locked) {
        setSelection([hitLayer.id]);
        applyColorToLayers([hitLayer]);
      } else if (!additive) {
        clearSelection();
      }
      requestRender();
      return;
    }

    if (state.activeTool === "gradient") {
      if (hitLayer && !hitLayer.locked) {
        setSelection([hitLayer.id]);
        applyGradientToLayers([hitLayer]);
      } else if (!additive) {
        clearSelection();
      }
      requestRender();
      return;
    }

    if (state.activeTool === "eyedropper") {
      if (hitLayer) {
        sampleStyleFromLayer(hitLayer);
        setStatus(`Sampled style from ${hitLayer.name}.`);
      }
      requestRender();
      return;
    }

    if (hitLayer && !hitLayer.locked) {
      if (additive) {
        if (state.selectedIds.has(hitLayer.id)) {
          state.selectedIds.delete(hitLayer.id);
        } else {
          state.selectedIds.add(hitLayer.id);
          state.layerListAnchorId = hitLayer.id;
        }
      } else if (!state.selectedIds.has(hitLayer.id)) {
        setSelection([hitLayer.id]);
      }

      const selectedLayers = getSelectedLayers();
      if (selectedLayers.length) {
        state.interaction = {
          kind: "move",
          startWorld: worldPt,
          snapshot: selectedLayers.map((l) => ({ id: l.id, geometry: cloneGeometry(l.geometry) }))
        };
      }
    } else if (!additive) {
      clearSelection();
    }

    requestRender();
  }

  function onCanvasPointerMove(e) {
    const canvasPt = eventToCanvas(e);
    const worldPt = canvasToWorld(canvasPt);

    if (!state.interaction) {
      if (state.activeTool === "polygon" && state.polygonDraft) {
        state.polygonDraft.hoverPoint = worldPt;
        requestRender();
      }
      return;
    }

    if (state.interaction.kind === "pan") {
      const dx = canvasPt.x - state.interaction.startCanvas.x;
      const dy = canvasPt.y - state.interaction.startCanvas.y;
      state.view.panX = state.interaction.startPanX + dx;
      state.view.panY = state.interaction.startPanY + dy;
      persistEditorView();
      requestRender();
      return;
    }

    if (state.interaction.kind === "move") {
      const dx = worldPt.x - state.interaction.startWorld.x;
      const dy = worldPt.y - state.interaction.startWorld.y;
      applyMoveFromSnapshot(state.interaction.snapshot, dx, dy);
      stampUpdatedAt();
      requestRender();
      return;
    }

    if (state.interaction.kind === "resize") {
      updateResizeInteraction(worldPt, e.shiftKey);
      stampUpdatedAt();
      requestRender();
      return;
    }

    if (state.interaction.kind === "reshape") {
      updateReshapeInteraction(worldPt);
      stampUpdatedAt();
      requestRender();
      return;
    }

    if (state.interaction.kind === "draw") {
      updateDrawInteraction(worldPt, e.shiftKey);
      requestRender();
      return;
    }
  }

  function onCanvasPointerUp(e) {
    if (state.activeTool === "hand") {
      ui.editorCanvas.style.cursor = state.activeTool === "hand" ? "grab" : "default";
    }

    if (!state.interaction) return;

    if (state.interaction.kind === "draw") {
      finalizeDrawInteraction();
    }

    state.interaction = null;
    requestRender();

    try {
      ui.editorCanvas.releasePointerCapture(e.pointerId);
    } catch (_) {
      // no-op
    }
  }

  function beginDrawInteraction(drawType, worldPt, keepAspect) {
    const layer = createLayer(drawType, worldPt, worldPt);
    state.interaction = {
      kind: "draw",
      drawType,
      startWorld: worldPt,
      keepAspect,
      draftLayer: layer
    };
  }

  function updateDrawInteraction(worldPt, keepAspect) {
    const it = state.interaction;
    if (!it || it.kind !== "draw" || !it.draftLayer) return;
    it.keepAspect = keepAspect;
    updateLayerGeometryFromDrag(it.draftLayer, it.startWorld, worldPt, keepAspect);
  }

  function finalizeDrawInteraction() {
    const it = state.interaction;
    if (!it || it.kind !== "draw" || !it.draftLayer) return;

    const layer = it.draftLayer;
    if (!isLayerLargeEnough(layer)) {
      setStatus("Shape was too small and was discarded.");
      return;
    }

    getLayers().push(layer);
    setSelection([layer.id]);
    stampUpdatedAt();
    setStatus(`${layer.type.toUpperCase()} layer added.`);
  }

  function createLayer(drawType, start, end) {
    const style = {
      fill: state.styleDraft.fill,
      stroke: state.styleDraft.stroke,
      strokeWidth: state.styleDraft.strokeWidth,
      opacity: state.styleDraft.opacity,
      fillMode: "solid",
      gradient: {
        type: "linear",
        angle: state.styleDraft.gradientAngle,
        stops: [
          { offset: 0, color: state.styleDraft.gradientStart },
          { offset: 1, color: state.styleDraft.gradientEnd }
        ]
      }
    };

    switch (drawType) {
      case "rect":
        return createRectLayer("Rectangle", start.x, start.y, 1, 1, style);
      case "ellipse":
        return createEllipseLayer("Ellipse", start.x, start.y, 1, 1, style);
      case "line":
        return createLineLayer("Line", start.x, start.y, end.x, end.y, style);
      case "curve": {
        const cx = (start.x + end.x) * 0.5;
        const cy = (start.y + end.y) * 0.5 - 20;
        return createCurveLayer("Curve", start.x, start.y, cx, cy, end.x, end.y, style);
      }
      default:
        return createRectLayer("Rectangle", start.x, start.y, 1, 1, style);
    }
  }

  function updateLayerGeometryFromDrag(layer, start, current, keepAspect) {
    if (!layer) return;

    if (layer.type === "rect" || layer.type === "ellipse") {
      let dx = current.x - start.x;
      let dy = current.y - start.y;
      if (keepAspect) {
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        dx = (dx || 1) < 0 ? -size : size;
        dy = (dy || 1) < 0 ? -size : size;
      }
      const x = Math.min(start.x, start.x + dx);
      const y = Math.min(start.y, start.y + dy);
      layer.geometry.x = x;
      layer.geometry.y = y;
      layer.geometry.w = Math.abs(dx);
      layer.geometry.h = Math.abs(dy);
      return;
    }

    if (layer.type === "line") {
      layer.geometry.x2 = current.x;
      layer.geometry.y2 = current.y;
      return;
    }

    if (layer.type === "curve") {
      layer.geometry.x2 = current.x;
      layer.geometry.y2 = current.y;
      layer.geometry.cx = (start.x + current.x) * 0.5;
      layer.geometry.cy = (start.y + current.y) * 0.5 - Math.max(20, Math.abs(current.y - start.y) * 0.3);
    }
  }

  function isLayerLargeEnough(layer) {
    const bounds = getLayerBounds(layer);
    if (!bounds) return false;
    return bounds.w >= 2 || bounds.h >= 2;
  }

  function handlePolygonPointerDown(worldPt, e) {
    const closeThreshold = 9 / state.view.zoom;
    if (!state.polygonDraft) {
      state.polygonDraft = {
        points: [copyPoint(worldPt)],
        hoverPoint: copyPoint(worldPt)
      };
      setStatus("Polygon started. Click to add points, Enter to finish.");
      return;
    }

    const draft = state.polygonDraft;
    if (draft.points.length >= 3 && distance(draft.points[0], worldPt) <= closeThreshold) {
      finalizePolygonDraft();
      return;
    }

    if (e.detail >= 2 && draft.points.length >= 2) {
      draft.points.push(copyPoint(worldPt));
      finalizePolygonDraft();
      return;
    }

    draft.points.push(copyPoint(worldPt));
  }

  function finalizePolygonDraft() {
    const draft = state.polygonDraft;
    if (!draft) return;

    if (draft.points.length < 3) {
      state.polygonDraft = null;
      setStatus("Polygon canceled (need at least 3 points).");
      return;
    }

    const layer = createPolygonLayer("Polygon", draft.points, {
      fill: state.styleDraft.fill,
      stroke: state.styleDraft.stroke,
      strokeWidth: state.styleDraft.strokeWidth,
      opacity: state.styleDraft.opacity,
      fillMode: "solid",
      gradient: {
        type: "linear",
        angle: state.styleDraft.gradientAngle,
        stops: [
          { offset: 0, color: state.styleDraft.gradientStart },
          { offset: 1, color: state.styleDraft.gradientEnd }
        ]
      }
    });

    getLayers().push(layer);
    setSelection([layer.id]);
    state.polygonDraft = null;
    stampUpdatedAt();
    setStatus("Polygon layer added.");
  }

  function beginResizeInteraction(resizeHit, worldPt, keepAspect) {
    const selectedLayers = getSelectedLayers();
    if (!selectedLayers.length) return;

    state.interaction = {
      kind: "resize",
      handle: resizeHit.handle,
      startWorld: worldPt,
      startBounds: resizeHit.bounds,
      keepAspect,
      snapshot: selectedLayers.map((layer) => ({ id: layer.id, geometry: cloneGeometry(layer.geometry) }))
    };
  }

  function updateResizeInteraction(worldPt, keepAspect) {
    const it = state.interaction;
    if (!it || it.kind !== "resize") return;
    it.keepAspect = keepAspect;

    const b = it.startBounds;
    const corner = getCornerPoint(b, it.handle);
    const anchor = getCornerPoint(b, oppositeCorner(it.handle));

    let sx = safeDiv(worldPt.x - anchor.x, corner.x - anchor.x, 1);
    let sy = safeDiv(worldPt.y - anchor.y, corner.y - anchor.y, 1);

    if (keepAspect) {
      const s = Math.abs(sx) > Math.abs(sy) ? sx : sy;
      sx = s;
      sy = s;
    }

    applyResizeFromSnapshot(it.snapshot, anchor, sx, sy);
  }

  function applyResizeFromSnapshot(snapshot, anchor, sx, sy) {
    const layers = getLayers();
    const byId = new Map(layers.map((layer) => [layer.id, layer]));
    snapshot.forEach((entry) => {
      const layer = byId.get(entry.id);
      if (!layer || layer.locked) return;
      scaleLayerGeometryFromSnapshot(layer, entry.geometry, anchor, sx, sy);
    });
  }

  function beginReshapeInteraction(hit, worldPt) {
    const layer = findLayerById(hit.layerId);
    if (!layer || layer.locked) return;

    state.interaction = {
      kind: "reshape",
      layerId: hit.layerId,
      pointHandle: hit.handle,
      startWorld: worldPt,
      snapshot: cloneGeometry(layer.geometry)
    };
  }

  function updateReshapeInteraction(worldPt) {
    const it = state.interaction;
    if (!it || it.kind !== "reshape") return;

    const layer = findLayerById(it.layerId);
    if (!layer || layer.locked) return;

    layer.geometry = cloneGeometry(it.snapshot);
    applyPointHandleToGeometry(layer.geometry, layer.type, it.pointHandle, worldPt);
  }

  function applyMoveFromSnapshot(snapshot, dx, dy) {
    const layers = getLayers();
    const byId = new Map(layers.map((layer) => [layer.id, layer]));
    snapshot.forEach((entry) => {
      const layer = byId.get(entry.id);
      if (!layer || layer.locked) return;
      translateGeometryFromSnapshot(layer.geometry, entry.geometry, dx, dy);
    });
  }

  function onWindowKeyDown(e) {
    if (isEditableTarget(e.target)) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
      e.preventDefault();
      duplicateSelectedLayers();
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteSelectedLayers();
      return;
    }

    if (e.key === "Escape") {
      if (state.polygonDraft) {
        state.polygonDraft = null;
        setStatus("Polygon draft canceled.");
      }
      state.interaction = null;
      requestRender();
      return;
    }

    if (e.key === "Enter" && state.activeTool === "polygon" && state.polygonDraft) {
      e.preventDefault();
      finalizePolygonDraft();
      requestRender();
      return;
    }

    if (state.activeTool === "polygon" && state.polygonDraft && (e.key === "Backspace" || e.key === "Delete")) {
      state.polygonDraft.points.pop();
      requestRender();
    }
  }

  function onLayerListClick(e) {
    const row = e.target.closest(".layer-item");
    if (!row) return;

    const layerId = row.dataset.layerId;
    const layer = findLayerById(layerId);
    if (!layer) return;

    if (e.target.matches(".layer-visible")) {
      layer.visible = e.target.checked;
      stampUpdatedAt();
      requestRender();
      return;
    }

    if (e.target.matches(".layer-lock")) {
      layer.locked = !layer.locked;
      stampUpdatedAt();
      requestRender();
      return;
    }

    const additive = isAdditiveSelect(e);
    const rangeSelect = e.shiftKey && !additive;

    if (rangeSelect && state.layerListAnchorId) {
      const order = getLayerListDisplayOrder();
      const a = order.indexOf(state.layerListAnchorId);
      const b = order.indexOf(layerId);
      if (a !== -1 && b !== -1) {
        const [start, end] = a < b ? [a, b] : [b, a];
        const ids = order.slice(start, end + 1);
        setSelection(ids);
      } else {
        setSelection([layerId]);
      }
    } else if (additive) {
      if (state.selectedIds.has(layerId)) state.selectedIds.delete(layerId);
      else state.selectedIds.add(layerId);
      state.layerListAnchorId = layerId;
    } else {
      setSelection([layerId]);
    }

    requestRender();
  }

  function onLayerListDoubleClick(e) {
    const row = e.target.closest(".layer-item");
    if (!row) return;

    const layer = findLayerById(row.dataset.layerId);
    if (!layer) return;

    const nextName = window.prompt("Rename layer", layer.name);
    if (!nextName) return;
    layer.name = nextName.trim() || layer.name;
    stampUpdatedAt();
    requestRender();
  }

  function copyPoseToPose(fromPoseId, toPoseId) {
    if (!POSE_IDS.includes(fromPoseId) || !POSE_IDS.includes(toPoseId)) return;
    if (fromPoseId === toPoseId) {
      setStatus("Select a different destination pose.");
      return;
    }

    const srcLayers = getLayers(fromPoseId).map(cloneLayer);
    state.document.poses[toPoseId].layers = srcLayers;
    stampUpdatedAt();
    setStatus(`Copied ${fromPoseId} pose to ${toPoseId}.`);

    if (state.activePose === toPoseId) {
      state.selectedIds.clear();
    }

    requestRender();
  }

  function resetPoseToTemplate(templateId, poseId) {
    if (!POSE_IDS.includes(poseId)) return;
    const fresh = createBaseTemplate(templateId);
    state.document.poses[poseId].layers = fresh[poseId].map(cloneLayer);
    state.document.meta.baseTemplate = templateId;
    stampUpdatedAt();

    if (state.activePose === poseId) {
      state.selectedIds.clear();
      state.layerListAnchorId = null;
    }

    setStatus(`${poseId} reset to ${templateId}.`);
    requestRender();
  }

  function resetAllPosesToTemplate(templateId) {
    const fresh = createBaseTemplate(templateId);
    POSE_IDS.forEach((poseId) => {
      state.document.poses[poseId].layers = fresh[poseId].map(cloneLayer);
    });
    state.document.meta.baseTemplate = templateId;
    state.selectedIds.clear();
    state.layerListAnchorId = null;
    stampUpdatedAt();
    setStatus(`All poses reset to ${templateId}.`);
    requestRender();
  }

  function duplicateSelectedLayers() {
    const layers = getLayers();
    if (!layers.length || !state.selectedIds.size) return;

    const clones = [];
    const out = [];

    layers.forEach((layer) => {
      out.push(layer);
      if (state.selectedIds.has(layer.id)) {
        const cp = cloneLayer(layer);
        cp.id = nextLayerId();
        cp.name = `${layer.name} Copy`;
        clones.push(cp.id);
        out.push(cp);
      }
    });

    state.document.poses[state.activePose].layers = out;
    setSelection(clones);
    stampUpdatedAt();
    setStatus(`${clones.length} layer(s) duplicated.`);
    requestRender();
  }

  function deleteSelectedLayers() {
    if (!state.selectedIds.size) return;

    const layers = getLayers();
    const before = layers.length;
    state.document.poses[state.activePose].layers = layers.filter((layer) => !state.selectedIds.has(layer.id));
    const removed = before - getLayers().length;

    state.selectedIds.clear();
    state.layerListAnchorId = null;
    stampUpdatedAt();
    setStatus(`${removed} layer(s) deleted.`);
    requestRender();
  }

  function reorderSelectedLayers(direction) {
    const layers = getLayers();
    if (layers.length < 2 || !state.selectedIds.size) return;

    if (direction === "up") {
      for (let i = layers.length - 2; i >= 0; i--) {
        const current = layers[i];
        const next = layers[i + 1];
        if (state.selectedIds.has(current.id) && !state.selectedIds.has(next.id)) {
          layers[i] = next;
          layers[i + 1] = current;
        }
      }
    } else {
      for (let i = 1; i < layers.length; i++) {
        const prev = layers[i - 1];
        const current = layers[i];
        if (state.selectedIds.has(current.id) && !state.selectedIds.has(prev.id)) {
          layers[i - 1] = current;
          layers[i] = prev;
        }
      }
    }

    stampUpdatedAt();
    requestRender();
  }

  function applySolidStyleToSelection() {
    const selected = getSelectedLayers();
    if (!selected.length) {
      setStatus("Select at least one layer first.");
      return;
    }

    applyColorToLayers(selected);
    setStatus(`Applied solid style to ${selected.length} layer(s).`);
    stampUpdatedAt();
    requestRender();
  }

  function applyColorToLayers(layers) {
    layers.forEach((layer) => {
      layer.style.fill = state.styleDraft.fill;
      layer.style.stroke = state.styleDraft.stroke;
      layer.style.strokeWidth = state.styleDraft.strokeWidth;
      layer.style.opacity = state.styleDraft.opacity;
      layer.style.fillMode = "solid";
    });
  }

  function applyGradientToSelection(gradientConfig) {
    const selected = getSelectedLayers();
    if (!selected.length) {
      setStatus("Select at least one layer first.");
      return;
    }
    applyGradientToLayers(selected, gradientConfig);
    stampUpdatedAt();
    setStatus(`Applied gradient to ${selected.length} layer(s).`);
    requestRender();
  }

  function applyGradientToLayers(layers, gradientConfig) {
    const gradient = {
      type: "linear",
      angle: num(gradientConfig.angle, state.styleDraft.gradientAngle),
      stops: Array.isArray(gradientConfig.stops)
        ? gradientConfig.stops.map((stop) => ({
            offset: clamp(num(stop.offset, 0), 0, 1),
            color: isColor(stop.color) ? stop.color : "#ffffff"
          })).sort((a, b) => a.offset - b.offset)
        : [
            { offset: 0, color: state.styleDraft.gradientStart },
            { offset: 1, color: state.styleDraft.gradientEnd }
          ]
    };

    layers.forEach((layer) => {
      layer.style.fillMode = "gradient";
      layer.style.gradient = deepClone(gradient);
      layer.style.stroke = state.styleDraft.stroke;
      layer.style.strokeWidth = state.styleDraft.strokeWidth;
      layer.style.opacity = state.styleDraft.opacity;
    });
  }

  function sampleStyleFromLayer(layer) {
    if (!layer) return;

    const style = layer.style || {};
    state.styleDraft.fill = isColor(style.fill) ? style.fill : state.styleDraft.fill;
    state.styleDraft.stroke = isColor(style.stroke) ? style.stroke : state.styleDraft.stroke;
    state.styleDraft.strokeWidth = num(style.strokeWidth, state.styleDraft.strokeWidth);
    state.styleDraft.opacity = clamp(num(style.opacity, state.styleDraft.opacity), 0.05, 1);

    if (style.fillMode === "gradient" && style.gradient && Array.isArray(style.gradient.stops) && style.gradient.stops.length >= 2) {
      state.styleDraft.gradientStart = style.gradient.stops[0].color;
      state.styleDraft.gradientEnd = style.gradient.stops[style.gradient.stops.length - 1].color;
      state.styleDraft.gradientAngle = num(style.gradient.angle, state.styleDraft.gradientAngle);
    }

    syncStyleInputs();
  }

  function syncStyleInputs() {
    ui.fillColorInput.value = state.styleDraft.fill;
    ui.strokeColorInput.value = state.styleDraft.stroke;
    ui.strokeWidthInput.value = String(state.styleDraft.strokeWidth);
    ui.opacityInput.value = String(state.styleDraft.opacity);
    ui.strokeWidthValue.textContent = String(state.styleDraft.strokeWidth);
    ui.opacityValue.textContent = state.styleDraft.opacity.toFixed(2);
    ui.gradStartInput.value = state.styleDraft.gradientStart;
    ui.gradEndInput.value = state.styleDraft.gradientEnd;
    ui.gradAngleInput.value = String(state.styleDraft.gradientAngle);
    ui.gradAngleValue.textContent = `${Math.round(state.styleDraft.gradientAngle)}°`;
  }

  function withSelectedLayers(fn) {
    const selected = getSelectedLayers();
    if (!selected.length) {
      setStatus("Select at least one layer first.");
      return;
    }
    selected.forEach((layer) => fn(layer));
    stampUpdatedAt();
    requestRender();
  }

  function setSelection(ids) {
    state.selectedIds.clear();
    ids.forEach((id) => state.selectedIds.add(id));
    state.layerListAnchorId = ids.length ? ids[ids.length - 1] : null;
  }

  function clearSelection() {
    state.selectedIds.clear();
    state.layerListAnchorId = null;
  }

  function getLayers(poseId = state.activePose) {
    ensureDocument();
    const pose = state.document.poses[poseId];
    if (!pose) return [];
    if (!Array.isArray(pose.layers)) pose.layers = [];
    return pose.layers;
  }

  function findLayerById(layerId, poseId = state.activePose) {
    return getLayers(poseId).find((layer) => layer.id === layerId) || null;
  }

  function getSelectedLayers() {
    const ids = state.selectedIds;
    return getLayers().filter((layer) => ids.has(layer.id));
  }

  function getLayerListDisplayOrder() {
    return getLayers().map((layer) => layer.id).reverse();
  }

  function requestRender() {
    state.renderDirty = true;
    if (state.rafId) return;
    state.rafId = requestAnimationFrame(() => {
      state.rafId = 0;
      if (!state.renderDirty) return;
      state.renderDirty = false;
      renderAll();
    });
  }

  function renderAll() {
    const validation = runDesignerValidation({
      applyAutoFix: state.skipAutoFixOnce ? false : true
    });
    state.skipAutoFixOnce = false;

    renderEditorCanvas();
    renderLayerList();
    renderSelectionInfo();
    renderPosePreviews();
    renderDesignReadiness(validation);
    renderInlineIssues(validation);
    renderRuntimePreview(validation);
    updatePoseTabs();
  }

  function runDesignerValidation(opts = {}) {
    ensureDocument();
    ensureRuntimeProfile();

    if (!CONSTRAINTS || typeof CONSTRAINTS.validateDesignerDocument !== "function") {
      state.validation = {
        hardFailures: [{
          kind: "hard",
          target: "field:runtime-base-type",
          message: "Constraint engine unavailable. Cannot verify runtime safety."
        }],
        visualWarnings: [],
        autoFixes: [],
        canExport: false,
        summary: {
          hardFailureCount: 1,
          visualWarningCount: 0,
          autoFixCount: 0,
          strictVisualRules: state.strictVisualRules,
          autoFixVisualIssues: state.autoFixVisualIssues
        },
        metadata: {
          strictVisualRules: state.strictVisualRules,
          autoFixVisualIssues: state.autoFixVisualIssues,
          overrideEnabled: !state.strictVisualRules
        }
      };
      return state.validation;
    }

    const validation = CONSTRAINTS.validateDesignerDocument(state.document, {
      strictVisualRules: state.strictVisualRules,
      autoFixVisualIssues: state.autoFixVisualIssues,
      applyAutoFix: opts.applyAutoFix !== false
    });

    const normalizedProfile = normalizeRuntimeProfile(
      validation?.resolvedDocument?.runtimeProfile || state.document.runtimeProfile,
      state.document.meta.baseTemplate
    );
    const beforeProfile = JSON.stringify(state.document.runtimeProfile || {});
    const afterProfile = JSON.stringify(normalizedProfile || {});
    if (beforeProfile !== afterProfile) {
      state.document.runtimeProfile = normalizedProfile;
      if (!opts.silent) stampUpdatedAt();
      syncRuntimeProfileInputs();
    }

    state.validation = validation;
    return validation;
  }

  function collectIssueMaps(validation) {
    const poseMap = Object.create(null);
    const layerMap = Object.create(null);
    const fieldMap = Object.create(null);

    const all = [...(validation?.hardFailures || []), ...(validation?.visualWarnings || [])];
    all.forEach((entry) => {
      const target = entry?.target || "";
      const severity = entry?.kind === "hard" ? "hard" : "visual";
      if (target.startsWith("pose:")) {
        const poseId = target.slice("pose:".length);
        if (!poseMap[poseId]) poseMap[poseId] = { hard: 0, visual: 0 };
        poseMap[poseId][severity] += 1;
      } else if (target.startsWith("layer:")) {
        const parts = target.split(":");
        const poseId = parts[1] || state.activePose;
        const layerId = parts[2] || "";
        const key = `${poseId}:${layerId}`;
        if (!layerMap[key]) layerMap[key] = { hard: 0, visual: 0 };
        layerMap[key][severity] += 1;
      } else if (target.startsWith("field:")) {
        if (!fieldMap[target]) fieldMap[target] = { hard: [], visual: [] };
        fieldMap[target][severity].push(entry.message);
      }
    });

    return { poseMap, layerMap, fieldMap };
  }

  function renderDesignReadiness(validation) {
    const hard = validation?.hardFailures || [];
    const visual = validation?.visualWarnings || [];

    ui.exportCompactBtn.disabled = hard.length > 0;
    ui.copyCompactBtn.disabled = hard.length > 0;

    if (hard.length) {
      ui.readinessSummary.textContent = `Blocked: ${hard.length} hard safety issue(s) must be fixed before compact export.`;
      ui.readinessSummary.classList.add("is-hard");
    } else if (visual.length && !state.strictVisualRules) {
      ui.readinessSummary.textContent = `Export ready with ${visual.length} visual warning(s). Override mode is active.`;
      ui.readinessSummary.classList.remove("is-hard");
    } else if (visual.length) {
      ui.readinessSummary.textContent = `Export ready. ${visual.length} visual warning(s) detected.`;
      ui.readinessSummary.classList.remove("is-hard");
    } else {
      ui.readinessSummary.textContent = "Export ready. No blockers or warnings.";
      ui.readinessSummary.classList.remove("is-hard");
    }

    ui.readinessMeta.textContent = `Strict visual rules: ${state.strictVisualRules ? "ON" : "OFF"} | Auto-fix: ${state.autoFixVisualIssues ? "ON" : "OFF"} | Auto-fixes applied: ${(validation?.autoFixes || []).length}`;
    renderIssueList(ui.hardBlockerList, hard, "hard");
    renderIssueList(ui.warningList, visual, "warn");
  }

  function renderIssueList(listEl, issues, className) {
    listEl.classList.remove("hard", "warn");
    listEl.classList.add(className);
    const frag = document.createDocumentFragment();
    if (!issues.length) {
      const li = document.createElement("li");
      li.textContent = className === "hard" ? "No hard blockers." : "No warnings.";
      frag.append(li);
      listEl.replaceChildren(frag);
      return;
    }
    issues.forEach((entry) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.target = entry.target || "";
      button.textContent = entry.message || "Issue";
      li.append(button);
      frag.append(li);
    });
    listEl.replaceChildren(frag);
  }

  function renderInlineIssues(validation) {
    const issueMaps = collectIssueMaps(validation);
    Object.entries(ui.issueFieldMap).forEach(([target, el]) => {
      if (!el) return;
      const bucket = issueMaps.fieldMap[target];
      const hardMsg = bucket?.hard?.[0] || "";
      const warnMsg = bucket?.visual?.[0] || "";
      el.classList.remove("is-warning");
      if (hardMsg) {
        el.textContent = hardMsg;
        el.dataset.target = target;
      } else if (warnMsg) {
        el.textContent = warnMsg;
        el.dataset.target = target;
        el.classList.add("is-warning");
      } else {
        el.textContent = "";
        el.dataset.target = "";
      }
    });
  }

  function renderEditorCanvas() {
    const ctx = ui.editorCtx;
    const w = DESIGN_CANVAS_WIDTH;
    const h = DESIGN_CANVAS_HEIGHT;

    ctx.clearRect(0, 0, w, h);

    drawEditorBackground(ctx, w, h);

    ctx.save();
    ctx.translate(state.view.panX, state.view.panY);
    ctx.scale(state.view.zoom, state.view.zoom);

    if (state.document.editor.showGrid) drawGrid(ctx);
    drawBaseline(ctx);
    if (state.document.editor.showHeightLines) renderHeightReferences(ctx);

    const layers = getLayers();
    layers.forEach((layer) => drawLayer(ctx, layer));

    if (state.polygonDraft) drawPolygonDraft(ctx);

    renderSelectionOverlays(ctx);
    ctx.restore();

    ui.canvasStatus.textContent = buildCanvasStatusText();
  }

  function drawEditorBackground(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0a1626");
    g.addColorStop(1, "#0b1b2d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#06b6d4";
    ctx.beginPath();
    ctx.ellipse(w * 0.22, h * 0.12, 180, 84, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.ellipse(w * 0.82, h * 0.14, 200, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawGrid(ctx) {
    const step = 20;
    const w = DESIGN_CANVAS_WIDTH;
    const h = DESIGN_CANVAS_HEIGHT;

    ctx.strokeStyle = "rgba(148,163,184,0.13)";
    ctx.lineWidth = 1 / state.view.zoom;

    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(148,163,184,0.28)";
    ctx.beginPath();
    ctx.moveTo(DESIGN_CENTER_X, 0);
    ctx.lineTo(DESIGN_CENTER_X, h);
    ctx.stroke();
  }

  function drawBaseline(ctx) {
    ctx.strokeStyle = "rgba(249,115,22,0.9)";
    ctx.lineWidth = 2 / state.view.zoom;
    ctx.beginPath();
    ctx.moveTo(0, DESIGN_BASELINE_Y + 0.5);
    ctx.lineTo(DESIGN_CANVAS_WIDTH, DESIGN_BASELINE_Y + 0.5);
    ctx.stroke();

    ctx.fillStyle = "rgba(249,115,22,0.9)";
    ctx.font = `${11 / state.view.zoom}px monospace`;
    ctx.fillText("ground baseline", 10, DESIGN_BASELINE_Y - 6 / state.view.zoom);
  }

  function renderHeightReferences(ctx) {
    const filter = ui.heightFilterInput.value.trim().toLowerCase();
    const refs = GAME_CHARACTER_HEIGHT_REFERENCES
      .filter((ref) => !filter || ref.id.includes(filter) || ref.label.toLowerCase().includes(filter))
      .sort((a, b) => b.heightPx - a.heightPx);

    if (!refs.length) return;

    ctx.save();
    ctx.setLineDash([8 / state.view.zoom, 8 / state.view.zoom]);

    refs.forEach((ref, index) => {
      const heightEditorPx = ref.heightPx * GAME_TO_EDITOR_SCALE;
      const y = DESIGN_BASELINE_Y - heightEditorPx;
      const alpha = 0.18 + (index % 4) * 0.06;
      ctx.strokeStyle = `rgba(6,182,212,${alpha.toFixed(2)})`;
      ctx.lineWidth = 1.2 / state.view.zoom;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(DESIGN_CANVAS_WIDTH, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(226,232,240,0.85)";
      ctx.font = `${10 / state.view.zoom}px monospace`;
      ctx.fillText(`${ref.label} (${ref.heightPx}px)`, 10, y - 4 / state.view.zoom);
    });

    ctx.restore();

    if (state.document.editor.showSilhouettes) {
      drawReferenceSilhouettes(ctx, refs);
    }
  }

  function drawReferenceSilhouettes(ctx, refs) {
    const pick = ["small", "normal", "tall", "giant", "gothmommy", "bouncer"];
    const selected = pick
      .map((id) => refs.find((r) => r.id === id))
      .filter(Boolean);

    if (!selected.length) return;

    const startX = DESIGN_CANVAS_WIDTH - 260;
    const spacing = 42;

    selected.forEach((ref, i) => {
      const h = ref.heightPx * GAME_TO_EDITOR_SCALE * 0.58;
      const w = ref.widthPx * GAME_TO_EDITOR_SCALE * 0.58;
      const x = startX + i * spacing;
      const y = DESIGN_BASELINE_Y - h;

      ctx.fillStyle = "rgba(15,23,42,0.38)";
      ctx.strokeStyle = "rgba(148,163,184,0.65)";
      ctx.lineWidth = 1 / state.view.zoom;

      // Body capsule
      ctx.beginPath();
      ctx.roundRect(x - w * 0.5, y + h * 0.22, w, h * 0.78, w * 0.25);
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.14, w * 0.26, h * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(226,232,240,0.82)";
      ctx.font = `${9 / state.view.zoom}px monospace`;
      ctx.fillText(ref.id, x - w * 0.6, DESIGN_BASELINE_Y + 12 / state.view.zoom);
    });
  }

  function drawLayer(ctx, layer) {
    if (!layer.visible) return;

    const path = buildPath(layer);
    if (!path) return;

    ctx.save();
    ctx.globalAlpha = clamp(num(layer.style.opacity, 1), 0.05, 1);

    if (shouldFillLayer(layer)) {
      if (layer.style.fillMode === "gradient") {
        ctx.fillStyle = buildGradientForLayer(ctx, layer);
      } else {
        ctx.fillStyle = layer.style.fill || "#3b82f6";
      }
      ctx.fill(path);
    }

    const strokeW = num(layer.style.strokeWidth, 0);
    if (strokeW > 0) {
      ctx.strokeStyle = layer.style.stroke || "#0f172a";
      ctx.lineWidth = strokeW;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke(path);
    }

    if (layer.locked) {
      const bounds = getLayerBounds(layer);
      if (bounds) {
        ctx.fillStyle = "rgba(248,250,252,0.15)";
        ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
      }
    }

    ctx.restore();
  }

  function shouldFillLayer(layer) {
    return layer.type !== "line" && layer.type !== "curve";
  }

  function buildGradientForLayer(ctx, layer) {
    const gradient = layer.style.gradient || {};
    const angle = degToRad(num(gradient.angle, 90));
    const bounds = getLayerBounds(layer) || { x: 0, y: 0, w: 10, h: 10 };
    const cx = bounds.x + bounds.w * 0.5;
    const cy = bounds.y + bounds.h * 0.5;
    const radius = Math.max(bounds.w, bounds.h) * 0.75 + 1;

    const x1 = cx - Math.cos(angle) * radius;
    const y1 = cy - Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * radius;
    const y2 = cy + Math.sin(angle) * radius;

    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    const stops = Array.isArray(gradient.stops) && gradient.stops.length >= 2
      ? gradient.stops
      : [
          { offset: 0, color: "#ffffff" },
          { offset: 1, color: "#000000" }
        ];

    stops.forEach((stop) => {
      g.addColorStop(clamp(num(stop.offset, 0), 0, 1), isColor(stop.color) ? stop.color : "#ffffff");
    });

    return g;
  }

  function drawPolygonDraft(ctx) {
    const draft = state.polygonDraft;
    if (!draft || !draft.points.length) return;

    ctx.save();
    ctx.strokeStyle = "#22d3ee";
    ctx.fillStyle = "rgba(34,211,238,0.16)";
    ctx.lineWidth = 2 / state.view.zoom;

    ctx.beginPath();
    ctx.moveTo(draft.points[0].x, draft.points[0].y);
    for (let i = 1; i < draft.points.length; i++) {
      ctx.lineTo(draft.points[i].x, draft.points[i].y);
    }
    if (draft.hoverPoint) ctx.lineTo(draft.hoverPoint.x, draft.hoverPoint.y);
    ctx.stroke();

    draft.points.forEach((p) => {
      drawHandleDot(ctx, p.x, p.y, 4 / state.view.zoom, "#22d3ee", "#0f172a");
    });

    ctx.restore();
  }

  function renderSelectionOverlays(ctx) {
    const selected = getSelectedLayers().filter((layer) => layer.visible);
    if (!selected.length) return;

    const bounds = getLayersBounds(selected);
    if (!bounds) return;

    ctx.save();
    ctx.strokeStyle = "#f97316";
    ctx.setLineDash([8 / state.view.zoom, 6 / state.view.zoom]);
    ctx.lineWidth = 1.5 / state.view.zoom;
    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
    ctx.setLineDash([]);

    const corners = cornerPointsFromBounds(bounds);
    corners.forEach((corner) => {
      drawHandleRect(ctx, corner.x, corner.y, HANDLE_SCREEN_SIZE / state.view.zoom, "#f97316", "#0f172a");
    });

    if (selected.length === 1) {
      const handles = getPointHandlesForLayer(selected[0]);
      handles.forEach((handle) => {
        drawHandleDot(ctx, handle.x, handle.y, 4.4 / state.view.zoom, "#06b6d4", "#0f172a");
      });
    }

    ctx.restore();
  }

  function drawHandleRect(ctx, cx, cy, size, fill, stroke) {
    const half = size * 0.5;
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1 / state.view.zoom;
    ctx.fillRect(cx - half, cy - half, size, size);
    ctx.strokeRect(cx - half, cy - half, size, size);
  }

  function drawHandleDot(ctx, cx, cy, r, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1 / state.view.zoom;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function renderLayerList() {
    const layers = getLayers();
    const issueMaps = collectIssueMaps(state.validation);
    const frag = document.createDocumentFragment();

    [...layers].reverse().forEach((layer) => {
      const li = document.createElement("li");
      li.className = "layer-item";
      if (state.selectedIds.has(layer.id)) li.classList.add("is-selected");
      if (layer.locked) li.classList.add("is-locked");
      const layerIssue = issueMaps.layerMap[`${state.activePose}:${layer.id}`] || { hard: 0, visual: 0 };
      if (layerIssue.hard > 0) li.classList.add("has-hard-issue");
      if (layerIssue.visual > 0 && layerIssue.hard === 0) li.classList.add("has-visual-issue");
      li.dataset.layerId = layer.id;

      const vis = document.createElement("input");
      vis.type = "checkbox";
      vis.className = "layer-visible";
      vis.checked = !!layer.visible;
      vis.title = "Show / hide layer";

      const lock = document.createElement("button");
      lock.type = "button";
      lock.className = "layer-lock";
      lock.textContent = layer.locked ? "🔒" : "🔓";
      lock.title = "Lock / unlock layer";

      const name = document.createElement("span");
      name.className = "layer-name";
      name.textContent = layer.name;

      const type = document.createElement("span");
      type.className = "layer-type";
      type.textContent = layer.type;

      const issue = document.createElement("span");
      issue.className = "layer-issue";
      if (layerIssue.hard > 0) {
        issue.textContent = `H${layerIssue.hard}`;
        issue.title = `${layerIssue.hard} hard issue(s)`;
      } else if (layerIssue.visual > 0) {
        issue.textContent = `W${layerIssue.visual}`;
        issue.title = `${layerIssue.visual} warning(s)`;
      } else {
        issue.textContent = "";
      }

      li.append(vis, lock, name, type, issue);
      frag.append(li);
    });

    ui.layerList.replaceChildren(frag);
  }

  function renderSelectionInfo() {
    const selected = getSelectedLayers();
    if (!selected.length) {
      ui.selectionInfo.textContent = "No layer selected.";
      return;
    }

    if (selected.length === 1) {
      ui.selectionInfo.textContent = `Selected: ${selected[0].name} (${selected[0].type})`;
      return;
    }

    ui.selectionInfo.textContent = `${selected.length} layers selected for group transform.`;
  }

  function renderPosePreviews() {
    POSE_IDS.forEach((poseId) => {
      const canvas = ui.previewCanvases[poseId];
      renderPosePreview(canvas, poseId);
    });
  }

  function renderPosePreview(canvas, poseId) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0e1a2b");
    bg.addColorStop(1, "#09131f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(148,163,184,0.25)";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.82);
    ctx.lineTo(w, h * 0.82);
    ctx.stroke();

    const layers = getLayers(poseId).filter((layer) => layer.visible);
    if (!layers.length) return;

    const bounds = getLayersBounds(layers);
    if (!bounds) return;

    const modelW = Math.max(bounds.w, 1);
    const modelH = Math.max(bounds.h, 1);
    const scale = Math.min((w * 0.7) / modelW, (h * 0.72) / modelH);

    const modelCenterX = bounds.x + bounds.w * 0.5;

    ctx.save();
    ctx.translate(w * 0.5, h * 0.82);
    ctx.scale(scale * state.view.facing, scale);
    ctx.translate(-modelCenterX, -DESIGN_BASELINE_Y);

    layers.forEach((layer) => drawLayer(ctx, layer));
    ctx.restore();
  }

  function renderRuntimePreview(validation) {
    const ctx = ui.runtimePreviewCtx;
    const canvas = ui.runtimePreviewCanvas;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#0f172a");
    sky.addColorStop(1, "#12263c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const baselineY = h * 0.82;
    if (state.runtimePreview.worldContext) {
      drawRuntimePreviewWorldContext(ctx, w, h, baselineY);
    }

    if (!state.runtimeRenderer) {
      ui.runtimePreviewStatus.textContent = "Runtime renderer unavailable (missing runtime/npc-render-shared.js).";
      return;
    }

    const profile = ensureRuntimeProfile();
    if (profile.npcType) {
      state.runtimeCharDefs[profile.npcType] = {
        ...(state.runtimeCharDefs[profile.baseType] || {}),
        name: profile.npcType
      };
    }

    const scale = GAME_TO_EDITOR_SCALE * state.runtimePreview.scale;
    const widthPx = GAME_BASE_W * num(profile.wScale, 1) * scale;
    const heightPx = GAME_BASE_H * num(profile.hScale, 1) * scale;
    const tick = state.runtimePreview.tick;
    const pose = state.runtimePreview.pose;

    const drawOpts = {
      facing: state.runtimePreview.facing,
      npcType: profile.npcType || profile.baseType || "normal",
      color: profile.color,
      skinColor: profile.skinColor,
      hairColor: profile.hairColor,
      hairStyle: profile.hairStyle,
      eyeColor: profile.eyeColor,
      legColor: profile.legColor,
      shoeColor: profile.shoeColor,
      feminineBody: !!profile.feminineBody,
      bustScale: num(profile.bustScale, 0),
      hasDress: !!profile.hasDress,
      shortDress: !!profile.shortDress,
      walkPhase: tick * Math.PI,
      breathing: Math.sin(tick * 2.2) * 1.2,
      blinkTimer: (Math.sin(tick * 1.9) > 0.93) ? 0.05 : 0.6,
      isMovingJump: pose === "panic",
      airState: pose === "panic" ? "rising" : null,
      isFleeing: pose === "panic",
      openMouth: pose === "panic",
      isKO: pose === "ko",
      opacity: 1
    };

    state.runtimeRenderer.drawCharacter(w * 0.5, baselineY, widthPx, heightPx, drawOpts);

    const hard = validation?.hardFailures?.length || 0;
    const warnings = validation?.visualWarnings?.length || 0;
    ui.runtimePreviewStatus.textContent = `Runtime renderer active | base: ${profile.baseType} | npcType: ${profile.npcType} | hard: ${hard} | warnings: ${warnings}`;
  }

  function drawRuntimePreviewWorldContext(ctx, w, h, baselineY) {
    ctx.strokeStyle = "rgba(249,115,22,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baselineY + 0.5);
    ctx.lineTo(w, baselineY + 0.5);
    ctx.stroke();

    const silhouettes = [
      { id: "small", x: w * 0.18, alpha: 0.3 },
      { id: "normal", x: w * 0.33, alpha: 0.34 },
      { id: "tall", x: w * 0.68, alpha: 0.28 },
      { id: "giant", x: w * 0.84, alpha: 0.22 }
    ];

    silhouettes.forEach((silhouette) => {
      const ref = GAME_CHARACTER_HEIGHT_REFERENCES.find((entry) => entry.id === silhouette.id);
      if (!ref) return;
      const sh = ref.heightPx * 2.1;
      const sw = ref.widthPx * 2.1;
      const y = baselineY - sh;
      ctx.fillStyle = `rgba(148, 163, 184, ${silhouette.alpha})`;
      fillRoundRect(ctx, silhouette.x - sw * 0.5, y + sh * 0.2, sw, sh * 0.8, Math.max(3, sw * 0.2));
      ctx.beginPath();
      ctx.ellipse(silhouette.x, y + sh * 0.13, sw * 0.24, sh * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(226,232,240,0.72)";
      ctx.font = "9px monospace";
      ctx.fillText(ref.id, silhouette.x - sw * 0.45, baselineY + 12);
    });
  }

  function jumpToIssueTarget(target) {
    if (!target) return;

    if (target.startsWith("field:")) {
      const fieldInput = getFieldInputForTarget(target);
      if (fieldInput && typeof fieldInput.focus === "function") {
        fieldInput.focus();
      }
      return;
    }

    if (target.startsWith("pose:")) {
      const poseId = target.slice("pose:".length);
      if (POSE_IDS.includes(poseId)) {
        setActivePose(poseId);
      }
      return;
    }

    if (target.startsWith("layer:")) {
      const [, poseId, layerId] = target.split(":");
      if (POSE_IDS.includes(poseId)) {
        state.activePose = poseId;
      }
      updatePoseTabs();
      if (layerId) {
        setSelection([layerId]);
      }
      requestRender();
      window.setTimeout(() => {
        const selector = `[data-layer-id="${layerId}"]`;
        const row = ui.layerList.querySelector(selector);
        if (row) row.scrollIntoView({ block: "center" });
      }, 0);
    }
  }

  function getFieldInputForTarget(target) {
    const map = {
      "field:char-id": ui.charIdInput,
      "field:char-label": ui.charLabelInput,
      "field:runtime-base-type": ui.runtimeBaseTypeSelect,
      "field:runtime-npc-type": ui.runtimeNpcTypeInput,
      "field:runtime-scale": ui.runtimeWScaleInput,
      "field:runtime-health": ui.runtimeHealthMinInput,
      "field:runtime-colors": ui.runtimeBodyColorInput,
      "field:runtime-dress": ui.runtimeHasDressToggle
    };
    return map[target] || null;
  }

  function buildCanvasStatusText() {
    const selected = getSelectedLayers();
    const parts = [
      `Tool: ${state.activeTool}`,
      `Pose: ${state.activePose}`,
      `Zoom: ${Math.round(state.view.zoom * 100)}%`
    ];

    if (selected.length) {
      parts.push(`Selection: ${selected.length}`);
    }

    if (state.polygonDraft) {
      parts.push(`Polygon points: ${state.polygonDraft.points.length}`);
    }

    return parts.join("  |  ");
  }

  function hitTestLayers(worldPoint, opts = {}) {
    const includeLocked = !!opts.includeLocked;
    const layers = getLayers();

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;
      if (layer.locked && !includeLocked) continue;
      if (pointHitsLayer(layer, worldPoint)) return layer;
    }
    return null;
  }

  function pointHitsLayer(layer, point) {
    const style = layer.style || {};
    const strokeWidth = Math.max(1, num(style.strokeWidth, 1));

    if (layer.type === "line") {
      const g = layer.geometry;
      const d = distanceToSegment(point, { x: g.x1, y: g.y1 }, { x: g.x2, y: g.y2 });
      return d <= Math.max(6 / state.view.zoom, strokeWidth * 0.75);
    }

    if (layer.type === "curve") {
      const pts = sampleCurvePoints(layer.geometry, 28);
      for (let i = 0; i < pts.length - 1; i++) {
        const d = distanceToSegment(point, pts[i], pts[i + 1]);
        if (d <= Math.max(6 / state.view.zoom, strokeWidth * 0.75)) return true;
      }
      return false;
    }

    const path = buildPath(layer);
    if (!path) return false;

    if (shouldFillLayer(layer) && state.hitCtx.isPointInPath(path, point.x, point.y)) {
      return true;
    }

    state.hitCtx.lineWidth = Math.max(strokeWidth, 6 / state.view.zoom);
    return state.hitCtx.isPointInStroke(path, point.x, point.y);
  }

  function getResizeHandleHit(worldPoint) {
    const selected = getSelectedLayers().filter((l) => l.visible);
    if (!selected.length) return null;

    const bounds = getLayersBounds(selected);
    if (!bounds) return null;

    const corners = cornerPointsFromBounds(bounds);
    const threshold = (HANDLE_SCREEN_SIZE * 0.8) / state.view.zoom;

    for (const corner of corners) {
      if (distance(worldPoint, corner) <= threshold) {
        return { handle: corner.key, bounds };
      }
    }

    return null;
  }

  function getPointHandleHit(worldPoint) {
    const selected = getSelectedLayers();
    if (selected.length !== 1) return null;

    const layer = selected[0];
    const handles = getPointHandlesForLayer(layer);
    if (!handles.length) return null;

    const threshold = 8 / state.view.zoom;
    for (const handle of handles) {
      if (distance(worldPoint, handle) <= threshold) {
        return {
          layerId: layer.id,
          handle
        };
      }
    }

    return null;
  }

  function getPointHandlesForLayer(layer) {
    const g = layer.geometry;

    if (layer.type === "line") {
      return [
        { x: g.x1, y: g.y1, key: "line_start" },
        { x: g.x2, y: g.y2, key: "line_end" }
      ];
    }

    if (layer.type === "curve") {
      return [
        { x: g.x1, y: g.y1, key: "curve_start" },
        { x: g.cx, y: g.cy, key: "curve_ctrl" },
        { x: g.x2, y: g.y2, key: "curve_end" }
      ];
    }

    if (layer.type === "polygon") {
      return (g.points || []).map((p, i) => ({ x: p.x, y: p.y, key: `polygon_${i}`, index: i }));
    }

    return [];
  }

  function applyPointHandleToGeometry(geometry, type, handle, worldPoint) {
    if (type === "line") {
      if (handle.key === "line_start") {
        geometry.x1 = worldPoint.x;
        geometry.y1 = worldPoint.y;
      } else {
        geometry.x2 = worldPoint.x;
        geometry.y2 = worldPoint.y;
      }
      return;
    }

    if (type === "curve") {
      if (handle.key === "curve_start") {
        geometry.x1 = worldPoint.x;
        geometry.y1 = worldPoint.y;
      } else if (handle.key === "curve_ctrl") {
        geometry.cx = worldPoint.x;
        geometry.cy = worldPoint.y;
      } else {
        geometry.x2 = worldPoint.x;
        geometry.y2 = worldPoint.y;
      }
      return;
    }

    if (type === "polygon") {
      const idx = num(handle.index, -1);
      if (idx >= 0 && idx < geometry.points.length) {
        geometry.points[idx] = copyPoint(worldPoint);
      }
    }
  }

  function buildPath(layer) {
    const p = new Path2D();
    const g = layer.geometry;

    if (layer.type === "rect") {
      p.rect(g.x, g.y, g.w, g.h);
      return p;
    }

    if (layer.type === "ellipse") {
      p.ellipse(g.x + g.w * 0.5, g.y + g.h * 0.5, Math.abs(g.w) * 0.5, Math.abs(g.h) * 0.5, 0, 0, Math.PI * 2);
      return p;
    }

    if (layer.type === "line") {
      p.moveTo(g.x1, g.y1);
      p.lineTo(g.x2, g.y2);
      return p;
    }

    if (layer.type === "curve") {
      p.moveTo(g.x1, g.y1);
      p.quadraticCurveTo(g.cx, g.cy, g.x2, g.y2);
      return p;
    }

    if (layer.type === "polygon") {
      const pts = g.points || [];
      if (!pts.length) return null;
      p.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) p.lineTo(pts[i].x, pts[i].y);
      if (g.closed !== false) p.closePath();
      return p;
    }

    return null;
  }

  function getLayerBounds(layer) {
    const g = layer.geometry;
    if (!g) return null;

    if (layer.type === "rect" || layer.type === "ellipse") {
      const x = Math.min(g.x, g.x + g.w);
      const y = Math.min(g.y, g.y + g.h);
      return { x, y, w: Math.abs(g.w), h: Math.abs(g.h) };
    }

    if (layer.type === "line") {
      const xMin = Math.min(g.x1, g.x2);
      const xMax = Math.max(g.x1, g.x2);
      const yMin = Math.min(g.y1, g.y2);
      const yMax = Math.max(g.y1, g.y2);
      return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
    }

    if (layer.type === "curve") {
      const points = sampleCurvePoints(g, 40);
      return boundsFromPoints(points);
    }

    if (layer.type === "polygon") {
      const pts = g.points || [];
      if (!pts.length) return null;
      return boundsFromPoints(pts);
    }

    return null;
  }

  function getLayersBounds(layers) {
    const boxes = layers.map(getLayerBounds).filter(Boolean);
    if (!boxes.length) return null;

    const xMin = Math.min(...boxes.map((b) => b.x));
    const yMin = Math.min(...boxes.map((b) => b.y));
    const xMax = Math.max(...boxes.map((b) => b.x + b.w));
    const yMax = Math.max(...boxes.map((b) => b.y + b.h));

    return {
      x: xMin,
      y: yMin,
      w: xMax - xMin,
      h: yMax - yMin,
      xMax,
      yMax
    };
  }

  function cornerPointsFromBounds(bounds) {
    return [
      { key: "nw", x: bounds.x, y: bounds.y },
      { key: "ne", x: bounds.x + bounds.w, y: bounds.y },
      { key: "se", x: bounds.x + bounds.w, y: bounds.y + bounds.h },
      { key: "sw", x: bounds.x, y: bounds.y + bounds.h }
    ];
  }

  function getCornerPoint(bounds, key) {
    if (key === "nw") return { x: bounds.x, y: bounds.y };
    if (key === "ne") return { x: bounds.x + bounds.w, y: bounds.y };
    if (key === "se") return { x: bounds.x + bounds.w, y: bounds.y + bounds.h };
    return { x: bounds.x, y: bounds.y + bounds.h };
  }

  function oppositeCorner(key) {
    if (key === "nw") return "se";
    if (key === "ne") return "sw";
    if (key === "se") return "nw";
    return "ne";
  }

  function translateGeometryFromSnapshot(target, source, dx, dy) {
    if (!target || !source) return;

    if (target.x !== undefined && target.y !== undefined && target.w !== undefined && target.h !== undefined) {
      target.x = source.x + dx;
      target.y = source.y + dy;
      return;
    }

    if (target.x1 !== undefined && target.y1 !== undefined && target.x2 !== undefined && target.y2 !== undefined && target.cx === undefined) {
      target.x1 = source.x1 + dx;
      target.y1 = source.y1 + dy;
      target.x2 = source.x2 + dx;
      target.y2 = source.y2 + dy;
      return;
    }

    if (target.cx !== undefined) {
      target.x1 = source.x1 + dx;
      target.y1 = source.y1 + dy;
      target.cx = source.cx + dx;
      target.cy = source.cy + dy;
      target.x2 = source.x2 + dx;
      target.y2 = source.y2 + dy;
      return;
    }

    if (Array.isArray(target.points) && Array.isArray(source.points)) {
      target.points = source.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  }

  function scaleLayerGeometryFromSnapshot(layer, sourceGeometry, anchor, sx, sy) {
    if (!layer || !sourceGeometry) return;
    const g = layer.geometry;

    if (layer.type === "rect" || layer.type === "ellipse") {
      const p1 = scalePoint({ x: sourceGeometry.x, y: sourceGeometry.y }, anchor, sx, sy);
      const p2 = scalePoint({ x: sourceGeometry.x + sourceGeometry.w, y: sourceGeometry.y + sourceGeometry.h }, anchor, sx, sy);
      const n = normalizeRectFromPoints(p1, p2);
      g.x = n.x;
      g.y = n.y;
      g.w = n.w;
      g.h = n.h;
      return;
    }

    if (layer.type === "line") {
      const p1 = scalePoint({ x: sourceGeometry.x1, y: sourceGeometry.y1 }, anchor, sx, sy);
      const p2 = scalePoint({ x: sourceGeometry.x2, y: sourceGeometry.y2 }, anchor, sx, sy);
      g.x1 = p1.x;
      g.y1 = p1.y;
      g.x2 = p2.x;
      g.y2 = p2.y;
      return;
    }

    if (layer.type === "curve") {
      const p1 = scalePoint({ x: sourceGeometry.x1, y: sourceGeometry.y1 }, anchor, sx, sy);
      const pc = scalePoint({ x: sourceGeometry.cx, y: sourceGeometry.cy }, anchor, sx, sy);
      const p2 = scalePoint({ x: sourceGeometry.x2, y: sourceGeometry.y2 }, anchor, sx, sy);
      g.x1 = p1.x;
      g.y1 = p1.y;
      g.cx = pc.x;
      g.cy = pc.y;
      g.x2 = p2.x;
      g.y2 = p2.y;
      return;
    }

    if (layer.type === "polygon") {
      g.points = sourceGeometry.points.map((p) => scalePoint(p, anchor, sx, sy));
    }
  }

  function exportEditableJson() {
    ensureDocument();
    state.document.meta.id = ui.charIdInput.value.trim() || state.document.meta.id;
    state.document.meta.label = ui.charLabelInput.value || state.document.meta.label;
    state.document.meta.baseTemplate = ui.templateSelect.value;
    ensureRuntimeProfile();
    const validation = runDesignerValidation({ applyAutoFix: true, silent: true });
    state.document.validation = {
      summary: deepClone(validation.summary),
      metadata: deepClone(validation.metadata),
      hardFailures: (validation.hardFailures || []).map((entry) => ({ target: entry.target, message: entry.message })),
      visualWarnings: (validation.visualWarnings || []).map((entry) => ({ target: entry.target, message: entry.message }))
    };
    persistEditorView();
    stampUpdatedAt();

    const text = JSON.stringify(state.document, null, 2);
    return text;
  }

  function importEditableJson(jsonText) {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      setStatus(`Invalid JSON: ${err.message}`);
      return;
    }

    const normalized = normalizeImportedDocument(parsed);
    state.document = normalized;
    state.skipAutoFixOnce = true;

    state.activePose = POSE_IDS.includes(state.activePose) ? state.activePose : "normal";
    state.selectedIds.clear();
    state.layerListAnchorId = null;
    syncControlsFromDocument();
    fitToModel();
    const validation = runDesignerValidation({ applyAutoFix: false, silent: true });
    requestRender();
    if (validation.hardFailures.length) {
      setStatus(`JSON imported with ${validation.hardFailures.length} hard blocker(s). Fix blockers before compact export.`);
    } else if (validation.visualWarnings.length) {
      setStatus(`JSON imported with ${validation.visualWarnings.length} warning(s).`);
    } else {
      setStatus("JSON imported successfully.");
    }
  }

  function normalizeImportedDocument(doc) {
    const template = doc?.meta?.baseTemplate === "female_base" ? "female_base" : "male_base";
    const base = createDesignerDocument(template);

    const out = deepClone(base);
    out.version = num(doc?.version, 1);

    if (doc?.meta && typeof doc.meta === "object") {
      out.meta.id = typeof doc.meta.id === "string" ? doc.meta.id : out.meta.id;
      out.meta.label = typeof doc.meta.label === "string" ? doc.meta.label : out.meta.label;
      out.meta.baseTemplate = template;
      out.meta.createdAt = typeof doc.meta.createdAt === "string" ? doc.meta.createdAt : out.meta.createdAt;
      out.meta.updatedAt = typeof doc.meta.updatedAt === "string" ? doc.meta.updatedAt : out.meta.updatedAt;
    }

    if (doc?.canvas && typeof doc.canvas === "object") {
      out.canvas.width = num(doc.canvas.width, DESIGN_CANVAS_WIDTH);
      out.canvas.height = num(doc.canvas.height, DESIGN_CANVAS_HEIGHT);
      out.canvas.unit = typeof doc.canvas.unit === "string" ? doc.canvas.unit : "game_px";
    }

    if (doc?.editor && typeof doc.editor === "object") {
      out.editor.zoom = clamp(num(doc.editor.zoom, out.editor.zoom), 0.25, 4);
      out.editor.panX = num(doc.editor.panX, out.editor.panX);
      out.editor.panY = num(doc.editor.panY, out.editor.panY);
      out.editor.facing = doc.editor.facing === -1 ? -1 : 1;
      out.editor.showGrid = doc.editor.showGrid !== false;
      out.editor.showHeightLines = doc.editor.showHeightLines !== false;
      out.editor.showSilhouettes = !!doc.editor.showSilhouettes;
    }

    out.runtimeProfile = normalizeRuntimeProfile(
      doc?.runtimeProfile,
      out.meta.baseTemplate
    );

    if (doc?.validation && typeof doc.validation === "object") {
      out.validation = deepClone(doc.validation);
    }

    POSE_IDS.forEach((poseId) => {
      const pose = doc?.poses?.[poseId];
      if (!pose || !Array.isArray(pose.layers)) return;
      out.poses[poseId].layers = pose.layers.map(normalizeImportedLayer);
    });

    state.layerIdCounter = Math.max(state.layerIdCounter, inferNextLayerCounter(out));
    return out;
  }

  function normalizeImportedLayer(layer) {
    const type = ["rect", "ellipse", "line", "curve", "polygon"].includes(layer?.type) ? layer.type : "rect";
    const id = typeof layer?.id === "string" ? layer.id : nextLayerId();

    const normalized = {
      id,
      name: typeof layer?.name === "string" ? layer.name : `Layer ${id}`,
      type,
      visible: layer?.visible !== false,
      locked: !!layer?.locked,
      transform: {
        x: num(layer?.transform?.x, 0),
        y: num(layer?.transform?.y, 0),
        scaleX: num(layer?.transform?.scaleX, 1),
        scaleY: num(layer?.transform?.scaleY, 1),
        rotation: num(layer?.transform?.rotation, 0)
      },
      geometry: {},
      style: normalizeStyle(layer?.style || {})
    };

    const g = layer?.geometry || {};
    if (type === "rect" || type === "ellipse") {
      normalized.geometry = {
        x: num(g.x, DESIGN_CENTER_X - 20),
        y: num(g.y, DESIGN_BASELINE_Y - 120),
        w: num(g.w, 40),
        h: num(g.h, 80)
      };
    } else if (type === "line") {
      normalized.geometry = {
        x1: num(g.x1, DESIGN_CENTER_X - 20),
        y1: num(g.y1, DESIGN_BASELINE_Y - 80),
        x2: num(g.x2, DESIGN_CENTER_X + 20),
        y2: num(g.y2, DESIGN_BASELINE_Y - 40)
      };
    } else if (type === "curve") {
      normalized.geometry = {
        x1: num(g.x1, DESIGN_CENTER_X - 24),
        y1: num(g.y1, DESIGN_BASELINE_Y - 90),
        cx: num(g.cx, DESIGN_CENTER_X),
        cy: num(g.cy, DESIGN_BASELINE_Y - 150),
        x2: num(g.x2, DESIGN_CENTER_X + 24),
        y2: num(g.y2, DESIGN_BASELINE_Y - 90)
      };
    } else {
      normalized.geometry = {
        points: Array.isArray(g.points) && g.points.length
          ? g.points.map((p) => ({ x: num(p.x, DESIGN_CENTER_X), y: num(p.y, DESIGN_BASELINE_Y - 80) }))
          : [
              { x: DESIGN_CENTER_X - 30, y: DESIGN_BASELINE_Y - 80 },
              { x: DESIGN_CENTER_X + 30, y: DESIGN_BASELINE_Y - 80 },
              { x: DESIGN_CENTER_X, y: DESIGN_BASELINE_Y - 120 }
            ],
        closed: g.closed !== false
      };
    }

    return normalized;
  }

  function inferNextLayerCounter(doc) {
    let maxNum = 1;
    POSE_IDS.forEach((poseId) => {
      (doc?.poses?.[poseId]?.layers || []).forEach((layer) => {
        const m = /^layer_(\d+)$/.exec(layer.id || "");
        if (m) {
          maxNum = Math.max(maxNum, parseInt(m[1], 10) + 1);
        }
      });
    });
    return maxNum;
  }

  function exportIntegrationPayload() {
    ensureDocument();
    ensureRuntimeProfile();
    const validation = runDesignerValidation({ applyAutoFix: true, silent: true });
    if (validation.hardFailures.length) {
      setStatus(`Compact export blocked: ${validation.hardFailures.length} hard safety issue(s).`);
      return null;
    }

    const payload = {
      version: 1,
      id: state.document.meta.id,
      label: state.document.meta.label,
      baseTemplate: state.document.meta.baseTemplate,
      runtimeProfile: deepClone(state.document.runtimeProfile),
      bounds: {
        w: GAME_BASE_W,
        h: GAME_BASE_H,
        editorScale: GAME_TO_EDITOR_SCALE
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        validation: {
          summary: deepClone(validation.summary),
          metadata: deepClone(validation.metadata),
          hardFailures: [],
          visualWarnings: (validation.visualWarnings || []).map((entry) => ({
            target: entry.target,
            message: entry.message
          })),
          autoFixes: (validation.autoFixes || []).slice()
        }
      },
      poses: {}
    };

    POSE_IDS.forEach((poseId) => {
      payload.poses[poseId] = getLayers(poseId).map((layer) => ({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        visible: layer.visible,
        geometry: deepClone(layer.geometry),
        style: deepClone(layer.style)
      }));
    });

    return payload;
  }

  async function copyJsonToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied JSON to clipboard.");
    } catch (err) {
      setStatus(`Clipboard copy failed: ${err.message}`);
    }
  }

  function downloadJson(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${filename}.`);
  }

  function setStatus(msg) {
    ui.canvasStatus.textContent = msg;
    if (state.statusTimer) clearTimeout(state.statusTimer);
    state.statusTimer = window.setTimeout(() => {
      ui.canvasStatus.textContent = buildCanvasStatusText();
    }, 2200);
  }

  function eventToCanvas(e) {
    const rect = ui.editorCanvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * ui.editorCanvas.width,
      y: ((e.clientY - rect.top) / rect.height) * ui.editorCanvas.height
    };
  }

  function canvasToWorld(canvasPt) {
    return {
      x: (canvasPt.x - state.view.panX) / state.view.zoom,
      y: (canvasPt.y - state.view.panY) / state.view.zoom
    };
  }

  function scalePoint(point, anchor, sx, sy) {
    return {
      x: anchor.x + (point.x - anchor.x) * sx,
      y: anchor.y + (point.y - anchor.y) * sy
    };
  }

  function normalizeRectFromPoints(p1, p2) {
    return {
      x: Math.min(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
      w: Math.abs(p2.x - p1.x),
      h: Math.abs(p2.y - p1.y)
    };
  }

  function boundsFromPoints(points) {
    if (!points.length) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
  }

  function sampleCurvePoints(g, samples) {
    const pts = [];
    const n = Math.max(2, samples);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const inv = 1 - t;
      const x = inv * inv * g.x1 + 2 * inv * t * g.cx + t * t * g.x2;
      const y = inv * inv * g.y1 + 2 * inv * t * g.cy + t * t * g.y2;
      pts.push({ x, y });
    }
    return pts;
  }

  function cloneLayer(layer) {
    return {
      id: layer.id,
      name: layer.name,
      type: layer.type,
      visible: layer.visible,
      locked: layer.locked,
      transform: deepClone(layer.transform || { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }),
      geometry: cloneGeometry(layer.geometry),
      style: deepClone(layer.style)
    };
  }

  function cloneGeometry(geometry) {
    return deepClone(geometry);
  }

  function deepClone(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function copyPoint(p) {
    return { x: p.x, y: p.y };
  }

  function safeDiv(numVal, denVal, fallback) {
    if (!Number.isFinite(numVal) || !Number.isFinite(denVal) || Math.abs(denVal) < 1e-9) return fallback;
    return numVal / denVal;
  }

  function num(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function distanceToSegment(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const abLenSq = abx * abx + aby * aby;
    if (abLenSq === 0) return Math.hypot(apx, apy);
    let t = (apx * abx + apy * aby) / abLenSq;
    t = clamp(t, 0, 1);
    const cx = a.x + abx * t;
    const cy = a.y + aby * t;
    return Math.hypot(p.x - cx, p.y - cy);
  }

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function fillRoundRect(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, Math.abs(w) * 0.5, Math.abs(h) * 0.5));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  function isEditableTarget(target) {
    if (!target) return false;
    const tag = (target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
  }

  function isAdditiveSelect(e) {
    return !!(e.shiftKey || e.metaKey || e.ctrlKey);
  }

  function safeName(value) {
    return (value || "npc").replace(/[^a-z0-9._-]/gi, "_").toLowerCase();
  }

  function isColor(value) {
    return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDesigner);
  } else {
    initDesigner();
  }
})();

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const esc = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const meta = typeof FLYWHEEL_META !== "undefined" ? FLYWHEEL_META : {};
  const order = typeof FLYWHEEL_ORDER !== "undefined" ? FLYWHEEL_ORDER : ["p3", "p1", "p2", "p4", "p5", "p6"];
  const projectById = (id) => (typeof PROJECTS !== "undefined" ? PROJECTS.find((p) => p.id === id) : null);

  /* ==========================================================================
     01 Flywheel Engine & Real-Time Telemetry HUD
     ========================================================================== */

  const stations = $$(".station-group, .hub-group");
  const toggleBtn = $("#fly-toggle-btn");
  const toggleIcon = $("#fly-toggle-icon");
  const toggleText = $("#fly-toggle-text");
  const stepBtn = $("#fly-step-btn");
  const speedPills = $$(".speed-pill");

  const spotlightTag = $("#spotlight-tag");
  const spotlightName = $("#spotlight-name");
  const spotlightAction = $("#spotlight-action");
  const spotlightMetric = $("#spotlight-metric");
  const spotlightOpenBtn = $("#btn-spotlight-open");
  const terminalLog = $("#hud-terminal-log");

  let currentIndex = 0;
  let isRunning = !reduceMotion;
  let intervalSpeed = 3500;
  let timer = null;
  let hoverPaused = false;

  function formatTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const ms = String(now.getMilliseconds()).padStart(3, "0");
    return `${h}:${m}:${s}.${ms}`;
  }

  function appendTerminalLog(id) {
    if (!terminalLog) return;
    const m = meta[id];
    if (!m) return;

    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerHTML = `
      <span class="log-time">${formatTime()}</span>
      <span class="log-tag ${id}">${esc(id.toUpperCase())}</span>
      <span class="log-text">${esc(m.telemetry?.log || m.caption || m.oneLine)}</span>
    `;

    terminalLog.appendChild(entry);

    // Keep up to 12 log lines
    while (terminalLog.children.length > 12) {
      terminalLog.removeChild(terminalLog.firstChild);
    }

    terminalLog.scrollTop = terminalLog.scrollHeight;
  }

  function activateNode(id, emitLog = true) {
    const idx = order.indexOf(id);
    if (idx !== -1) currentIndex = idx;

    // Update active classes on stations & hub
    stations.forEach((st) => {
      const match = st.dataset.project === id;
      st.classList.toggle("active", match);
      st.setAttribute("aria-pressed", match ? "true" : "false");
    });

    // Update Telemetry Spotlight
    const project = projectById(id);
    const m = meta[id] || {};

    if (spotlightTag) spotlightTag.textContent = `${(project ? project.num : id).toUpperCase()} · ${m.role || ""}`;
    if (spotlightName) spotlightName.textContent = project ? project.name : id;
    if (spotlightAction) spotlightAction.innerHTML = `状态: <strong>${esc(m.telemetry?.state || "RUNNING")}</strong> · 延迟: <strong>${esc(m.telemetry?.latency || "<500ms")}</strong> · ${esc(m.telemetry?.action || m.oneLine || "")}`;
    if (spotlightMetric) spotlightMetric.textContent = m.metric || "";
    if (spotlightOpenBtn) spotlightOpenBtn.dataset.project = id;

    if (emitLog) {
      appendTerminalLog(id);
    }
  }

  function nextNode() {
    currentIndex = (currentIndex + 1) % order.length;
    activateNode(order[currentIndex], true);
  }

  function startCycle() {
    if (timer) clearInterval(timer);
    if (!isRunning || hoverPaused) return;
    timer = setInterval(nextNode, intervalSpeed);
  }

  function stopCycle() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function updateToggleUI() {
    if (toggleIcon) toggleIcon.textContent = isRunning ? "⏸" : "▶";
    if (toggleText) toggleText.textContent = isRunning ? "运转中" : "已暂停";
    if (toggleBtn) toggleBtn.classList.toggle("active", isRunning);
  }

  // Bind controls
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      isRunning = !isRunning;
      updateToggleUI();
      if (isRunning) {
        startCycle();
      } else {
        stopCycle();
      }
    });
  }

  if (stepBtn) {
    stepBtn.addEventListener("click", () => {
      stopCycle();
      isRunning = false;
      updateToggleUI();
      nextNode();
    });
  }

  speedPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      speedPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      intervalSpeed = parseInt(pill.dataset.speed, 10) || 3500;
      if (isRunning && !hoverPaused) {
        startCycle();
      }
    });
  });

  // Station clicks & hover pauses
  stations.forEach((st) => {
    const id = st.dataset.project;
    st.addEventListener("click", () => {
      activateNode(id, true);
    });

    st.addEventListener("mouseenter", () => {
      hoverPaused = true;
      stopCycle();
    });

    st.addEventListener("mouseleave", () => {
      hoverPaused = false;
      if (isRunning) startCycle();
    });
  });

  // Spotlight open button triggers drawer
  if (spotlightOpenBtn) {
    spotlightOpenBtn.addEventListener("click", () => {
      const pid = spotlightOpenBtn.dataset.project || "p1";
      openProjectDialog(pid);
    });
  }

  /* ==========================================================================
     02 Project Detail Dialog Drawer
     ========================================================================== */

  const dialog = $("#project-dialog");
  const dialogContent = $("#dialog-content");
  const dialogClose = $("#dialog-close");
  let lastFocus = null;

  function renderTimelineMarkup(project) {
    return project.nodes
      .map(
        (node, i) => `
        <button class="flow-node-btn${i === 0 ? " active" : ""}" type="button"
          data-project="${esc(project.id)}" data-index="${i}"
          aria-label="第 ${esc(node.code)} 步：${esc(node.title)}">
          <span class="flow-node-code">STEP ${esc(node.code)}</span>
          <span class="flow-node-name">${esc(node.label || node.title)}</span>
          <span class="flow-node-layer">${esc(node.layer)}</span>
        </button>
        ${i < project.nodes.length - 1 ? '<span class="flow-arrow" aria-hidden="true">➔</span>' : ""}`
      )
      .join("");
  }

  function renderNodeDetail(project, index) {
    const node = project.nodes[index];
    if (!node) return "";
    return `
      <div class="inspector-head">
        <span class="inspector-title">STEP ${esc(node.code)} · ${esc(node.title)} (${esc(node.layer)})</span>
        <span class="inspector-endpoint">${esc(node.endpoint)}</span>
      </div>
      <p class="inspector-desc">${esc(node.desc)}</p>
      <div class="inspector-source">源码文件位置: <b>${esc(node.source)}</b></div>
    `;
  }

  function renderDialogHTML(project) {
    const m = meta[project.id] || {};
    const metricsHtml = project.metrics
      .map(
        (metric) => `
        <div class="dialog-metric-box">
          <strong>${esc(metric.v)}</strong>
          <span>${esc(metric.l)}</span>
        </div>`
      )
      .join("");

    const bulletsHtml = project.bullets.map((b) => `<li>${esc(b)}</li>`).join("");
    const stackHtml = project.stack.map((s) => `<span>${esc(s)}</span>`).join("");

    return `
      <p class="dialog-kicker">${esc(project.num)} / ${esc(m.tag || "业务层")} · ${esc(m.role || "")}</p>
      <h3 class="dialog-title" id="dialog-title">${esc(project.name)}</h3>
      <p class="dialog-meta">${esc(project.period)} · ${esc(project.role)}</p>
      <p class="dialog-desc">${esc(project.desc)}</p>

      <div class="dialog-metrics">${metricsHtml}</div>

      <div class="flow-section-title">
        <span>RUNTIME // 运行时 6 步架构链路</span>
        <span style="font-size: 11px; color: var(--text-dim);">点击每一步查看接口与源码实现</span>
      </div>

      <div class="flow-wrap">
        <div class="flow-timeline" role="group" aria-label="${esc(project.short)} 运行链路">
          ${renderTimelineMarkup(project)}
        </div>
      </div>

      <div class="node-inspector" id="node-inspector" aria-live="polite">
        ${renderNodeDetail(project, 0)}
      </div>

      <p class="flow-section-title" style="margin-top: 24px;">CORE HIGHLIGHTS // 核心工程突破</p>
      <ul class="dialog-bullets">${bulletsHtml}</ul>

      <div class="dialog-evidence">
        <b>EVIDENCE / 验证边界</b>
        <span>${esc(project.evidence)}</span>
      </div>

      <div class="dialog-stack">${stackHtml}</div>
    `;
  }

  function openProjectDialog(id) {
    const project = projectById(id);
    if (!project || !dialog || !dialogContent) return;

    lastFocus = document.activeElement;
    dialogContent.innerHTML = renderDialogHTML(project);

    // Bind timeline step buttons
    const stepButtons = $$(".flow-node-btn", dialogContent);
    const inspector = $("#node-inspector", dialogContent);

    stepButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        stepButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const idx = parseInt(btn.dataset.index, 10) || 0;
        if (inspector) {
          inspector.innerHTML = renderNodeDetail(project, idx);
        }
      });
    });

    dialog.showModal();
    if (dialogClose) dialogClose.focus();
  }

  function closeProjectDialog() {
    if (dialog && dialog.open) {
      dialog.close();
      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
    }
  }

  if (dialogClose) dialogClose.addEventListener("click", closeProjectDialog);
  if (dialog) {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) closeProjectDialog();
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeProjectDialog();
    });
  }

  // Open dialog from Bento cards & direct clicks
  $$(".bento-card").forEach((card) => {
    card.addEventListener("click", () => {
      const pid = card.dataset.project;
      if (pid) openProjectDialog(pid);
    });
  });

  /* ==========================================================================
     03 Copy Email Toast Helper
     ========================================================================== */

  const copyEmailBtn = $("#copy-email-btn");
  const toastMsg = $("#toast-msg");
  let toastTimer = null;

  function showToast(text) {
    if (!toastMsg) return;
    toastMsg.textContent = text;
    toastMsg.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMsg.classList.remove("show");
    }, 2400);
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", async () => {
      const email = "suzhe52@foxmail.com";
      try {
        await navigator.clipboard.writeText(email);
        showToast("✓ 邮箱已复制到剪贴板: " + email);
      } catch (err) {
        showToast("请直接发送邮件至: " + email);
      }
    });
  }

  /* ==========================================================================
     04 Initial Boot
     ========================================================================== */

  // Seed initial log history
  order.slice(0, 3).forEach((id) => appendTerminalLog(id));
  activateNode(order[0], true);
  updateToggleUI();
  if (isRunning) {
    startCycle();
  }
})();

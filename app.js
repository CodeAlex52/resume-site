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
  const projectById = (id) => PROJECTS.find((p) => p.id === id);

  /* ------------------------------------------------------------------------
     Project runtime drawer
     ------------------------------------------------------------------------ */

  const dialog = $("#project-dialog");
  const dialogContent = $("#dialog-content");
  const dialogClose = $("#dialog-close");
  let lastFocus = null;

  function flowMarkup(project) {
    return project.nodes
      .map(
        (node, i) => `
        <button class="flow-node${i === 0 ? " active" : ""}" type="button"
          data-project="${esc(project.id)}" data-index="${i}"
          aria-pressed="${i === 0 ? "true" : "false"}"
          aria-label="第 ${esc(node.code)} 步：${esc(node.title)}">
          <span class="node-code">${esc(node.code)}</span>
          <span class="node-layer">${esc(node.layer)}</span>
          <span class="node-title">${esc(node.label || node.title)}</span>
        </button>
        ${i < project.nodes.length - 1 ? '<span class="flow-link" aria-hidden="true"></span>' : ""}`
      )
      .join("");
  }

  function nodeDetailMarkup(project, index) {
    const node = project.nodes[index];
    return `
      <div class="detail-head">
        <span class="detail-layer">${esc(node.layer)} · ${esc(node.code)}</span>
        <span class="detail-title">${esc(node.title)}</span>
        <span class="detail-endpoint">${esc(node.endpoint)}</span>
      </div>
      <p class="detail-desc">${esc(node.desc)}</p>
      <p class="detail-source">source · <b>${esc(node.source)}</b></p>
    `;
  }

  function dialogMarkup(project) {
    const fly = meta[project.id] || { tag: "", role: "" };
    const metrics = project.metrics
      .map(
        (m) => `
        <div class="metric">
          <strong>${esc(m.v)}</strong>
          <span>${esc(m.l)}</span>
        </div>`
      )
      .join("");
    const bullets = project.bullets.map((b) => `<li>${esc(b)}</li>`).join("");
    const stack = project.stack.map((s) => `<span>${esc(s)}</span>`).join("");

    return `
      <p class="dialog-kicker">${esc(project.num)} / ${esc(fly.tag)} · ${esc(fly.role)}</p>
      <h3 class="dialog-title" id="dialog-title">${esc(project.name)}</h3>
      <p class="dialog-meta">${esc(project.period)} · ${esc(project.role)}</p>
      <p class="dialog-desc">${esc(project.desc)}</p>

      <div class="metrics">${metrics}</div>

      <div class="flow-label">
        <span>RUNTIME / 运行链路</span>
        <em>点击节点查看实现细节</em>
      </div>
      <div class="flow-wrap">
        <div class="flow" role="group" aria-label="${esc(project.short)} 运行链路">
          ${flowMarkup(project)}
        </div>
      </div>
      <div class="node-detail" data-detail="${esc(project.id)}" aria-live="polite">
        ${nodeDetailMarkup(project, 0)}
      </div>

      <ul class="project-points">${bullets}</ul>

      <div class="evidence">
        <b>EVIDENCE</b>
        <span>${esc(project.evidence)}</span>
      </div>

      <div class="project-stack">${stack}</div>
    `;
  }

  function openDrawer(id) {
    if (!dialog || !dialogContent) return;
    const project = projectById(id);
    if (!project) return;

    lastFocus = document.activeElement;
    dialogContent.innerHTML = dialogMarkup(project);
    document.body.classList.add("dialog-open");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    dialogClose?.focus();
  }

  function closeDrawer() {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  if (dialog) {
    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDrawer();
    });

    dialogClose?.addEventListener("click", closeDrawer);

    dialogContent?.addEventListener("click", (event) => {
      const node = event.target.closest(".flow-node");
      if (!node) return;

      const projectId = node.dataset.project;
      const index = Number(node.dataset.index);
      const project = projectById(projectId);
      if (!project) return;

      const flow = node.closest(".flow");
      $$(".flow-node", flow).forEach((n) => {
        n.classList.toggle("active", n === node);
        n.setAttribute("aria-pressed", n === node ? "true" : "false");
      });

      const detail = dialogContent.querySelector(`[data-detail="${projectId}"]`);
      if (detail) detail.innerHTML = nodeDetailMarkup(project, index);
    });
  }

  /* Architecture sheet + project cards -> drawer */

  $(".arch-sheet")?.addEventListener("click", (event) => {
    const hit = event.target.closest("[data-project]");
    if (!hit) return;
    const id = hit.getAttribute("data-project");
    if (id) openDrawer(id);
  });

  $$(".pcard").forEach((card) => {
    card.addEventListener("click", () => openDrawer(card.dataset.project));
  });

  /* ------------------------------------------------------------------------
     Section nav
     ------------------------------------------------------------------------ */

  const navLinks = $$(".nav a");
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((section) => navObserver.observe(section));
  }

  /* ------------------------------------------------------------------------
     Reveal below-the-fold sections
     ------------------------------------------------------------------------ */

  const revealSections = $$("main section").filter((section) => !section.classList.contains("arch-hero"));
  revealSections.forEach((section) => section.classList.add("reveal"));

  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.06 }
    );
    revealSections.forEach((section) => revealObserver.observe(section));
  } else {
    revealSections.forEach((section) => section.classList.add("visible"));
  }

  /* ------------------------------------------------------------------------
     Copy email / year
     ------------------------------------------------------------------------ */

  const toast = $("#toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  const copyBtn = $("#copy-email");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = "suzhe52@foxmail.com";
      try {
        await navigator.clipboard.writeText(email);
        showToast("邮箱已复制：" + email);
      } catch {
        const input = document.createElement("textarea");
        input.value = email;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
        showToast("邮箱已复制：" + email);
      }
    });
  }

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();

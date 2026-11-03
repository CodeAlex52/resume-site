(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  const esc = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  /* ------------------------------------------------------------------------
     Project cards
     ------------------------------------------------------------------------ */

  function detailMarkup(project, index) {
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

  function projectMarkup(project) {
    const metrics = project.metrics
      .map(
        (m) => `
        <div class="metric">
          <strong>${esc(m.v)}</strong>
          <span>${esc(m.l)}</span>
        </div>`
      )
      .join("");

    const nodes = project.nodes
      .map(
        (node, i) => `
        <button class="node${i === 0 ? " active" : ""}" type="button"
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

    const bullets = project.bullets.map((b) => `<li>${esc(b)}</li>`).join("");
    const stack = project.stack.map((s) => `<span>${esc(s)}</span>`).join("");

    return `
      <article class="project" id="${esc(project.id)}" style="--accent:${esc(project.accent)}">
        <div class="project-head">
          <div>
            <div class="project-title-row">
              <span class="project-num">${esc(project.num)}</span>
              <h4>${esc(project.name)}</h4>
            </div>
            <p class="project-role"><span>${esc(project.role)}</span></p>
          </div>
          <p class="project-date">${esc(project.period)}</p>
        </div>

        <p class="project-desc">${esc(project.desc)}</p>

        <div class="metrics">${metrics}</div>

        <div class="flow-label">
          <span>RUNTIME / 运行链路</span>
          <em>点击节点查看实现细节</em>
        </div>
        <div class="flow-wrap">
          <div class="flow" role="group" aria-label="${esc(project.short)} 运行链路">${nodes}</div>
        </div>
        <div class="node-detail" data-detail="${esc(project.id)}" aria-live="polite">
          ${detailMarkup(project, 0)}
        </div>

        <ul class="project-points">${bullets}</ul>

        <div class="evidence">
          <b>EVIDENCE</b>
          <span>${esc(project.evidence)}</span>
        </div>

        <div class="project-stack">${stack}</div>
      </article>
    `;
  }

  const projectList = $("#project-list");
  if (projectList && typeof PROJECTS !== "undefined") {
    projectList.innerHTML = PROJECTS.map(projectMarkup).join("");

    projectList.addEventListener("click", (event) => {
      const node = event.target.closest(".node");
      if (!node) return;

      const projectId = node.dataset.project;
      const index = Number(node.dataset.index);
      const project = PROJECTS.find((p) => p.id === projectId);
      if (!project) return;

      const flow = node.closest(".flow");
      flow.querySelectorAll(".node").forEach((n) => {
        n.classList.toggle("active", n === node);
        n.setAttribute("aria-pressed", n === node ? "true" : "false");
      });

      const detail = projectList.querySelector(`[data-detail="${projectId}"]`);
      if (detail) detail.innerHTML = detailMarkup(project, index);
    });
  }

  /* ------------------------------------------------------------------------
     Section nav — highlight the section currently in view
     ------------------------------------------------------------------------ */

  const navLinks = [...document.querySelectorAll(".nav a")];
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
      { rootMargin: "-20% 0px -68% 0px", threshold: 0 }
    );
    sections.forEach((section) => navObserver.observe(section));
  }

  /* ------------------------------------------------------------------------
     Reveal sections on scroll
     ------------------------------------------------------------------------ */

  const revealEls = [...document.querySelectorAll(".reveal")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ------------------------------------------------------------------------
     Copy email
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

  /* ------------------------------------------------------------------------
     Misc
     ------------------------------------------------------------------------ */

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();

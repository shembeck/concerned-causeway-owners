(function () {
  const links = window.CCO_LINKS || {};

  document.querySelectorAll("[data-link]").forEach(function (el) {
    const key = el.getAttribute("data-link");
    const href = links[key];
    if (!href) return;
    el.setAttribute("href", href);
    if (/^https?:\/\//i.test(href)) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
      mobileNav.hidden = isOpen;
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open menu");
        mobileNav.hidden = true;
      });
    });
  }

  initProxyForm();
  initOverviewLinks();
  if (window.CCO && window.CCO.initPublicSessions) {
    window.CCO.initPublicSessions();
  }
})();

function initOverviewLinks() {
  document.querySelectorAll(".overview-link[data-issue]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      const issue = link.getAttribute("data-issue");
      const detail = document.querySelector('[data-issue="' + issue + '"].issue-card');
      if (!detail) return;

      event.preventDefault();
      detail.open = true;
      detail.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function initProxyForm() {
  const form = document.getElementById("proxy-form-el");
  const downloadBtn = document.getElementById("download-proxy");
  const printBtn = document.getElementById("print-proxy");
  const dateInput = document.getElementById("proxy-date");
  const errorEl = document.getElementById("form-error");
  const printRoot = document.getElementById("print-root");

  if (!form || (!downloadBtn && !printBtn)) {
    return;
  }

  if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  const owner1Input = document.getElementById("owner-name-1");
  const owner2Input = document.getElementById("owner-name-2");
  const printedInput = document.getElementById("printed-name");

  function syncPrintedName() {
    if (!printedInput || printedInput.value.trim()) return;
    const names = [owner1Input, owner2Input]
      .map(function (el) { return el && el.value.trim(); })
      .filter(Boolean);
    if (names.length) {
      printedInput.value = names.join(" / ");
    }
  }

  if (owner1Input) owner1Input.addEventListener("blur", syncPrintedName);
  if (owner2Input) owner2Input.addEventListener("blur", syncPrintedName);

  if (downloadBtn) {
    downloadBtn.addEventListener("click", async function () {
      const data = collectFormData();
      if (!data) return;

      downloadBtn.disabled = true;
      const originalLabel = downloadBtn.textContent;
      downloadBtn.textContent = "Preparing PDF…";

      try {
        if (!window.CCO || !window.CCO.downloadProxyPdf) {
          throw new Error("PDF generator is not available. Please refresh and try again.");
        }
        await window.CCO.downloadProxyPdf(data);
      } catch (err) {
        showError(err.message || "Could not generate the proxy PDF.");
      } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalLabel;
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", function () {
      const data = collectFormData();
      if (!data) return;

      printRoot.innerHTML = buildPrintHtml(data);

      document.body.classList.add("printing-proxy");
      window.print();
      document.body.classList.remove("printing-proxy");
    });
  }

  function collectFormData() {
    hideError();

    const owner1 = val("owner-name-1");
    const owner2 = val("owner-name-2");
    const printedName = val("printed-name");
    const phone = val("proxy-phone");
    const email = val("proxy-email");
    const date = val("proxy-date");
    const note = val("deed-note");

    if (!owner1) { showError("Please enter at least one owner name."); return null; }
    if (!printedName) { showError("Please enter the printed name(s)."); return null; }
    if (!phone) { showError("Please enter your phone number."); return null; }
    if (!email) { showError("Please enter your email address."); return null; }
    if (!date) { showError("Please select the date."); return null; }

    const units = collectUnits();
    if (!units.length) { showError("Please enter at least one unit and week."); return null; }

    return {
      owner1: owner1,
      owner2: owner2,
      ownerLine: owner2 ? owner1 + " / " + owner2 : owner1,
      printedName: printedName,
      phone: phone,
      email: email,
      date: formatDate(date),
      note: note,
      units: units,
    };
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function collectUnits() {
    const units = [];
    for (let i = 1; i <= 4; i += 1) {
      const unit = val("unit-" + i);
      const week = val("week-" + i);
      const schedule = form.querySelector('input[name="schedule-' + i + '"]:checked');
      if (unit || week) {
        units.push({
          unit: unit || "____",
          week: week || "____",
          schedule: schedule ? schedule.value : "____",
        });
      }
    }
    return units;
  }

  function formatDate(iso) {
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return parts[1] + "/" + parts[2] + "/" + parts[0];
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
    errorEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideError() {
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
  }

  function buildPrintHtml(data) {
    const ownerBlank =
      '<span class="print-line">' + escapeHtml(data.owner1 || "") + "</span>/" +
      '<span class="print-line">' + escapeHtml(data.owner2 || "") + "</span>";

    const unitSlots = [0, 1, 2, 3].map(function (i) {
      const u = data.units[i] || { unit: "", week: "", schedule: "" };
      return (
        "Unit <span class=\"print-line print-line-sm\">" + escapeHtml(u.unit || "") + "</span>, " +
        "week<span class=\"print-line print-line-sm\">" + escapeHtml(u.week || "") + "</span> " +
        scheduleMark(u.schedule)
      );
    });

    const noteBlock = data.note
      ? "<p><strong>Note:</strong> " + escapeHtml(data.note) + "</p>"
      : "";

    return (
      '<div class="print-doc">' +
        "<h1>PROXY</h1>" +
        '<p class="print-sub"><strong>CAUSEWAY ON GULL ASSOCIATION, INC.</strong> (&ldquo;Association&rdquo;)</p>' +
        '<p class="print-note">NOTE: Name and signature of only one owner is required. Additional owners&rsquo; signatures are optional.</p>' +
        "<p>I, " + ownerBlank + ", owner(s) of:</p>" +
        '<p class="print-units">' + unitSlots[0] + " **** " + unitSlots[1] + "<br>" +
          unitSlots[2] + " **** " + unitSlots[3] + "</p>" +
        "<p>being a Member of the Association, under the provisions of Article II, Section 7 of the Association&rsquo;s By-laws, do hereby grant my/our proxy, with full power of substitution, to the following, to represent me/us and to exercise all powers to vote and act on my/our behalf at any regular or special meeting of the Members of the Association:</p>" +
        '<p class="print-proxy-chain">' +
          "<strong>BRENN FROMM</strong> of CORCORAN, MN<br>" +
          "Or, in her Absence, to<br>" +
          "<strong>JIM SMITH</strong> of EAST BETHEL, MN<br>" +
          "Or, in his Absence, to<br>" +
          "<strong>AMANDA KUJALA</strong> of HIBBING, MN<br>" +
          "Or, in her Absence, to<br>" +
          "<strong>RANDY WASKUL</strong> of DALTON, GA<br>" +
          "Or, in his Absence, to<br>" +
          "<strong>SUE BRENNAN</strong> of MINNEAPOLIS, MN" +
        "</p>" +
        "<p>All prior proxies are hereby revoked. This Proxy shall remain in effect until the earliest of the following events:</p>" +
        "<ol>" +
          "<li>I revoke it in writing, or attend and vote at any meeting for which this proxy is in effect;</li>" +
          "<li>Twenty-four months after the date I signed this proxy;</li>" +
          "<li>I am no longer an owner of an Interval Interest, as defined in the Declaration of Covenants, Conditions and Restrictions for Interval Ownership of Causeway on Gull.</li>" +
        "</ol>" +
        '<div class="sig-block">' +
          "<div><span class=\"print-line\">" + escapeHtml(data.date) + "</span><br>(Date)</div>" +
          '<div><span class="print-line print-line-signature">&nbsp;</span><br>(Signature of Owner(s))</div>' +
        "</div>" +
        "<p><span class=\"print-line\">" + escapeHtml(data.printedName) + "</span><br>Printed Name(s)</p>" +
        '<p class="print-warn">PLEASE DO NOT SIGN ANY OTHER PROXIES YOU MAY RECEIVE (IE FROM THE BOARD OR CAPITAL VACATIONS) ONCE YOU SUBMIT THIS ONE TO YOUR FELLOW OWNERS AT THE ADDRESS LISTED BELOW.</p>' +
        "<p>** If the owner name(s) on your deed are outdated or not consistent with your maintenance fee invoice was addressed to you, please include a note with your proxy, and separately, please contact Causeway on Gull at 218-963-3675 to make those updates.</p>" +
        noteBlock +
        "<p>Mail this proxy, and any donation you&rsquo;d like to make toward the cost of the Concerned Causeway Owners&rsquo; mailings and other expenses incurred as we advocate for fellow owners, as soon as possible to:<br>Elaine Dosch, PO Box 464, Devils Lake ND 58301</p>" +
        "<p>Or scan and email this signed form and your contact info to: info@causewayongullowners.com</p>" +
        "<p>Questions, contact Jim Smith at 612-221-2028 or Brenn Fromm at 763.245.9829 (call or text, preference for text if possible)</p>" +
        "<p>Phone # <span class=\"print-line\">" + escapeHtml(data.phone) + "</span> &nbsp;&nbsp; Email Address: <span class=\"print-line\">" + escapeHtml(data.email) + "</span></p>" +
      "</div>"
    );
  }

  function scheduleMark(schedule) {
    return ["Annual", "Even", "Odd"].map(function (opt) {
      if (schedule === opt) {
        return '<span class="print-circled">' + opt + "</span>";
      }
      return opt;
    }).join(", ") + " (circle one)";
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

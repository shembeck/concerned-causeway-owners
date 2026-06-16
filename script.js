(function () {
  const links = window.CCO_LINKS || {};

  document.querySelectorAll("[data-link]").forEach(function (el) {
    const key = el.getAttribute("data-link");
    if (links[key]) {
      el.setAttribute("href", links[key]);
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
})();

function initProxyForm() {
  const form = document.getElementById("proxy-form-el");
  const canvas = document.getElementById("signature-pad");
  const printBtn = document.getElementById("print-proxy");
  const submitBtn = document.getElementById("submit-proxy");
  const clearBtn = document.getElementById("clear-signature");
  const dateInput = document.getElementById("proxy-date");
  const errorEl = document.getElementById("form-error");
  const successEl = document.getElementById("form-success");
  const printRoot = document.getElementById("print-root");
  const submitConfig = window.CCO_SUBMIT || {};
  const onlineNote = document.getElementById("online-submit-note");
  const submitHelp = document.getElementById("submit-help");

  if (!form || !canvas || !printBtn) {
    return;
  }

  if (submitConfig.enabled && submitBtn) {
    submitBtn.hidden = false;
    if (onlineNote) onlineNote.hidden = false;
    if (submitHelp) {
      submitHelp.textContent =
        "Submit online for instant delivery, or print/save as PDF to mail or email yourself.";
    }
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

  const ctx = canvas.getContext("2d");
  let drawing = false;
  let hasSignature = false;

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const saved = hasSignature ? canvas.toDataURL("image/png") : null;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (saved) {
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = saved;
    }
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    };
  }

  function startDraw(event) {
    event.preventDefault();
    drawing = true;
    hasSignature = true;
    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function draw(event) {
    if (!drawing) return;
    event.preventDefault();
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function endDraw() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", endDraw);

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasSignature = false;
    });
  }

  printBtn.addEventListener("click", function () {
    const data = collectFormData();
    if (!data) return;

    printRoot.innerHTML = buildPrintHtml({
      ownerLine: data.ownerLine,
      units: data.units,
      date: formatDate(data.date),
      printedName: data.printedName,
      phone: data.phone,
      email: data.email,
      note: data.note,
      signatureData: data.signatureData,
    });

    document.body.classList.add("printing-proxy");
    window.print();
    document.body.classList.remove("printing-proxy");
  });

  if (submitBtn) {
    submitBtn.addEventListener("click", function () {
      const data = collectFormData();
      if (data) {
        submitProxyOnline(submitConfig, data);
      }
    });
  }

  function collectFormData() {
    hideMessages();

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
    if (!hasSignature) { showError("Please sign in the signature box."); return null; }

    const units = collectUnits();
    if (!units.length) { showError("Please enter at least one unit and week."); return null; }

    return {
      owner1: owner1,
      owner2: owner2,
      ownerLine: owner2 ? owner1 + " / " + owner2 : owner1,
      printedName: printedName,
      phone: phone,
      email: email,
      date: date,
      note: note,
      units: units,
      signatureData: canvas.toDataURL("image/png"),
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

  function showSuccess(message) {
    if (!successEl) return;
    successEl.textContent = message;
    successEl.hidden = false;
    successEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideMessages() {
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
    if (successEl) {
      successEl.hidden = true;
      successEl.textContent = "";
    }
  }

  function buildPrintHtml(data) {
    const unitRows = data.units.map(function (u) {
      return (
        "<tr><td>Unit " + escapeHtml(u.unit) + ", Week " + escapeHtml(u.week) + ", " +
        escapeHtml(u.schedule) + "</td></tr>"
      );
    }).join("");

    const noteBlock = data.note
      ? "<p><strong>Note:</strong> " + escapeHtml(data.note) + "</p>"
      : "";

    return (
      '<div class="print-doc">' +
        "<h1>PROXY</h1>" +
        '<p class="print-sub"><strong>CAUSEWAY ON GULL ASSOCIATION, INC.</strong> (&ldquo;Association&rdquo;)</p>' +
        '<p class="print-note">NOTE: Name and signature of only one owner is required. Additional owners&rsquo; signatures are optional.</p>' +
        "<p>I, <span class=\"print-line\">" + escapeHtml(data.ownerLine) + "</span>, owner(s) of:</p>" +
        '<table class="units-table"><tbody>' + unitRows + "</tbody></table>" +
        "<p>being a Member of the Association, under the provisions of Article II, Section 7 of the Association&rsquo;s By-laws, do hereby grant my/our proxy, with full power of substitution, to the following, to represent me/us and to exercise all powers to vote and act on my/our behalf at any regular or special meeting of the Members of the Association:</p>" +
        "<ol>" +
          "<li><strong>BRENN FROMM</strong> of CORCORAN, MN</li>" +
          "<li>Or, in her Absence, to <strong>JIM SMITH</strong> of EAST BETHEL, MN</li>" +
          "<li>Or, in his Absence, to <strong>AMANDA KUJALA</strong> of HIBBING, MN</li>" +
          "<li>Or, in her Absence, to <strong>RANDY WASKUL</strong> of DALTON, GA</li>" +
          "<li>Or, in his Absence, to <strong>SUE BRENNAN</strong> of MINNEAPOLIS, MN</li>" +
        "</ol>" +
        "<p>All prior proxies are hereby revoked. This Proxy shall remain in effect until the earliest of the following events: I revoke it in writing, or attend and vote at any meeting for which this proxy is in effect; twenty-four months after the date I signed this proxy; I am no longer an owner of an Interval Interest, as defined in the Declaration of Covenants, Conditions and Restrictions for Interval Ownership of Causeway on Gull.</p>" +
        '<div class="sig-block">' +
          "<div><strong>Date</strong><br><span class=\"print-line\">" + escapeHtml(data.date) + "</span></div>" +
          "<div><strong>Signature of Owner(s)</strong><br><img class=\"sig-img\" src=\"" + data.signatureData + "\" alt=\"Signature\"></div>" +
        "</div>" +
        "<p><strong>Printed Name(s):</strong> <span class=\"print-line\">" + escapeHtml(data.printedName) + "</span></p>" +
        "<p><strong>Phone:</strong> <span class=\"print-line\">" + escapeHtml(data.phone) + "</span> &nbsp;&nbsp; <strong>Email:</strong> <span class=\"print-line\">" + escapeHtml(data.email) + "</span></p>" +
        noteBlock +
        '<p class="print-warn">PLEASE DO NOT SIGN ANY OTHER PROXIES YOU MAY RECEIVE (I.E. FROM THE BOARD OR CAPITAL VACATIONS) ONCE YOU SUBMIT THIS ONE TO YOUR FELLOW OWNERS.</p>' +
        '<p class="print-footer">Mail this proxy to: Elaine Dosch, PO Box 464, Devils Lake ND 58301 — or scan and email to info@causewayongullowners.com</p>' +
      "</div>"
    );
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

async function submitProxyOnline(config, data) {
  const form = document.getElementById("proxy-form-el");
  const submitBtn = document.getElementById("submit-proxy");
  const errorEl = document.getElementById("form-error");
  const successEl = document.getElementById("form-success");

  if (!config.enabled || !config.supabaseUrl || !config.supabaseAnonKey) {
    if (errorEl) {
      errorEl.textContent = "Online submission is not configured yet. Please print and mail your proxy, or email info@causewayongullowners.com.";
      errorEl.hidden = false;
    }
    return;
  }

  if (successEl) successEl.hidden = true;

  const submissionId = crypto.randomUUID();
  const signaturePath = submissionId + ".png";
  const baseUrl = config.supabaseUrl.replace(/\/$/, "");
  const headers = {
    apikey: config.supabaseAnonKey,
    Authorization: "Bearer " + config.supabaseAnonKey,
  };

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";
  }

  try {
    const signatureBlob = dataUrlToBlob(data.signatureData);
    const uploadRes = await fetch(baseUrl + "/storage/v1/object/proxy-signatures/" + signaturePath, {
      method: "POST",
      headers: Object.assign({}, headers, { "Content-Type": "image/png", "x-upsert": "false" }),
      body: signatureBlob,
    });

    if (!uploadRes.ok) {
      throw new Error("Could not upload signature. Please try printing instead.");
    }

    const insertRes = await fetch(baseUrl + "/rest/v1/proxy_submissions", {
      method: "POST",
      headers: Object.assign({}, headers, {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify({
        id: submissionId,
        owner_name_1: data.owner1,
        owner_name_2: data.owner2 || null,
        units: data.units,
        signed_date: data.date,
        printed_name: data.printedName,
        phone: data.phone,
        email: data.email,
        deed_note: data.note || null,
        signature_path: signaturePath,
      }),
    });

    if (!insertRes.ok) {
      throw new Error("Could not save proxy. Please print and mail instead.");
    }

    if (config.notifyFunctionName) {
      await fetch(baseUrl + "/functions/v1/" + config.notifyFunctionName, {
        method: "POST",
        headers: Object.assign({}, headers, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          submissionId: submissionId,
          ownerName1: data.owner1,
          ownerName2: data.owner2 || null,
          units: data.units,
          signedDate: data.date,
          printedName: data.printedName,
          phone: data.phone,
          email: data.email,
          deedNote: data.note || null,
          signaturePath: signaturePath,
        }),
      }).catch(function () {
        // DB save succeeded; email notification is best-effort.
      });
    }

    if (successEl) {
      successEl.textContent =
        "Your proxy was submitted successfully (ID: " + submissionId.slice(0, 8) + "). " +
        "The Concerned Owners group has been notified. You can still print a copy for your records.";
      successEl.hidden = false;
    }

    form?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message || "Submission failed. Please print and mail your proxy instead.";
      errorEl.hidden = false;
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Proxy Online";
    }
  }
}

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)[1];
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

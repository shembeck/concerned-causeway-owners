(function () {
  const loginPanel = document.getElementById("login-panel");
  const dashboardPanel = document.getElementById("dashboard-panel");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const adminUser = document.getElementById("admin-user");
  const messageEl = document.getElementById("admin-message");
  const sessionsBody = document.getElementById("sessions-table-body");
  const sessionFormPanel = document.getElementById("session-form-panel");
  const sessionForm = document.getElementById("session-form");
  const sessionFormTitle = document.getElementById("session-form-title");
  const newSessionBtn = document.getElementById("new-session-btn");
  const cancelSessionBtn = document.getElementById("cancel-session-btn");
  const deleteSessionBtn = document.getElementById("delete-session-btn");
  const sessionType = document.getElementById("session-type");
  const zoomUrlGroup = document.getElementById("zoom-url-group");
  const locationGroup = document.getElementById("location-group");

  let client = null;

  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = "admin-message admin-message-" + type;
    messageEl.hidden = false;
  }

  function hideMessage() {
    if (messageEl) messageEl.hidden = true;
  }

  function setLoggedIn(user) {
    loginPanel.hidden = true;
    dashboardPanel.hidden = false;
    logoutBtn.hidden = false;
    adminUser.textContent = "Signed in as " + user.email;
  }

  function setLoggedOut() {
    loginPanel.hidden = false;
    dashboardPanel.hidden = true;
    logoutBtn.hidden = true;
    sessionFormPanel.hidden = true;
    adminUser.textContent = "";
  }

  function toggleTypeFields() {
    const isZoom = sessionType.value === "zoom";
    zoomUrlGroup.hidden = !isZoom;
    locationGroup.hidden = isZoom;
  }

  function toCentralISO(dateStr, timeStr) {
    const localIso = dateStr + "T" + timeStr + ":00";
    let utc = new Date(localIso + "Z");

    for (let i = 0; i < 3; i++) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).formatToParts(utc);

      const get = function (type) {
        return parts.find(function (p) { return p.type === type; }).value;
      };

      const formatted =
        get("year") + "-" + get("month") + "-" + get("day") + "T" +
        get("hour") + ":" + get("minute") + ":" + get("second");

      if (formatted === localIso) {
        break;
      }

      utc = new Date(
        utc.getTime() + (new Date(localIso + "Z").getTime() - new Date(formatted + "Z").getTime())
      );
    }

    return utc.toISOString();
  }

  function fromCentralISO(iso) {
    const date = new Date(iso);
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    const timeStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Chicago",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    return { dateStr: dateStr, timeStr: timeStr };
  }

  async function loadSessions() {
    const { data, error } = await client
      .from("zoom_sessions")
      .select("*")
      .order("starts_at", { ascending: true });

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    if (!data.length) {
      sessionsBody.innerHTML = '<tr><td colspan="5">No sessions yet. Click Add Session.</td></tr>';
      return;
    }

    sessionsBody.innerHTML = data.map(function (session) {
      const when = window.CCO.formatSessionDateTime(session.starts_at);
      const badges =
        '<span class="session-badge ' + (session.is_active ? "session-badge-active" : "session-badge-inactive") + '">' +
        (session.is_active ? "Active" : "Hidden") + "</span>" +
        (session.is_featured ? '<span class="session-badge session-badge-featured">Featured</span>' : "");

      return (
        "<tr>" +
          "<td>" + when + "</td>" +
          "<td>" + escapeHtml(session.title) + "</td>" +
          "<td>" + (session.session_type === "in_person" ? "In-Person" : "Zoom") + "</td>" +
          "<td>" + badges + "</td>" +
          '<td><button class="btn btn-secondary btn-sm" type="button" data-edit-id="' + session.id + '">Edit</button></td>' +
        "</tr>"
      );
    }).join("");

    sessionsBody.querySelectorAll("[data-edit-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openEditForm(btn.getAttribute("data-edit-id"), data);
      });
    });
  }

  function openNewForm() {
    sessionForm.reset();
    document.getElementById("session-id").value = "";
    document.getElementById("session-active").checked = true;
    document.getElementById("session-featured").checked = false;
    sessionFormTitle.textContent = "Add Session";
    deleteSessionBtn.hidden = true;
    sessionFormPanel.hidden = false;
    toggleTypeFields();
  }

  function openEditForm(id, sessions) {
    const session = sessions.find(function (s) { return s.id === id; });
    if (!session) return;

    const parts = fromCentralISO(session.starts_at);
    document.getElementById("session-id").value = session.id;
    document.getElementById("session-title").value = session.title;
    document.getElementById("session-type").value = session.session_type;
    document.getElementById("session-date").value = parts.dateStr;
    document.getElementById("session-time").value = parts.timeStr;
    document.getElementById("session-zoom-url").value = session.zoom_url || "";
    document.getElementById("session-location").value = session.location || "";
    document.getElementById("session-description").value = session.description || "";
    document.getElementById("session-featured").checked = !!session.is_featured;
    document.getElementById("session-active").checked = !!session.is_active;

    sessionFormTitle.textContent = "Edit Session";
    deleteSessionBtn.hidden = false;
    sessionFormPanel.hidden = false;
    toggleTypeFields();
  }

  async function saveSession(event) {
    event.preventDefault();
    hideMessage();

    const id = document.getElementById("session-id").value;
    const payload = {
      title: document.getElementById("session-title").value.trim(),
      session_type: sessionType.value,
      starts_at: toCentralISO(
        document.getElementById("session-date").value,
        document.getElementById("session-time").value
      ),
      zoom_url: sessionType.value === "zoom" ? document.getElementById("session-zoom-url").value.trim() : null,
      location: sessionType.value === "in_person" ? document.getElementById("session-location").value.trim() : null,
      description: document.getElementById("session-description").value.trim() || null,
      is_featured: document.getElementById("session-featured").checked,
      is_active: document.getElementById("session-active").checked,
    };

    if (payload.session_type === "zoom" && !payload.zoom_url) {
      showMessage("Zoom sessions require a Zoom link.", "error");
      return;
    }

    if (payload.is_featured) {
      await client.from("zoom_sessions").update({ is_featured: false }).neq("id", id || "00000000-0000-0000-0000-000000000000");
    }

    let error;
    if (id) {
      ({ error } = await client.from("zoom_sessions").update(payload).eq("id", id));
    } else {
      ({ error } = await client.from("zoom_sessions").insert(payload));
    }

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    showMessage(id ? "Session updated." : "Session added.", "success");
    sessionFormPanel.hidden = true;
    await loadSessions();
  }

  async function deleteSession() {
    const id = document.getElementById("session-id").value;
    if (!id || !confirm("Delete this session permanently?")) return;

    const { error } = await client.from("zoom_sessions").delete().eq("id", id);
    if (error) {
      showMessage(error.message, "error");
      return;
    }

    showMessage("Session deleted.", "success");
    sessionFormPanel.hidden = true;
    await loadSessions();
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function init() {
    client = window.CCO.getSupabaseClient();
    if (!client) {
      showMessage("Supabase is not configured. Set CCO_SUPABASE in config.js first.", "error");
      return;
    }

    const { data: sessionData } = await client.auth.getSession();
    if (sessionData.session) {
      setLoggedIn(sessionData.session.user);
      await loadSessions();
    }

    client.auth.onAuthStateChange(async function (event, session) {
      if (session) {
        setLoggedIn(session.user);
        await loadSessions();
      } else {
        setLoggedOut();
      }
    });

    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      hideMessage();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      const { error } = await client.auth.signInWithPassword({ email: email, password: password });
      if (error) {
        showMessage(error.message, "error");
      }
    });

    logoutBtn.addEventListener("click", async function () {
      await client.auth.signOut();
      hideMessage();
    });

    newSessionBtn.addEventListener("click", openNewForm);
    cancelSessionBtn.addEventListener("click", function () {
      sessionFormPanel.hidden = true;
    });
    deleteSessionBtn.addEventListener("click", deleteSession);
    sessionForm.addEventListener("submit", saveSession);
    sessionType.addEventListener("change", toggleTypeFields);
  }

  init();
})();

(function () {
  const TZ = "America/Chicago";

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatSessionDate(iso) {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: TZ,
    }).format(date);
  }

  function formatSessionTime(iso) {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
      timeZoneName: "short",
    }).format(date);
  }

  function formatSessionDateTime(iso) {
    return formatSessionDate(iso) + " · " + formatSessionTime(iso);
  }

  function isTonight(iso) {
    const now = new Date();
    const session = new Date(iso);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    return fmt.format(now) === fmt.format(session);
  }

  function isLiveNow(iso) {
    const start = new Date(iso).getTime();
    const now = Date.now();
    return now >= start - 15 * 60 * 1000 && now <= start + 2 * 60 * 60 * 1000;
  }

  async function fetchUpcomingSessions() {
    const client = window.CCO.getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("zoom_sessions")
      .select("*")
      .eq("is_active", true)
      .gte("starts_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order("starts_at", { ascending: true });

    if (error) {
      console.warn("Could not load sessions:", error.message);
      return [];
    }
    return data || [];
  }

  function renderHeroSession(session) {
    const card = document.getElementById("hero-session");
    if (!card || !session) return;

    const tonight = isTonight(session.starts_at);
    const live = isLiveNow(session.starts_at);
    const label = live
      ? "Live now"
      : tonight
        ? "Tonight — " + formatSessionDate(session.starts_at)
        : "Up next — " + formatSessionDate(session.starts_at);

    const cta = session.session_type === "zoom" && session.zoom_url
      ? '<a class="btn btn-accent btn-block" href="' + escapeHtml(session.zoom_url) + '" target="_blank" rel="noopener noreferrer" id="hero-meeting-cta">Join Zoom</a>'
      : '<a class="btn btn-accent btn-block" href="#meetings" id="hero-meeting-cta">View sessions</a>';

    const footnote = session.session_type === "zoom"
      ? '<p class="sidebar-footnote">Please type your <strong>full name</strong> when signing in.</p>'
      : session.location
        ? '<p class="sidebar-footnote"><strong>Location:</strong> ' + escapeHtml(session.location) + "</p>"
        : "";

    card.innerHTML =
      '<p class="sidebar-label"><span class="live-dot" aria-hidden="true"></span> ' + escapeHtml(label) + "</p>" +
      '<h2 class="sidebar-title" id="urgent-heading">' + escapeHtml(session.title) + "</h2>" +
      '<p class="sidebar-text">' + escapeHtml(session.description || "Join fellow owners to learn more and ask questions.") + "</p>" +
      cta +
      footnote;

    card.classList.add("sidebar-card-session--active");
  }

  function renderMeetingGrid(sessions) {
    const grid = document.getElementById("meeting-grid");
    if (!grid) return;

    if (!sessions.length) {
      grid.innerHTML =
        '<article class="meeting-card">' +
          '<p class="meeting-date">Coming soon</p>' +
          "<h3>No sessions scheduled</h3>" +
          "<p>Check back soon or contact us for the next owner info session.</p>" +
          '<a class="btn btn-secondary" href="#contact">Contact us</a>' +
        "</article>";
      return;
    }

    grid.innerHTML = sessions.map(function (session, index) {
      const featured = index === 0 ? " featured" : "";
      const dateLine = formatSessionDateTime(session.starts_at);

      let action = "";
      if (session.session_type === "zoom" && session.zoom_url) {
        action = '<a class="btn btn-primary" href="' + escapeHtml(session.zoom_url) + '" target="_blank" rel="noopener noreferrer">Join Zoom</a>';
      } else if (session.location) {
        action = '<p class="meeting-location"><strong>Location:</strong> ' + escapeHtml(session.location) + "</p>";
      }

      return (
        '<article class="meeting-card' + featured + '">' +
          '<p class="meeting-date">' + escapeHtml(dateLine) + "</p>" +
          "<h3>" + escapeHtml(session.title) + "</h3>" +
          "<p>" + escapeHtml(session.description || "Join fellow owners to hear updates and ask questions.") + "</p>" +
          action +
        "</article>"
      );
    }).join("");
  }

  window.CCO.initPublicSessions = async function () {
    const sessions = await fetchUpcomingSessions();
    const featured = sessions.find(function (s) { return s.is_featured; }) || sessions[0];

    if (featured) {
      renderHeroSession(featured);
    }

    renderMeetingGrid(sessions);
  };

  window.CCO.formatSessionDateTime = formatSessionDateTime;
})();

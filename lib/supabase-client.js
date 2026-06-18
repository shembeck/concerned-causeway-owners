(function () {
  window.CCO = window.CCO || {};

  window.CCO.getSupabaseConfig = function () {
    const cfg = window.CCO_SUPABASE || {};
    if (!cfg.enabled || !cfg.url || !cfg.anonKey) {
      return null;
    }
    return {
      url: cfg.url.replace(/\/$/, ""),
      anonKey: cfg.anonKey,
    };
  };

  window.CCO.getSupabaseClient = function () {
    if (window.CCO._client) {
      return window.CCO._client;
    }
    const cfg = window.CCO.getSupabaseConfig();
    if (!cfg || !window.supabase) {
      return null;
    }
    window.CCO._client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return window.CCO._client;
  };

  window.CCO.getSupabaseHeaders = function (accessToken) {
    const cfg = window.CCO.getSupabaseConfig();
    if (!cfg) return null;
    const headers = {
      apikey: cfg.anonKey,
      Authorization: "Bearer " + (accessToken || cfg.anonKey),
    };
    return { cfg: cfg, headers: headers };
  };
})();

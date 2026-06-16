// Site links — update session/volunteer/issue detail URLs as needed.
window.CCO_LINKS = {
  proxy: "#proxy-form",
  sessions: "#meetings",
  volunteer: "#volunteer",
  financial: "#issues",
  violations: "#issues",
  elections: "#issues",
  fiduciary: "#issues",
  sales: "#issues",
  control: "#issues",
};

window.CCO_CONTACT = {
  email: "info@causewayongullowners.com",
  jimPhone: "612-221-2028",
  brennPhone: "763-245-9829",
  mailName: "Elaine Dosch",
  mailAddress: "PO Box 464, Devils Lake, ND 58301",
};

// Online proxy submission — set enabled: true after running supabase-setup.sql
// and deploying the notify-proxy edge function (see supabase/functions/notify-proxy/).
window.CCO_SUBMIT = {
  enabled: false,
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  notifyFunctionName: "notify-proxy",
  notifyEmail: "info@causewayongullowners.com",
};

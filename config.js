// Site links — update volunteer/issue detail URLs as needed.
window.CCO_LINKS = {
  proxy: "#proxy-form",
  sessions: "#meetings",
  volunteer: "#volunteer",
  financial: "#detail-financial",
  violations: "#detail-violations",
  elections: "#detail-elections",
  fiduciary: "#detail-fiduciary",
  sales: "#detail-sales",
  control: "#detail-control",
};

window.CCO_CONTACT = {
  email: "info@causewayongullowners.com",
  jimPhone: "612-221-2028",
  brennPhone: "763-245-9829",
  mailName: "Elaine Dosch",
  mailAddress: "PO Box 464, Devils Lake, ND 58301",
};

// Supabase — required for dynamic Zoom sessions and the admin dashboard (admin.html).
// 1. Run supabase-setup.sql in your Supabase SQL Editor
// 2. Enable Email auth in Supabase → Authentication → Providers
// 3. Create admin users matching emails in the admin_emails table
window.CCO_SUPABASE = {
  enabled: false,
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
};

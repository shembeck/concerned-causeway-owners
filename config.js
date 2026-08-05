// Site links — update volunteer/issue detail URLs as needed.
window.CCO_LINKS = {
  proxy: "#proxy-form",
  sessions: "https://docs.google.com/document/d/16msufxa87E0gazGYkAzFbg-4k5N8SvLrujSjmxARdig/edit?usp=sharing",
  volunteer: "https://docs.google.com/document/d/1jjrb9VZBicKhcH3z63mejIqzyjeFrNXy/edit?usp=sharing&ouid=114265533061361391314&rtpof=true&sd=true",
  financial: "https://docs.google.com/document/d/15BL4uhuqZUAvfqfGCKbwsMI9uQRjGjvvYKo3JNGMzME/edit?tab=t.0",
  violations: "https://docs.google.com/document/d/1j9TRVjUN2VXNo5gAJrE4quTUkOBbXQU-/edit",
  elections: "https://docs.google.com/document/d/19-m2TFltfAqsLU-SdE4S1OdyE2SngbgnBwq7tpNS-ks/edit?tab=t.0",
  fiduciary: "https://docs.google.com/document/d/1T0ccDrQTS9Izl4z9gaEzulW3ZA5JiG_Aozz6f3TxsV0/edit?tab=t.0",
  sales: "https://docs.google.com/document/d/1WMxk6kfTJVeqgIKooeXJwPF4RisBH2iVhgWKoKrakJM/edit?tab=t.0",
  control: "https://docs.google.com/document/d/1Aq9AoBEZDoTgj0KUZ2y8xVutiJG6dfcZCYkbH9yoY_4/edit?tab=t.0",
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

const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const email = "admin@example.com";
  const password = "Admin@123456";
  const passwordHash = await bcrypt.hash(password, 12);

  const { error } = await supabase.from("users").upsert(
    {
      email,
      password_hash: passwordHash,
      role: "super_admin",
      company_id: null,
    },
    {
      onConflict: "email",
    }
  );

  if (error) {
    throw error;
  }

  console.log("Admin user ready:");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
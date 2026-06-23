/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const companyName = process.argv[2];
  const email = process.argv[3];
  const password = process.argv[4];

  if (!companyName || !email || !password) {
    throw new Error(
      "Usage: node --env-file=.env.local scripts\\seed-company-user.js \"Company Name\" owner@example.com Password@123"
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("name", companyName)
    .single();

  if (companyError || !company) {
    throw new Error(`Could not find company: ${companyName}`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { error: userError } = await supabase.from("users").upsert(
    {
      company_id: company.id,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: "company_owner",
    },
    {
      onConflict: "email",
    }
  );

  if (userError) {
    throw userError;
  }

  console.log("Company user ready:");
  console.log(`Company: ${company.name}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

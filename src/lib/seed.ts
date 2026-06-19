import User from "@/models/User";

/**
 * Auto-creates primary admin from FROM_EMAIL env var on first DB connection.
 * Runs only when no user exists yet.
 */
export async function seedAdmin() {
  const adminEmail = process.env.FROM_EMAIL;
  if (!adminEmail) {
    throw new Error("FROM_EMAIL nie je nastavený v .env — nie je možné vytvoriť primárneho správcu.");
  }

  const count = await User.countDocuments();
  if (count > 0) return; // already seeded

  await User.create({
    email: adminEmail.toLowerCase().trim(),
    firstName: "Primárny",
    lastName: "správca",
    role: "admin",
    status: "active",
    companies: [],
  });

  console.log(`[seed] Primárny správca vytvorený: ${adminEmail}`);
}

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "super_admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
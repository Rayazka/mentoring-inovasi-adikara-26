import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { profile } = await requireSession();
  redirect(roleHome(profile.role));
}

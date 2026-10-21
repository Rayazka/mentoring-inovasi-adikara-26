import { requireSession } from "@/lib/auth/session";
import { signOut } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { profile } = await requireSession(["admin"]);
  return <main><h1>Home Admin</h1><p>Halo, {profile.full_name}.</p>
    <form action={signOut}><button type="submit">Keluar</button></form>
  </main>;
}

import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Middleware already redirects unauthenticated requests before they reach
  // here — this is a defense-in-depth check, not the primary guard.
  if (!session?.user) {
    redirect("/login");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const userLabel = session.user.name ?? session.user.email ?? "";

  return (
    <AppShell userLabel={userLabel} signOutAction={handleSignOut}>
      {children}
    </AppShell>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  const dashboardHref = profile?.role === "shelter" ? "/dashboard/shelter" : "/dashboard/donor";

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="w-full border-b h-16 flex items-center px-6 justify-between">
        <Link href="/" className="font-bold text-xl">SeeWhoNeeds</Link>
        <div className="flex gap-3 items-center">
          <Link href="/needs">
            <Button variant="ghost">Browse Needs</Button>
          </Link>
          {user ? (
            <>
              <Link href={dashboardHref}>
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/auth/logout">
                <Button variant="ghost">Log out</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline">Log in</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-6 py-24">
        <h1 className="text-5xl font-bold max-w-2xl leading-tight">
          Connect what you have with who needs it
        </h1>
        <p className="text-muted-foreground text-xl max-w-xl">
          SeeWhoNeeds helps donors give directly to shelters — no middlemen, no guessing what's needed, no profit taken.
        </p>
        <div className="flex gap-4 mt-4">
          <Link href="/needs">
            <Button size="lg">See who needs what</Button>
          </Link>
          <Link href={user ? dashboardHref : "/auth/sign-up"}>
            <Button size="lg" variant="outline">I have things to give</Button>
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col gap-3">
              <div className="text-4xl">🏠</div>
              <h3 className="font-semibold text-lg">Shelters post needs</h3>
              <p className="text-muted-foreground text-sm">Shelters list exactly what they need — clothing sizes, toiletries, food — with no address required.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-4xl">🔍</div>
              <h3 className="font-semibold text-lg">Donors browse & match</h3>
              <p className="text-muted-foreground text-sm">Search by category or city. See urgent needs first. Claim what you can donate.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-4xl">📦</div>
              <h3 className="font-semibold text-lg">Safe drop-off</h3>
              <p className="text-muted-foreground text-sm">Drop donations at a neutral public location. Shelter addresses stay private.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        SeeWhoNeeds · Built to help, not profit
      </footer>
    </main>
  );
}
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const URGENCY_COLOR = {
  urgent: "bg-red-100 text-red-700",
  soon: "bg-yellow-100 text-yellow-700",
  whenever: "bg-gray-100 text-gray-600",
};

const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export default async function DonorDashboard() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("donor_id", user.id)//.eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");
  if (profile.role === "shelter") redirect("/dashboard/shelter");

  // Their help commitments
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, status, created_at,
      needs (
        id, title, category, urgency,
        profiles!needs_shelter_id_fkey (display_name, city, state)
      )
    `)
    .eq("donor_id", user.id)
    .order("created_at", { ascending: false });

  // Their posted offerings
  const { data: offerings } = await supabase
    .from("offerings")
    .select("*")
    .eq("donor_id", user.id)//.eq("id", user.id)
    .order("created_at", { ascending: false });

  // Urgent needs to browse
  const { data: needs } = await supabase
    .from("needs")
    .select(`
      id, title, category, urgency,
      profiles!needs_shelter_id_fkey (display_name, city, state)
    `)
    .eq("is_active", true)
    .order("urgency", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b h-16 flex items-center px-6 justify-between sticky top-0 bg-background z-10">
        <Link href="/" className="font-bold text-xl">SeeWhoNeeds</Link>
        <div className="flex gap-3 items-center">
          <Link href="/needs"><Button variant="ghost" size="sm">Browse Needs</Button></Link>
          <Link href="/auth/logout"><Button variant="ghost" size="sm">Log out</Button></Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-10">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Hi, {profile.display_name} 👋</h1>
            <p className="text-muted-foreground mt-1">Manage your donations and offerings.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/donor/post-offering">
              <Button>+ Post what I have</Button>
            </Link>
          </div>
        </div>

        {/* My commitments */}
        <div>
          <h2 className="text-xl font-semibold mb-4">My help commitments ({matches?.length ?? 0})</h2>
          {matches && matches.length > 0 ? (
            <div className="flex flex-col gap-3">
              {matches.map((match) => {
                const need = match.needs as unknown as { id: string; title: string; category: string; urgency: string; profiles: { display_name: string; city: string; state: string } | null } | null;
                const shelter = need?.profiles;
                return (
                  <Card key={match.id}>
                    <CardContent className="py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{need?.title}</p>
                        <p className="text-sm text-muted-foreground">{shelter?.display_name} · {shelter?.city}, {shelter?.state}</p>
                        <p className="text-xs text-muted-foreground mt-1">{need?.category}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[match.status as keyof typeof STATUS_COLOR] ?? "bg-gray-100"}`}>
                          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                        </span>
                        <Link href={`/needs/${need?.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">View →</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground flex flex-col gap-3">
                <p>You haven't committed to help with anything yet.</p>
                <Link href="/needs" className="mx-auto">
                  <Button variant="outline">Browse needs</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* My offerings */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">What I'm offering ({offerings?.length ?? 0})</h2>
            <Link href="/dashboard/donor/post-offering">
              <Button variant="outline" size="sm">+ Add</Button>
            </Link>
          </div>
          {offerings && offerings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {offerings.map((offering) => (
                <Card key={offering.id}>
                  <CardContent className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{offering.title}</p>
                      <p className="text-sm text-muted-foreground">{offering.category} · {offering.condition} · Qty: {offering.quantity}</p>
                      {offering.description && <p className="text-xs text-muted-foreground mt-1">{offering.description}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${offering.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {offering.is_available ? "Available" : "Unavailable"}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground flex flex-col gap-3">
                <p>You haven't posted any offerings yet.</p>
                <Link href="/dashboard/donor/post-offering" className="mx-auto">
                  <Button variant="outline">Post what you have</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Browse urgent needs */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Urgent needs near you</h2>
            <Link href="/needs" className="text-sm text-muted-foreground hover:underline">See all →</Link>
          </div>
          <div className="flex flex-col gap-3">
            {needs?.map((need) => {
              const shelter = need.profiles as unknown as { display_name: string; city: string; state: string } | null;
              return (
                <Card key={need.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{need.title}</p>
                      <p className="text-sm text-muted-foreground">{shelter?.display_name} · {shelter?.city}, {shelter?.state}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${URGENCY_COLOR[need.urgency as keyof typeof URGENCY_COLOR]}`}>
                        {need.urgency.charAt(0).toUpperCase() + need.urgency.slice(1)}
                      </span>
                      <Link href={`/needs/${need.id}`}>
                        <Button size="sm">Help →</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

      </div>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground mt-auto">
        SeeWhoNeeds · Built to help, not profit
      </footer>
    </div>
  );
}
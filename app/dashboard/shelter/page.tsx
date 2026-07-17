import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ShelterDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "shelter") redirect("/dashboard/donor");

  const { data: needs } = await supabase
    .from("needs")
    .select("*")
    .eq("shelter_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b h-16 flex items-center px-6 justify-between sticky top-0 bg-background z-10">
        <Link href="/" className="font-bold text-xl">SeeWhoNeeds</Link>
        <Link href="/auth/logout">
          <Button variant="ghost" size="sm">Log out</Button>
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{profile.display_name}</h1>
            <p className="text-muted-foreground mt-1">Shelter Dashboard</p>
          </div>
          <Link href="/dashboard/shelter/post-need">
            <Button>+ Post a Need</Button>
          </Link>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Your Active Needs</h2>
          {needs && needs.length > 0 ? (
            <div className="flex flex-col gap-4">
              {needs.map((need) => (
                <Card key={need.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{need.title}</CardTitle>
                        <CardDescription>{need.category} · {need.condition_preference} · {need.urgency}</CardDescription>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${need.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {need.is_active ? "Active" : "Closed"}
                      </span>
                    </div>
                  </CardHeader>
                  {need.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{need.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>You haven't posted any needs yet.</p>
                <Link href="/dashboard/shelter/post-need">
                  <Button variant="outline" className="mt-4">Post your first need</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
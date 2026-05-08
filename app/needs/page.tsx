import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const URGENCY_COLOR = {
  urgent: "bg-red-100 text-red-700",
  soon: "bg-yellow-100 text-yellow-700",
  whenever: "bg-gray-100 text-gray-600",
};

const CONDITION_LABEL = {
  new_only: "New only",
  new_or_gently_used: "New or gently used",
  any: "Any condition",
};

const CATEGORIES = ["All", "Clothing", "Toiletries", "Food", "Bedding", "Furniture", "Baby Items", "Electronics", "Other"];

export default async function NeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; urgency?: string }>;
}) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  const selectedCategory = params.category || "All";
  const selectedUrgency = params.urgency || "all";

  let query = supabase
    .from("needs")
    .select(`
      id, title, description, category, condition_preference,
      urgency, quantity_needed, created_at, shelter_id,
      profiles!needs_shelter_id_fkey (display_name, city, state)
    `)
    .eq("is_active", true)
    .order("urgency", { ascending: false })
    .order("created_at", { ascending: false });

  if (selectedCategory !== "All") {
    query = query.eq("category", selectedCategory);
  }
  if (selectedUrgency !== "all") {
    query = query.eq("urgency", selectedUrgency);
  }

  const { data: needs } = await query;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="w-full border-b h-16 flex items-center px-6 justify-between sticky top-0 bg-background z-10">
        <Link href="/" className="font-bold text-xl">SeeWhoNeeds</Link>
        <div className="flex gap-3 items-center">
          {user ? (
            <Link href="/dashboard/shelter">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">What shelters need</h1>
          <p className="text-muted-foreground mt-1">
            Browse real needs posted by shelters in your area. No middlemen.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`/needs?category=${cat}&urgency=${selectedUrgency}`}
              >
                <button
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    selectedCategory === cat
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {cat}
                </button>
              </Link>
            ))}
          </div>

          {/* Urgency filter */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Urgency:</span>
            {[["all", "All"], ["urgent", "Urgent"], ["soon", "Soon"], ["whenever", "Whenever"]].map(([val, label]) => (
              <Link
                key={val}
                href={`/needs?category=${selectedCategory}&urgency=${val}`}
              >
                <button
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    selectedUrgency === val
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground -mb-4">
          {needs?.length ?? 0} need{needs?.length !== 1 ? "s" : ""} listed
        </p>

        {/* Needs list */}
        {needs && needs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {needs.map((need) => {
              const profile = need.profiles as unknown as { display_name: string; city: string; state: string } | null;
              return (
                <Card key={need.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg">{need.title}</CardTitle>
                        <CardDescription>
                          {profile?.display_name ?? "A shelter"} · {profile?.city}, {profile?.state}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${URGENCY_COLOR[need.urgency as keyof typeof URGENCY_COLOR]}`}>
                          {need.urgency.charAt(0).toUpperCase() + need.urgency.slice(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {need.category}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {need.description && (
                      <p className="text-sm text-muted-foreground">{need.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>📦 {CONDITION_LABEL[need.condition_preference as keyof typeof CONDITION_LABEL]}</span>
                        {need.quantity_needed && (
                          <span>🔢 Needs {need.quantity_needed}</span>
                        )}
                      </div>
                      {user ? (
                        <Link href={`/needs/${need.id}`}>
                          <Button size="sm">I can help →</Button>
                        </Link>
                      ) : (
                        <Link href={`/auth/sign-up`}>
                          <Button size="sm" variant="outline">Sign up to help</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground flex flex-col gap-3">
            <p className="text-lg">No needs found for this filter.</p>
            <p className="text-sm">Try a different category or check back later.</p>
            <Link href="/needs" className="mx-auto">
              <Button variant="outline">Clear filters</Button>
            </Link>
          </div>
        )}
      </div>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground mt-auto">
        SeeWhoNeeds · Built to help, not profit
      </footer>
    </div>
  );
}
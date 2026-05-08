import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Client component for the claim button
import ClaimButton from "./claim-button";

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

export default async function NeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role, display_name").eq("id", user.id).single()
    : { data: null };

  // Fetch the need with shelter info
  const { data: need } = await supabase
    .from("needs")
    .select(`
      id, title, description, category, condition_preference,
      urgency, quantity_needed, is_active, created_at, shelter_id,
      profiles!needs_shelter_id_fkey (display_name, city, state)
    `)
    .eq("id", id)
    .single();

  if (!need) notFound();

  const shelter = need.profiles as unknown as {
    display_name: string;
    city: string;
    state: string;
  } | null;

  // Check if this donor has already claimed this need
  const { data: existingMatch } = user
    ? await supabase
        .from("matches")
        .select("id, status")
        .eq("need_id", id)
        .eq("donor_id", user.id)
        .single()
    : { data: null };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="w-full border-b h-16 flex items-center px-6 justify-between sticky top-0 bg-background z-10">
        <Link href="/" className="font-bold text-xl">SeeWhoNeeds</Link>
        <div className="flex gap-3 items-center">
          <Link href="/needs">
            <Button variant="ghost" size="sm">← Back to needs</Button>
          </Link>
          {user ? (
            <Link href="/auth/logout">
              <Button variant="ghost" size="sm">Log out</Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link href="/auth/sign-up"><Button size="sm">Sign up</Button></Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-6 py-10 flex flex-col gap-6">

        {/* Status badge */}
        {!need.is_active && (
          <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-md">
            This need has been closed and is no longer accepting donations.
          </div>
        )}

        {/* Main card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">{need.title}</CardTitle>
                <CardDescription className="text-base">
                  {shelter?.display_name} · {shelter?.city}, {shelter?.state}
                </CardDescription>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${URGENCY_COLOR[need.urgency as keyof typeof URGENCY_COLOR]}`}>
                {need.urgency.charAt(0).toUpperCase() + need.urgency.slice(1)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {need.description && (
              <p className="text-muted-foreground">{need.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 py-4 border-y">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Category</p>
                <p className="font-medium">{need.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Condition needed</p>
                <p className="font-medium">{CONDITION_LABEL[need.condition_preference as keyof typeof CONDITION_LABEL]}</p>
              </div>
              {need.quantity_needed && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Quantity needed</p>
                  <p className="font-medium">{need.quantity_needed}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Location</p>
                <p className="font-medium">{shelter?.city}, {shelter?.state}</p>
              </div>
            </div>

            {/* CTA section */}
            {!need.is_active ? (
              <p className="text-muted-foreground text-sm text-center">This need is no longer active.</p>
            ) : !user ? (
              <div className="flex flex-col gap-3 items-center text-center py-2">
                <p className="text-muted-foreground">Sign up or log in to help with this need.</p>
                <div className="flex gap-3">
                  <Link href="/auth/sign-up"><Button>Create an account</Button></Link>
                  <Link href="/auth/login"><Button variant="outline">Log in</Button></Link>
                </div>
              </div>
            ) : profile?.role === "shelter" ? (
              <p className="text-muted-foreground text-sm text-center py-2">
                You're logged in as a shelter. Only donors can claim needs.
              </p>
            ) : existingMatch ? (
              <div className="bg-green-50 text-green-700 rounded-lg p-4 text-center flex flex-col gap-2">
                <p className="font-semibold">✓ You've already offered to help with this!</p>
                <p className="text-sm">Status: {existingMatch.status}</p>
                <p className="text-sm text-green-600">The shelter will be in touch about drop-off details.</p>
              </div>
            ) : (
              <ClaimButton needId={need.id} donorId={user.id} donorName={profile?.display_name ?? "A donor"} />
            )}
          </CardContent>
        </Card>

        {/* How drop-off works */}
        {need.is_active && user && profile?.role !== "shelter" && !existingMatch && (
          <Card className="bg-muted/50">
            <CardContent className="py-5 flex flex-col gap-2">
              <p className="font-semibold text-sm">How drop-off works</p>
              <p className="text-sm text-muted-foreground">
                After you claim this need, the shelter will confirm and share a safe neutral drop-off location — like a library or community center. Shelter addresses are never shared.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
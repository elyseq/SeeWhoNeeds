"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const supabase = createClient();
  const [role, setRole] = useState<"individual" | "shelter" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!role || !displayName || !city || !state) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, role, display_name: displayName, city, state });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    window.location.href = role === "shelter" ? "/dashboard/shelter" : "/dashboard/donor";
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to SeeWhoNeeds</CardTitle>
            <CardDescription>Tell us a bit about yourself to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label>I am a...</Label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setRole("individual")}
                    className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${role === "individual" ? "border-primary bg-primary/10" : "border-border"}`}>
                    <div className="font-semibold text-sm">Donor</div>
                    <div className="text-xs text-muted-foreground">I have things to give</div>
                  </button>
                  <button type="button" onClick={() => setRole("shelter")}
                    className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${role === "shelter" ? "border-primary bg-primary/10" : "border-border"}`}>
                    <div className="font-semibold text-sm">Shelter / Org</div>
                    <div className="text-xs text-muted-foreground">We have needs to post</div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="displayName">
                  {role === "shelter" ? "Organization name" : "Your name or nickname"}
                </Label>
                <Input id="displayName" value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={role === "shelter" ? "Hope House Shelter" : "Alex"} />
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-2 flex-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Saint Paul" />
                </div>
                <div className="flex flex-col gap-2 w-20">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={state} onChange={e => setState(e.target.value)} placeholder="MN" maxLength={2} />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Continue →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
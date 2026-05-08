"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function ClaimButton({
  needId,
  donorId,
  donorName,
}: {
  needId: string;
  donorId: string;
  donorName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");

  async function handleClaim() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: insertError } = await supabase.from("matches").insert({
      need_id: needId,
      donor_id: donorId,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setClaimed(true);
    setLoading(false);
  }

  if (claimed) {
    return (
      <div className="bg-green-50 text-green-700 rounded-lg p-4 text-center flex flex-col gap-2">
        <p className="font-semibold">✓ You've offered to help!</p>
        <p className="text-sm">The shelter will be in touch about drop-off details.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" onClick={handleClaim} disabled={loading} className="w-full">
        {loading ? "Claiming..." : "I can help with this →"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
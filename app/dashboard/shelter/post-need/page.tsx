"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const CATEGORIES = ["Clothing", "Toiletries", "Food", "Bedding", "Furniture", "Baby Items", "Electronics", "Other"];

export default function PostNeedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<"new_only" | "new_or_gently_used" | "any">("any");
  const [urgency, setUrgency] = useState<"whenever" | "soon" | "urgent">("whenever");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!category) { setError("Please select a category."); return; }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { error: insertError } = await supabase.from("needs").insert({
      shelter_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      condition_preference: condition,
      urgency,
      quantity_needed: quantity ? parseInt(quantity) : null,
    });

    if (insertError) {
        console.log("Insert error:", insertError);
        setError(insertError.message);
        setLoading(false);
        return;
    }

    window.location.href = "/dashboard/shelter";
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="w-full border-b h-16 flex items-center px-6 justify-between">
        <Link href="/" className="font-bold text-xl">SeeWhoNeeds</Link>
        <Link href="/dashboard/shelter" className="text-sm text-muted-foreground hover:underline">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Post a Need</CardTitle>
              <CardDescription>Let donors know what your shelter is looking for.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                <div className="flex flex-col gap-2">
                  <Label htmlFor="title">What do you need?</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Winter coats, size M-XL"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                          category === cat ? "border-primary bg-primary/10 font-medium" : "border-border"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {category && <p className="text-xs text-muted-foreground">Selected: {category}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Condition</Label>
                  <div className="flex gap-3">
                    {([["any", "Any"], ["new_or_gently_used", "New or gently used"], ["new_only", "New only"]] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition(val)}
                        className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm transition-colors ${
                          condition === val ? "border-primary bg-primary/10" : "border-border"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Urgency</Label>
                  <div className="flex gap-3">
                    {([["whenever", "Whenever"], ["soon", "Soon"], ["urgent", "Urgent"]] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setUrgency(val)}
                        className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm transition-colors ${
                          urgency === val ? "border-primary bg-primary/10" : "border-border"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Additional details <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Sizes, specific brands, any other details..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="quantity">Quantity needed <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Posting..." : "Post Need"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
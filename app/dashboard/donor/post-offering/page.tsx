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
const CONDITIONS = ["New", "Like new", "Good", "Fair"];

export default function PostOfferingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!category) { setError("Please select a category."); return; }
    if (!condition) { setError("Please select a condition."); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { error: insertError } = await supabase.from("offerings").insert({
      donor_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      condition,
      quantity: quantity ? parseInt(quantity) : 1,
    });

    if (insertError) { setError(insertError.message); setLoading(false); return; }
    window.location.href = "/dashboard/donor";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b h-16 flex items-center px-6 justify-between sticky top-0 bg-background z-10">
        <Link href="/" className="font-bold text-xl">SeeWhoNeeds</Link>
        <Link href="/dashboard/donor" className="text-sm text-muted-foreground hover:underline">← Back to Dashboard</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Post what you have</CardTitle>
              <CardDescription>List something you'd like to donate so shelters can find it.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title">What do you have?</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Winter jackets, women's size M" />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button" onClick={() => setCategory(cat)}
                        className={`px-3 py-1 rounded-full border text-sm transition-colors ${category === cat ? "border-primary bg-primary/10 font-medium" : "border-border"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  {category && <p className="text-xs text-muted-foreground">Selected: {category}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Condition</Label>
                  <div className="flex gap-3 flex-wrap">
                    {CONDITIONS.map(cond => (
                      <button key={cond} type="button" onClick={() => setCondition(cond)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm transition-colors ${condition === cond ? "border-primary bg-primary/10" : "border-border"}`}>
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Details <span className="text-muted-foreground">(optional)</span></Label>
                  <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Sizes, colors, brand, any other details..." />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="quantity">Quantity <span className="text-muted-foreground">(optional)</span></Label>
                  <Input id="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Posting..." : "Post offering"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
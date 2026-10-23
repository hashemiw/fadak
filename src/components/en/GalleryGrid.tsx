"use client";
import { useState } from "react";
import Card from "./Card";
import { categories, type Category, type PublicGalleryItem } from "@/data/gallery-en";

export default function GalleryGrid({ items }: { items: PublicGalleryItem[] }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const [type, setType] = useState("all");

  // Only filters that have content are offered.
  const cats = (Object.keys(categories) as Category[]).filter((c) => items.some((i) => i.category === c));
  const types = [...new Set(items.flatMap((i) => i.workTypes))];
  const shown = items.filter((i) => (cat === "all" || i.category === cat) && (type === "all" || i.workTypes.includes(type)));

  const chip = (label: string, active: boolean, on: () => void) => (
    <button key={label} className="chip" aria-pressed={active} onClick={on}>{label}</button>
  );

  return (
    <>
      <div className="filters-box">
        <div className="filters" role="group" aria-label="Filter by category">
          <span>Category</span>
          {chip("All", cat === "all", () => setCat("all"))}
          {cats.map((c) => chip(categories[c], cat === c, () => setCat(c)))}
        </div>
        <div className="filters" role="group" aria-label="Filter by type">
          <span>Type</span>
          {chip("All", type === "all", () => setType("all"))}
          {types.map((t) => chip(t, type === t, () => setType(t)))}
        </div>
      </div>
      <p className="lead" aria-live="polite" style={{ marginBottom: 20 }}>{shown.length.toLocaleString("en")} images</p>
      {shown.length ? (
        <div className="masonry">
          {shown.map((i, n) => <Card key={i.id} item={i} priority={n < 3} sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 400px" />)}
        </div>
      ) : (
        <p>No images match these filters.</p>
      )}
    </>
  );
}

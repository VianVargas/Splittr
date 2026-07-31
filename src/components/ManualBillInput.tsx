"use client";

import { useCallback, useState } from "react";
import type { ReceiptItem } from "@/lib/ocr";

export default function ManualBillInput({
  onItems,
  initialItems,
}: {
  onItems: (items: ReceiptItem[]) => void;
  initialItems?: ReceiptItem[];
}) {
  const [total, setTotal] = useState("");
  const [rows, setRows] = useState(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((i) => ({ item: i.item, price: i.price.toString() }));
    }
    return [{ item: "", price: "" }];
  });

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { item: "", price: "" }]);
  }, []);

  const updateRow = useCallback(
    (index: number, field: "item" | "price", value: string) => {
      setRows((prev) => {
        const next = prev.map((r, i) =>
          i === index ? { ...r, [field]: value } : r
        );
        return next;
      });
    },
    []
  );

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleTotalSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const price = parseFloat(total);
      if (isNaN(price) || price <= 0) return;
      onItems([
        {
          id: Math.random().toString(36).slice(2, 9),
          item: "Total Bill",
          price,
        },
      ]);
    },
    [total, onItems]
  );

  const handleItemsSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const items: ReceiptItem[] = rows
        .map((r) => ({
          id: Math.random().toString(36).slice(2, 9),
          item: r.item.trim(),
          price: parseFloat(r.price),
        }))
        .filter((r) => r.item && !isNaN(r.price) && r.price > 0);

      if (items.length === 0) return;
      onItems(items);
    },
    [rows, onItems]
  );

  const itemRowsTotal = rows.reduce(
    (sum, r) => sum + (parseFloat(r.price) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Total Bill Amount
        </h3>
        <form onSubmit={handleTotalSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-neutral">
              Amount (XLM)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-full rounded-lg border border-neutral/30 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-neutral/50 outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={!total || isNaN(parseFloat(total)) || parseFloat(total) <= 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set Total
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-neutral/30 bg-tertiary p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Add Items Manually
        </h3>
        <form onSubmit={handleItemsSubmit} className="space-y-3">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs font-medium text-neutral">
            <span>Item</span>
            <span className="w-20 text-right">Price</span>
            <span className="w-8" />
          </div>

          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2">
              <input
                type="text"
                placeholder="Item name"
                value={row.item}
                onChange={(e) => updateRow(i, "item", e.target.value)}
                className="rounded-lg border border-neutral/30 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-neutral/50 outline-none focus:border-primary"
              />
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={row.price}
                onChange={(e) => updateRow(i, "price", e.target.value)}
                className="w-20 rounded-lg border border-neutral/30 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-neutral/50 outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className="flex h-full w-8 items-center justify-center rounded-lg text-neutral transition-colors hover:text-red-400 disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={addRow}
              className="text-xs text-neutral transition-colors hover:text-primary"
            >
              + Add Item
            </button>
            <span className="text-xs text-neutral">
              Subtotal:{" "}
              <span className="font-medium text-secondary">
                {itemRowsTotal.toFixed(2)} XLM
              </span>
            </span>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600"
          >
            Use These Items
          </button>
        </form>
      </div>
    </div>
  );
}

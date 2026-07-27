export interface ReceiptItem {
  id: string;
  item: string;
  price: number;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export async function parseReceiptImage(
  file: File
): Promise<ReceiptItem[]> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/parse-receipt", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to parse receipt");
  }

  return (data.items as { item: string; price: number }[]).map(
    (entry) => ({
      id: generateId(),
      item: entry.item,
      price: entry.price,
    })
  );
}

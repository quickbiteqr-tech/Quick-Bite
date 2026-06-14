export interface Table {
  id: number;
  restaurant_id: string;
  table_number: string;
  qr_code_url: string;
  created_at: string;
}

export async function getTables(): Promise<Table[]> {
  const res = await fetch("/api/tables");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addTable(
  restaurantSlug: string,
  tableNumber: string
): Promise<Table> {
  const res = await fetch("/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurant_slug: restaurantSlug, table_number: tableNumber }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteTable(id: number): Promise<void> {
  const res = await fetch("/api/tables", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await res.text());
}

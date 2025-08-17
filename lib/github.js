export async function getRaw(path) {
  const url = `https://raw.githubusercontent.com/${path}`;
  const res = await fetch(url); // Using global fetch (Node 18+)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return await res.text();
}

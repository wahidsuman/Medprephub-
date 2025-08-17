// Use global fetch in Node 18+ (no node-fetch needed)
export async function getRaw(path) {
  const url = `https://raw.githubusercontent.com/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return await res.text();
}

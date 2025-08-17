
export default function Custom500() {
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem", textAlign: "center" }}>
      <h1>⚠️ Server Error</h1>
      <p>Something went wrong on our end. Please try again later.</p>
      <a href="/" style={{ color: "#007acc", textDecoration: "none" }}>
        ← Back to Home
      </a>
    </main>
  );
}

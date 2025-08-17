
export default function Custom404() {
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem", textAlign: "center" }}>
      <h1>📄 Page Not Found</h1>
      <p>Sorry, the page you're looking for doesn't exist.</p>
      <a href="/" style={{ color: "#007acc", textDecoration: "none" }}>
        ← Back to Home
      </a>
    </main>
  );
}

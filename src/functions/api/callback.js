export async function onRequest(context) {
    const url = new URL(context.request.url);
    const code = url.searchParams.get("code");

    if (!code) return new Response("Missing code", { status: 400 });

    const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            client_id: context.env.GITHUB_CLIENT_ID,
            client_secret: context.env.GITHUB_CLIENT_SECRET,
            code,
        }),
    });

    const data = await response.json();

    if (data.error) {
        return new Response(JSON.stringify(data), { status: 400 });
    }

    // Questo script restituisce il token a Decap CMS in modo sicuro
    const html = `
    <script>
      const receiveMessage = (e) => {
        if (e.data === "authorizing:github") {
          window.opener.postMessage(
            "authorization:github:success:${JSON.stringify({ token: data.access_token, provider: "github" })}",
            e.origin
          );
          window.removeEventListener("message", receiveMessage, false);
        }
      };
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    </script>
  `;

    return new Response(html, {
        headers: { "Content-Type": "text/html" },
    });
}
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");

  if (!code) return new Response("Mancava il codice di sblocco da GitHub.", { status: 400 });

  try {
    const params = new URLSearchParams();
    params.append("client_id", context.env.GITHUB_CLIENT_ID);
    params.append("client_secret", context.env.GITHUB_CLIENT_SECRET);
    params.append("code", code);

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "Decap-CMS-Cloudflare-Pages"
      },
      body: params.toString(),
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return new Response(`Errore parsing JSON: ${rawText}`, { status: 500 });
    }

    if (data.error || response.status !== 200) {
      return new Response(`Errore da GitHub: ${JSON.stringify(data)}`, { status: 400 });
    }

    // FISSARE LE VIRGOLETTE: Ora usiamo una concatenazione pulita che il browser adorerà
    const html = `
      <script>
        const receiveMessage = (e) => {
          if (e.data === "authorizing:github") {
            window.opener.postMessage(
              'authorization:github:success:' + JSON.stringify({ token: "${data.access_token}", provider: "github" }),
              e.origin
            );
            window.removeEventListener("message", receiveMessage, false);
            window.close(); 
          }
        };
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      </script>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });

  } catch (error) {
    return new Response(`Crash interno: ${error.message}`, { status: 500 });
  }
}
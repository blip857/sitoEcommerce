export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");

  if (!code) return new Response("Diagnostica: Mancava il codice di sblocco da GitHub.", { status: 400 });

  // Controlliamo se le variabili d'ambiente sono visibili alla funzione
  const idStatus = context.env.GITHUB_CLIENT_ID ? "Presente" : "Mancante (ERRORE)";
  const secretStatus = context.env.GITHUB_CLIENT_SECRET ? "Presente" : "Mancante (ERRORE)";

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: context.env.GITHUB_CLIENT_ID,
        client_secret: context.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const rawText = await response.text();

    // Tentiamo di decifrare la risposta di GitHub
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return new Response(`Diagnostica: Errore nel parsing JSON di GitHub. Risposta grezza: ${rawText}`, { status: 500 });
    }

    // Se GitHub ha risposto con un errore o uno status non 200
    if (data.error || response.status !== 200) {
      return new Response(`Diagnostica: GitHub ha rifiutato lo scambio (Status ${response.status}). Dati: ${JSON.stringify(data)}. Client_ID: ${idStatus}, Client_Secret: ${secretStatus}`, { status: 400 });
    }

    // Se tutto è corretto, inviamo il token a Decap CMS
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

  } catch (error) {
    return new Response(`Diagnostica: Errore di rete o crash interno: ${error.message}`, { status: 500 });
  }
}
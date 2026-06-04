export async function onRequest(context) {
    const clientId = context.env.GITHUB_CLIENT_ID;
    const redirectUri = `${new URL(context.request.url).origin}/api/callback`;

    return Response.redirect(
        `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user&redirect_uri=${redirectUri}`,
        302
    );
}
export const config = {
    matcher: ["/((?!assets/|favicon.ico).*)"],
};

export default function middleware(req: Request) {
    const url = new URL(req.url);

    // Allow static assets naturally (extra safety if matcher misses)
    if (url.pathname.includes('.')) {
        // Usually file extensions mean static assets in Vite
    }

    const basicAuth = req.headers.get("authorization");

    const expectedUser = process.env.BASIC_AUTH_USER;
    const expectedPass = process.env.BASIC_AUTH_PASS;

    // If no env vars set, allow access (or block 'safe' by default, but let's allow to avoid locking out if not configured)
    if (!expectedUser || !expectedPass) {
        return;
    }

    if (basicAuth) {
        const authValue = basicAuth.split(" ")[1];
        if (authValue) {
            try {
                const [user, pwd] = atob(authValue).split(":");
                if (user === expectedUser && pwd === expectedPass) {
                    return; // Continue
                }
            } catch (e) {
                // malformed
            }
        }
    }

    return new Response("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Protected"' },
    });
}

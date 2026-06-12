import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/*": index,
    "/favicon.ico": Bun.file("public/favicon/favicon.ico"),
    "/apple-touch-icon.png": Bun.file("public/favicon/apple-touch-icon.png"),
    "/web-app-manifest-192x192.png": Bun.file("public/favicon/web-app-manifest-192x192.png"),
    "/web-app-manifest-512x512.png": Bun.file("public/favicon/web-app-manifest-512x512.png"),
    "/favicon/apple-touch-icon.png": Bun.file("public/favicon/apple-touch-icon.png"),
    "/favicon/favicon-96x96.png": Bun.file("public/favicon/favicon-96x96.png"),
    "/favicon/favicon.ico": Bun.file("public/favicon/favicon.ico"),
    "/favicon/favicon.svg": Bun.file("public/favicon/favicon.svg"),
    "/favicon/site.webmanifest": Bun.file("public/favicon/site.webmanifest"),
    "/favicon/web-app-manifest-192x192.png": Bun.file("public/favicon/web-app-manifest-192x192.png"),
    "/favicon/web-app-manifest-512x512.png": Bun.file("public/favicon/web-app-manifest-512x512.png"),

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,

    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

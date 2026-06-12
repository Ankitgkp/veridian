import type { NextFunction, Request, Response } from "express";
import { createSupabaseClient } from "./client";
import { prisma } from "./db";

const client = createSupabaseClient();

export async function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Missing Authorization header" });
    }

    const supabaseWithAuth = createSupabaseClient();
    const data = await supabaseWithAuth.auth.getUser(token);
    const userId = data.data.user?.id;

    if (userId) {
        try {
            await prisma.user.create({
                data: {
                    id: data.data.user?.id,
                    email: data.data.user?.email!,
                    provider: data.data.user?.app_metadata.provider === 'google' ? "Google" : "Github",
                    name: data.data.user?.user_metadata.full_name
                }
            })
        } catch (e) {
            console.log(e);
        }

        //@ts-ignore
        req.userId = userId;
        return next();
    }

    return res.status(403).json({ message: "Invalid credentials" });
}

export async function guestMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    if (!token) {
        //@ts-ignore
        req.userId = null;
        return next();
    }

    const supabaseWithAuth = createSupabaseClient();
    const data = await supabaseWithAuth.auth.getUser(token);
    const userId = data.data.user?.id;

    if (userId) {
        try {
            await prisma.user.create({
                data: {
                    id: data.data.user?.id,
                    email: data.data.user?.email!,
                    provider: data.data.user?.app_metadata.provider === 'google' ? "Google" : "Github",
                    name: data.data.user?.user_metadata.full_name
                }
            })
        } catch (e) {
            console.log(e);
        }

        //@ts-ignore
        req.userId = userId;
    } else {
        //@ts-ignore
        req.userId = null;
    }

    return next();
}

import { files } from "@/db/schema";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc, eq } from "drizzle-orm";

const app = new Hono().basePath("/api");

app.get("/files", async (c) => {
    const db = drizzle(
        (getCloudflareContext().env as any).DB as unknown as D1Database
    );
    const filesResponse = await db.select().from(files);
    return c.json(filesResponse);
});

app.post("/upload", async (c) => {
    const formData = await c.req.formData();
    const fileData = formData.get("file");
    const expirationDays = Number(formData.get("expiration"));

    if (!fileData) {
        return c.json({ success: false, message: "ファイルがありません" }, 400);
    }

    const file = fileData as File;
    const fileName = file.name;
    const filePath = `uploads/${Date.now()}-${fileName}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    try {
        const r2 = (getCloudflareContext().env as any).R2 as unknown as R2Bucket;
        await r2.put(filePath, file);
    } catch (r2Error) {
        return c.json(
            {
                success: false,
                message: `File upload failed: ${r2Error}`,
            },
            500
        );
    }

    const db = drizzle(
        (getCloudflareContext().env as any).DB as unknown as D1Database
    );

    try {
        await db.insert(files).values({
            fileName,
            filePath,
            contentType: file.type,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        return c.json(
            { success: false, message: "ファイルの保存に失敗しました" },
            500
        );
    }

    const insertRecord = await db
        .select()
        .from(files)
        .orderBy(desc(files.createdAt))
        .limit(1);

    return c.json({
        success: true,
        message: "ファイルを保存しました",
        url: `${process.env.BASE_URL}/files/${insertRecord[0].id}`,
        expiresAt: expiresAt.toISOString(),
    });
});

app.get("/files/:id", async (c) => {
    const id = c.req.param("id");
    const db = drizzle(
        (getCloudflareContext().env as any).DB as unknown as D1Database
    );
    const file = await db.select().from(files).where(eq(files.id, id)).limit(1);
    return c.json(file[0]);
});

// 追加
app.get("/download/:id", async (c) => {
    try {
        const id = c.req.param("id");

        const db = drizzle(
            (getCloudflareContext().env as any).DB as unknown as D1Database
        );
        const fileResults = await db
            .select()
            .from(files)
            .where(eq(files.id, id))
            .limit(1);

        if (fileResults.length === 0) {
            return c.json({ error: "ファイルが見つかりません" }, 404);
        }

        const fileInfo = fileResults[0];

        if (new Date() > new Date(fileInfo.expiresAt)) {
            return c.json({ error: "ファイルの有効期限が切れています" }, 410); // Gone
        }

        const r2 = (getCloudflareContext().env as any).R2 as unknown as R2Bucket;
        const r2Object = await r2.get(fileInfo.filePath);

        if (r2Object === null) {
            return c.json({ error: "ストレージ上にファイルが見つかりません" }, 404);
        }

        const arrayBuffer = await r2Object.arrayBuffer();
        c.header(
            "Content-Disposition",
            `attachment; filename="${fileInfo.fileName}"`
        );
        c.header(
            "Content-Type",
            fileInfo.contentType || "application/octet-stream"
        );
        c.header("Content-Length", String(arrayBuffer.byteLength));

        return c.body(arrayBuffer);
    } catch (error) {
        console.error("ダウンロードエラー:", error);
        return c.json(
            { error: "ファイルのダウンロード中にエラーが発生しました" },
            500
        );
    }
});

export const GET = handle(app);
export const POST = handle(app);

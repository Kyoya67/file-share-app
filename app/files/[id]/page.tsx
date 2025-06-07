import FileDownloadClient from "./client";

export type FileInfo = {
    id: string;
    fileName: string;
    filePath: string;
    contentType: string;
    expiresAt: string;
    createdAt: string;
};

async function getFileInfo(fileId: string) {
    const baseUrl = process.env.BASE_URL || "http://localhost:8787";
    const response = await fetch(`${baseUrl}/api/files/${fileId}`);
    return (await response.json()) as FileInfo;
}
export default async function Page(props: { params: { id: string } }) {
    const params = await props.params;
    const fileInfo = await getFileInfo(params.id);

    if (!fileInfo) {
        return <div>ファイルが見つかりませんでした</div>;
    }

    const now = new Date();
    const expiresAt = new Date(fileInfo.expiresAt);
    const isExpired = now > expiresAt;

    if (isExpired) {
        return <div>ファイルの有効期限切れ</div>;
    }

    return <FileDownloadClient fileId={fileInfo.id} />;
}

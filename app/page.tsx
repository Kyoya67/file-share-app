"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

type UploadResult = {
  success: boolean;
  message?: string;
  url?: string;
  expiresAt?: number;
};

type ExpirationOption = 1 | 3 | 5 | 7;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [expiration, setExpiration] = useState<ExpirationOption>(7);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const droppedFile = acceptedFiles[0];
      setFile(droppedFile);
      setFileName(droppedFile.name);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("expiration", String(expiration));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = (await response.json()) as UploadResult;
      setUploadResult(result);

      if (result.success) {
        setFile(null);
        setFileName("");
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "アップロード中にエラーが発生しました",
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="max-w-2xl mx-auto my-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        ファイル共有アプリ
      </h1>
      <div className="border border-[#e0e0e0] rounded shadow-sm overflow-hidden">
        <div className="p-4 bg-[#f5f7fa] border-b border-[#3498db]">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 rounded text-sm ${expiration === 1
                  ? "bg-[#e74c3c] text-white"
                  : "bg-[#ecf0f1] text-[#2c3e50]"
                }`}
              onClick={() => setExpiration(1)}
            >
              1日
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${expiration === 3
                  ? "bg-[#e74c3c] text-white"
                  : "bg-[#ecf0f1] text-[#2c3e50]"
                }`}
              onClick={() => setExpiration(3)}
            >
              3日
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${expiration === 5
                  ? "bg-[#e74c3c] text-white"
                  : "bg-[#ecf0f1] text-[#2c3e50]"
                }`}
              onClick={() => setExpiration(5)}
            >
              5日
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${expiration === 7
                  ? "bg-[#e74c3c] text-white"
                  : "bg-[#ecf0f1] text-[#2c3e50]"
                }`}
              onClick={() => setExpiration(7)}
            >
              7日
            </button>
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`p-6 bg-[#f8f9fa] text-center ${isDragActive ? "bg-[#e3f2fd]" : ""
            }`}
        >
          <input {...getInputProps()} />
          <p className="mb-2">
            ここにファイルをドラッグ&ドロップしてください。
          </p>
          <p className="text-sm text-gray-600 mb-2">
            お使いのブラウザが対応していれば
            <br />
            フォルダごとドラッグすることが可能です。
          </p>
          <p className="text-sm text-gray-600">
            1ファイル300GBまで、個数無制限
          </p>
        </div>

        <div className="p-4 bg-white">
          {file && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <label className="w-40 text-sm">ファイル名：</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 border border-gray-300 px-2 py-1 text-sm"
                />
              </div>

              <div className="flex items-center mt-4">
                <button
                  className="bg-[#2ecc71] text-white px-4 py-1 text-sm rounded"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? "アップロード中..." : "アップロード"}
                </button>
              </div>
            </div>
          )}

          {uploadResult && uploadResult.success && uploadResult.url && (
            <div className="mt-4 p-3 bg-[#e3f2fd] rounded">
              <p className="text-sm font-medium mb-2">共有URL:</p>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={uploadResult.url}
                  className="flex-1 border border-gray-300 px-2 py-1 text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  className={`ml-2 ${copyStatus === "copied" ? "bg-[#2ecc71]" : "bg-[#3498db]"
                    } text-white px-3 py-1 text-sm rounded transition-colors duration-300`}
                  onClick={() => {
                    navigator.clipboard.writeText(uploadResult.url!);
                    setCopyStatus("copied");
                    setTimeout(() => setCopyStatus("idle"), 2000);
                  }}
                >
                  {copyStatus === "copied" ? "コピー完了" : "コピー"}
                </button>
              </div>

              {uploadResult.expiresAt && (
                <p className="mt-2 text-sm text-gray-500">
                  有効期限: {new Date(uploadResult.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

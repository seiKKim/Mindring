"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Modal } from "@/components/ui/modal";

type MenuItem = {
  id: string;
  name: string;
  slug: string;
  order: number;
  visible: boolean;
};

export default function AdminWorkbookPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/workbook-menu");
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(
    () => [...menu].sort((a, b) => a.order - b.order),
    [menu]
  );

  const addMenuItem = () => {
    const id = crypto.randomUUID();
    setMenu((m) => [
      ...m,
      {
        id,
        name: "새 카테고리",
        slug: `cat-${m.length + 1}`,
        order: m.length + 1,
        visible: true,
      },
    ]);
  };

  const saveMenu = async () => {
    try {
      const res = await fetch("/api/admin/workbook-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menu),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "메뉴 저장 완료" });
      } else {
        setMessage({ type: "error", text: "메뉴 저장 실패" });
      }
    } catch (error) {
      console.error("Save failed:", error);
      setMessage({ type: "error", text: "저장 중 오류가 발생했습니다." });
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // --- Bulk Upload State ---
  // --- Bulk Upload State ---
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkFiles, setBulkFiles] = useState<FileList | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<
    "idle" | "confirm" | "processing" | "completed"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState("");
  const [bulkResult, setBulkResult] = useState({ success: 0, fail: 0 });

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBulkFiles(e.target.files);
    }
  };

  const openBulkModal = () => {
    if (!bulkCategory) {
      alert("카테고리를 선택해주세요.");
      return;
    }
    if (!bulkFiles || bulkFiles.length === 0) {
      alert("파일을 선택해주세요.");
      return;
    }
    setBulkStatus("confirm");
    setIsBulkModalOpen(true);
  };

  const handleBulkUpload = async () => {
    if (!bulkFiles) return;

    setBulkStatus("processing");
    setBulkResult({ success: 0, fail: 0 });
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < bulkFiles.length; i++) {
      const file = bulkFiles[i];
      setUploadProgress(
        `${i + 1} / ${bulkFiles.length} 처리 중... (${file.name})`
      );

      try {
        // 1. Upload
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");
        const { url } = await uploadRes.json();

        // 2. Create Workbook
        const title =
          file.name.substring(0, file.name.lastIndexOf(".")) || file.name;

        const createRes = await fetch("/api/workbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            category: bulkCategory,
            fileUrl: url,
            thumbnail: "/img/cover-fallback.png",
          }),
        });

        if (!createRes.ok) throw new Error("Creation failed");
        successCount++;
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        failCount++;
      }
    }

    setBulkResult({ success: successCount, fail: failCount });
    setBulkStatus("completed");
    setUploadProgress("");
  };

  const closeBulkModal = () => {
    if (bulkStatus === "processing") return; // Prevent closing while processing
    setIsBulkModalOpen(false);
    setBulkStatus("idle");
    if (bulkStatus === "completed") {
      setBulkFiles(null);
      // We might want to reset the file input value here, but since it's uncontrolled,
      // we rely on the user picking files again or the list being cleared from state
      // A full reset would require a ref or ID on the input.
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            스마트 워크북 관리
          </h1>
          <p className="mt-2 text-gray-600">
            워크북 카테고리 관리 및 대량 등록을 수행할 수 있습니다.
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* --- Category Management Section --- */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">카테고리 메뉴 관리</h2>
            <div className="flex gap-2">
              <button
                onClick={addMenuItem}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                추가
              </button>
              <button
                onClick={saveMenu}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                저장
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500">불러오는 중…</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-12 gap-2 items-center border rounded-lg p-3"
                >
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">
                      카테고리명
                    </label>
                    <input
                      className="w-full rounded border-2 border-gray-300 px-2 py-1 text-sm"
                      value={m.name}
                      onChange={(e) =>
                        setMenu((list) =>
                          list.map((x) =>
                            x.id === m.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      placeholder="카테고리 이름"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">
                      슬러그
                    </label>
                    <input
                      className="w-full rounded border-2 border-gray-300 px-2 py-1 text-sm"
                      value={m.slug}
                      onChange={(e) =>
                        setMenu((list) =>
                          list.map((x) =>
                            x.id === m.id ? { ...x, slug: e.target.value } : x
                          )
                        )
                      }
                      placeholder="슬러그"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">
                      순서
                    </label>
                    <input
                      type="number"
                      className="w-full rounded border-2 border-gray-300 px-2 py-1 text-sm"
                      value={m.order}
                      onChange={(e) =>
                        setMenu((list) =>
                          list.map((x) =>
                            x.id === m.id
                              ? { ...x, order: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                      placeholder="순서"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-sm pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.visible}
                        onChange={(e) =>
                          setMenu((list) =>
                            list.map((x) =>
                              x.id === m.id
                                ? { ...x, visible: e.target.checked }
                                : x
                            )
                          )
                        }
                      />
                      표시
                    </label>
                  </div>
                  <div className="col-span-2 text-right pt-2">
                    <button
                      onClick={() =>
                        setMenu((list) => list.filter((x) => x.id !== m.id))
                      }
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Bulk Upload Section --- */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-teal-500">
          <div className="mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              워크북 대량 등록
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              한 번에 여러 개의 파일을 업로드하여 워크북을 등록합니다. 파일명이
              제목으로 사용됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                등록할 카테고리 선택
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                aria-label="등록할 카테고리 선택"
              >
                <option value="">카테고리를 선택하세요</option>
                {sorted
                  .filter((m) => m.visible && m.name !== "전체")
                  .map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                파일 선택 (다중 선택 가능)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.png"
                onChange={handleBulkFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-50 file:text-teal-700
                  hover:file:bg-teal-100"
                aria-label="파일 선택"
              />
              {bulkFiles && bulkFiles.length > 0 && (
                <p className="mt-2 text-sm text-blue-600">
                  총 {bulkFiles.length}개 파일 선택됨
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-4">
            <button
              onClick={openBulkModal}
              className="px-6 py-3 rounded-lg text-white font-bold transition-colors bg-teal-600 hover:bg-teal-700"
            >
              일괄 등록하기
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={closeBulkModal}
        title="워크북 대량 등록"
        showCloseButton={bulkStatus !== "processing"}
        closeOnOverlayClick={bulkStatus !== "processing"}
      >
        <div className="space-y-6">
          {bulkStatus === "confirm" && (
            <>
              <p className="text-gray-700">
                선택한 <strong>{bulkFiles?.length}</strong>개의 파일을 &apos;
                <strong>{bulkCategory}</strong>&apos; 카테고리에
                등록하시겠습니까?
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={closeBulkModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleBulkUpload}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                >
                  등록 시작
                </button>
              </div>
            </>
          )}

          {bulkStatus === "processing" && (
            <div className="text-center py-6 space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 font-medium text-lg">
                등록 중입니다...
              </p>
              <p className="text-teal-600 font-bold">{uploadProgress}</p>
            </div>
          )}

          {bulkStatus === "completed" && (
            <div className="text-center py-4 space-y-4">
              <div className="text-xl font-bold mb-2">등록 완료!</div>
              <div className="flex justify-center gap-8 py-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">성공</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {bulkResult.success}
                  </p>
                </div>
                <div className="w-px bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">실패</p>
                  <p className="text-2xl font-bold text-red-500">
                    {bulkResult.fail}
                  </p>
                </div>
              </div>
              <button
                onClick={closeBulkModal}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-bold mt-4"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

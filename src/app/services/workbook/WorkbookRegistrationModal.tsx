"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";

interface WorkbookRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id: string;
    title: string;
    category: string;
    fileUrl: string;
    thumbnail: string;
  } | null;
}

export function WorkbookRegistrationModal({
  isOpen,
  onClose,
  initialData,
}: WorkbookRegistrationModalProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch categories when modal opens
      fetch("/api/admin/workbook-menu")
        .then((res) => res.json())
        .then((data: { name: string; visible: boolean; order: number }[]) => {
          const visibleCats = data
            .filter((d) => d.visible)
            .sort((a, b) => a.order - b.order)
            .map((d) => d.name)
            .filter((name) => name !== "전체"); // Usually 'All' is not for registration

          setCategories(visibleCats);
          if (!category) {
            if (initialData?.category) {
              setCategory(initialData.category);
            } else if (visibleCats.length > 0) {
              setCategory(visibleCats[0]);
            }
          }
        })
        .catch((err) => console.error("Failed to fetch categories:", err));
    }
  }, [isOpen, category, initialData]);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [existingFileUrl, setExistingFileUrl] = useState("");

  useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setExistingFileUrl(initialData.fileUrl);
      // We can't easily convert URL back to File object, so we handle it separately
      setFile(null);
    } else if (isOpen && !initialData) {
      // Reset for new entry
      setTitle("");
      setCategory(categories[0] || ""); // Will be set by category fetch useEffect as well, but safe here
      setFile(null);
      setExistingFileUrl("");
      setAgreed(false);
    }
  }, [isOpen, initialData, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate: Title, Category, Agreed are mandatory. File is mandatory for Create, optional for Edit (if keeping existing)
    if (!category || !title || (!file && !existingFileUrl) || !agreed) {
      alert("모든 필드를 입력하고 약관에 동의해주세요.");
      return;
    }

    try {
      let finalFileUrl = existingFileUrl;

      // 1. Upload File if selected
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        // Use existing upload API or similar logic
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("File upload failed");
        }

        const { url } = await uploadRes.json();
        finalFileUrl = url;
      }

      // 2. Create or Update Workbook
      if (initialData?.id) {
        // Update
        const res = await fetch(`/api/workbook/${initialData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            category,
            fileUrl: finalFileUrl,
            thumbnail: initialData.thumbnail || "/img/cover-fallback.png",
          }),
        });
        if (!res.ok) throw new Error("Failed to update workbook");
        alert("워크북이 성공적으로 수정되었습니다.");
      } else {
        // Create
        const res = await fetch("/api/workbook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            category,
            fileUrl: finalFileUrl,
            thumbnail: "/img/cover-fallback.png", // Simplified for now
          }),
        });
        if (!res.ok) throw new Error("Failed to register workbook");
        alert("워크북이 성공적으로 등록되었습니다.");
      }

      // Reset and close
      onClose();
      window.location.reload(); // Simple reload to refresh list
    } catch (error) {
      console.error(error);
      alert("작업에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "워크북 수정하기" : "워크북 등록하기"}
      size="md"
    >
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
        <p className="text-sm text-gray-600 text-center leading-relaxed">
          본 워크북은 누구나 자유롭게 등록하고 사용이 가능합니다. 단, 상업적
          배포는 금지하며, 등록한 내용과 이미지는 마인드링에서 책임을 지지
          않습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-gray-900 font-bold">약관에 동의합니다.</span>
          </label>
        </div>

        <div className="space-y-4 border-t border-gray-200 pt-6">
          {/* Category */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label
              htmlFor="category-select"
              className="text-sm font-bold text-gray-700"
            >
              워크북 카테고리 <span className="text-pink-500">*</span>
            </label>
            <div className="col-span-3">
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="워크북 카테고리 선택"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <label
              htmlFor="title-input"
              className="text-sm font-bold text-gray-700"
            >
              워크북 제목 <span className="text-pink-500">*</span>
            </label>
            <div className="col-span-3">
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="워크북 제목 입력"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="grid grid-cols-4 gap-4 items-start">
            <label className="text-sm font-bold text-gray-700 pt-2">
              첨부파일 <span className="text-pink-500">*</span>
            </label>
            <div className="col-span-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    file?.name ||
                    (existingFileUrl ? existingFileUrl.split("/").pop() : "")
                  }
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                  aria-label="선택된 파일명"
                />
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                  파일찾기
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.png"
                    aria-label="파일 선택"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center pt-6 border-t border-gray-200 mt-6">
          <button
            type="submit"
            className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-base font-bold transition-colors"
          >
            등록하기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-base font-medium transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </Modal>
  );
}

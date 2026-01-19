"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Image as ImageIcon,
  X,
  GraduationCap,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

type AcademyCourse = {
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  thumbnail?: string;
  category: string;
  instructor?: string;
  courseUrl?: string;
  price: number | null;
  duration?: string;
  tags: string[];
  level?: string;
  popularScore: number;
  visible: boolean;
  createdAt: string;
  updatedAt?: string;
};

export default function AdminAcademyPage() {
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademyCourse | null>(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    thumbnail: "",
    category: "인지 커리큘럼",
    instructor: "",
    courseUrl: "",
    visible: true,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const categories = ["인지 커리큘럼", "인지교육 영상", "교육현장"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/academy-courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, selectedCategory]);

  const handleOpenModal = (item?: AcademyCourse) => {
    if (item) {
      setEditingItem(item);
      setForm({
        title: item.title,
        subtitle: item.subtitle || "",
        description: item.description || "",
        thumbnail: item.thumbnail || "",
        category: item.category,
        instructor: item.instructor || "",
        courseUrl: item.courseUrl || "",
        visible: item.visible,
      });
    } else {
      setEditingItem(null);
      setForm({
        title: "",
        subtitle: "",
        description: "",
        thumbnail: "",
        category: "인지 커리큘럼",
        instructor: "",
        courseUrl: "",
        visible: true,
      });
    }
    setThumbnailFile(null);
    setShowModal(true);
  };

  const handleUploadThumbnail = async () => {
    if (!thumbnailFile) return null;
    const formData = new FormData();
    formData.append("file", thumbnailFile);
    formData.append("folder", "academy/thumbnails");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return res.ok ? data.url : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSave = async () => {
    if (!form.title) {
      setMessage({ type: "error", text: "제목을 입력해주세요." });
      return;
    }

    setUploading(true);
    try {
      let thumbUrl = form.thumbnail;
      if (thumbnailFile) {
        const uploaded = await handleUploadThumbnail();
        if (uploaded) thumbUrl = uploaded;
      }

      const payload = { ...form, thumbnail: thumbUrl };
      if (editingItem) (payload as any).id = editingItem.id;

      const res = await fetch("/api/admin/academy-courses", {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "저장되었습니다." });
        setShowModal(false);
        fetchData();
      } else {
        setMessage({ type: "error", text: "저장에 실패했습니다." });
      }
    } catch (e) {
      setMessage({ type: "error", text: "오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/academy-courses?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage({ type: "success", text: "삭제되었습니다." });
        fetchData();
      }
    } catch (e) {
      setMessage({ type: "error", text: "삭제 중 오류가 발생했습니다." });
    }
  };

  // Toast message auto-hide
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-suit">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              스마트 교육 관리
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              인지 커리큘럼, 영상, 교육현장 콘텐츠를 관리합니다.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            콘텐츠 추가
          </button>
        </div>

        {/* Message Toast */}
        {message && (
          <div
            className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="제목 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedCategory === "all"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedCategory === cat
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold w-[80px]">Thumb</th>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold w-[150px]">Category</th>
                <th className="px-6 py-4 font-semibold w-[100px]">Status</th>
                <th className="px-6 py-4 font-semibold w-[120px] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    로딩 중...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 bg-gray-100 rounded md overflow-hidden relative border border-gray-100">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 line-clamp-1">
                        {course.title}
                      </div>
                      <div className="text-gray-500 text-xs line-clamp-1 mt-0.5">
                        {course.subtitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {course.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {course.visible ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <Eye className="w-3 h-3" /> 공개
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                          <EyeOff className="w-3 h-3" /> 숨김
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(course)}
                          className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-all"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingItem ? "콘텐츠 수정" : "새 콘텐츠 추가"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    제목
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                    placeholder="콘텐츠 제목을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    부제목 (설명요약)
                  </label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm({ ...form, subtitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                    placeholder="간단한 설명을 입력하세요"
                  />
                </div>
              </div>

              {/* Category & Visibility */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    카테고리
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    상태
                  </label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.visible}
                        onChange={() => setForm({ ...form, visible: true })}
                        className="w-4 h-4 text-black focus:ring-black border-gray-300"
                      />
                      <span className="text-sm">공개</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!form.visible}
                        onChange={() => setForm({ ...form, visible: false })}
                        className="w-4 h-4 text-black focus:ring-black border-gray-300"
                      />
                      <span className="text-sm text-gray-500">숨김</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* URL & Instructor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    연결 URL (없으면 신청버튼)
                  </label>
                  <input
                    type="text"
                    value={form.courseUrl}
                    onChange={(e) =>
                      setForm({ ...form, courseUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    강사명/출처
                  </label>
                  <input
                    type="text"
                    value={form.instructor}
                    onChange={(e) =>
                      setForm({ ...form, instructor: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  상세 설명
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all resize-none"
                  placeholder="상세 내용을 입력하세요."
                />
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  썸네일
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setThumbnailFile(e.target.files?.[0] || null)
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {thumbnailFile ? (
                    <div className="text-sm text-green-600 font-medium">
                      {thumbnailFile.name} 선택됨
                    </div>
                  ) : form.thumbnail ? (
                    <div className="relative h-32 w-full max-w-[200px] mx-auto overflow-hidden rounded-lg border border-gray-200">
                      <img
                        src={form.thumbnail}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold">
                          변경하려면 클릭
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm flex flex-col items-center gap-2">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                      <span className="font-medium">
                        이미지를 드래그하거나 클릭하여 업로드
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="px-5 py-2.5 text-sm font-bold text-white bg-black hover:bg-gray-800 rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  "저장 중..."
                ) : (
                  <>
                    <Save className="w-4 h-4" /> 저장하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, Save } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            스마트 워크북 관리
          </h1>
          <p className="mt-2 text-gray-600">
            워크북 카테고리를 관리할 수 있습니다
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

        <div className="bg-white rounded-lg shadow-sm p-6">
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
      </div>
    </div>
  );
}

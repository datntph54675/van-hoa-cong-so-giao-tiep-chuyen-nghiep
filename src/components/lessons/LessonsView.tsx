import React, { useState, useMemo } from 'react';
import { Lesson } from '../../types';
import { Search, CheckCircle2, Clock, BookOpen, ArrowRight, Filter } from 'lucide-react';

interface LessonsViewProps {
  lessons: Lesson[];
  completedLessonIds: string[];
  onSelectLesson: (lessonId: string) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({
  lessons,
  completedLessonIds,
  onSelectLesson
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    lessons.forEach((l) => set.add(l.category));
    return ['all', ...Array.from(set)];
  }, [lessons]);

  // Filtered lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchCategory =
        selectedCategory === 'all' || lesson.category === selectedCategory;
      const matchSearch =
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [lessons, selectedCategory, searchQuery]);

  const completedCount = completedLessonIds.length;
  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Thư viện Bài học Chuẩn mực Công sở
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            10 chuyên đề đào tạo toàn diện từ tác phong kỷ luật đến nghệ thuật ứng xử với lãnh đạo và đối tác.
          </p>
        </div>

        {/* Learning progress bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs min-w-[220px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium">Tiến độ hoàn thành</span>
            <span className="font-mono tabular-nums font-bold text-blue-900">
              {completedCount}/{totalCount} bài ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài học theo tiêu đề, nội dung, chủ đề..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-colors"
          />
        </div>

        {/* Category Filter Buttons (Functional segmented buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {cat === 'all' ? 'Tất cả chủ đề' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map((lesson) => {
          const isCompleted = completedLessonIds.includes(lesson.id);

          return (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`group bg-white rounded-xl border p-5 transition-all cursor-pointer flex flex-col justify-between hover:border-blue-400 hover:shadow-xs ${
                isCompleted ? 'border-emerald-200/80 bg-emerald-50/15' : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-2">
                {/* Clean unboxed metadata with dot separator */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-semibold text-blue-900">Bài {lesson.order}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-600">{lesson.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lesson.estimatedMinutes} phút</span>
                  </div>

                  {isCompleted && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã hoàn thành
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors leading-snug">
                  {lesson.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {lesson.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-700">{lesson.sections.length} phần · {lesson.dos.length} chuẩn mực</span>
                <span className="font-semibold text-blue-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Học ngay <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLessons.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">Không tìm thấy bài học phù hợp</h3>
          <p className="text-xs text-slate-700 mt-1">
            Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục.
          </p>
        </div>
      )}
    </div>
  );
};

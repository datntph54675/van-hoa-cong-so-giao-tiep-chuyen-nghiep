import React, { useMemo } from 'react';
import { Badge, LeaderboardUser, UserProfile } from '../../types';
import { INITIAL_BADGES, INITIAL_LEADERBOARD } from '../../data/seedData';
import {
  Trophy,
  Award,
  Medal,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles,
  BookOpen,
  MessageSquareText,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface LeaderboardViewProps {
  profile: UserProfile;
  points: number;
  completedLessonsCount: number;
  quizzesTakenCount: number;
  unlockedBadgeIds: string[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  profile,
  points,
  completedLessonsCount,
  quizzesTakenCount,
  unlockedBadgeIds
}) => {
  // Map badge icon strings to Lucide components
  const renderBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const className = `w-6 h-6 ${isUnlocked ? 'text-amber-500' : 'text-slate-400'}`;
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'MessageSquareCheck':
      case 'MessageSquareText':
        return <MessageSquareText className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      default:
        return <Medal className={className} />;
    }
  };

  // Compile full leaderboard including current user
  const leaderboardList: LeaderboardUser[] = useMemo(() => {
    const currentUser: LeaderboardUser = {
      id: 'current-user',
      name: profile.name,
      department: profile.department,
      role: profile.role,
      avatarSeed: profile.avatarSeed,
      points,
      completedLessonsCount,
      quizzesTakenCount,
      badgeCount: unlockedBadgeIds.length,
      isCurrentUser: true
    };

    const combined = [...INITIAL_LEADERBOARD, currentUser];
    // Sort descending by points
    combined.sort((a, b) => b.points - a.points);
    return combined;
  }, [profile, points, completedLessonsCount, quizzesTakenCount, unlockedBadgeIds]);

  const currentUserRank =
    leaderboardList.findIndex((u) => u.isCurrentUser) + 1;

  // Level progression
  const getLevelInfo = (pts: number) => {
    if (pts >= 800) return { title: 'Thủ Lĩnh Văn Hóa Cấp Cao', level: 5, nextLevel: 1000, currentBase: 800 };
    if (pts >= 600) return { title: 'Đại Sứ Văn Hóa Doanh Nghiệp', level: 4, nextLevel: 800, currentBase: 600 };
    if (pts >= 400) return { title: 'Chuyên Viên Giao Tiếp Xuất Sắc', level: 3, nextLevel: 600, currentBase: 400 };
    if (pts >= 200) return { title: 'Nhân Viên Tiên Tiến', level: 2, nextLevel: 400, currentBase: 200 };
    return { title: 'Học Viên Khởi Đầu', level: 1, nextLevel: 200, currentBase: 0 };
  };

  const levelInfo = getLevelInfo(points);
  const levelProgress = Math.min(
    100,
    Math.round(((points - levelInfo.currentBase) / (levelInfo.nextLevel - levelInfo.currentBase)) * 100)
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bảng Xếp Hạng & Hệ Thống Danh Hiệu
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Ghi nhận nỗ lực học tập, thi đua chuẩn mực văn hóa công sở và tích lũy huy hiệu vinh danh.
          </p>
        </div>

        {/* Current user badge & points preview */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div>
            <div className="text-[11px] text-slate-700">Thứ hạng của bạn</div>
            <div className="text-lg font-extrabold text-blue-900 font-mono tabular-nums">
              #{currentUserRank} <span className="text-xs font-normal text-slate-700">toàn viện</span>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <div className="text-[11px] text-slate-700">Tổng điểm</div>
            <div className="text-lg font-extrabold text-amber-600 font-mono tabular-nums">
              {points} <span className="text-xs font-normal text-slate-700">XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Level Tier Status Box */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 sm:p-8 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Cấp độ {levelInfo.level} · {levelInfo.title}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {profile.name}
            </h2>
            <p className="text-xs text-slate-300">
              {profile.role} · {profile.department}
            </p>
          </div>

          <div className="text-right sm:self-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
              {points}
            </span>
            <span className="text-xs text-slate-300 ml-1">/ {levelInfo.nextLevel} XP</span>
            <div className="text-[11px] text-blue-200 mt-0.5">
              Còn {levelInfo.nextLevel - points} XP để thăng hạng tiếp theo
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-amber-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, levelProgress)}%` }}
          />
        </div>
      </div>

      {/* Badges & Milestones Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Huy hiệu Thành tích & Cột mốc ({unlockedBadgeIds.length}/{INITIAL_BADGES.length})
            </h2>
            <p className="text-xs text-slate-600">
              Đạt các chỉ tiêu học tập và thực hành để mở khóa danh hiệu chính thức.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INITIAL_BADGES.map((badge) => {
            const isUnlocked = unlockedBadgeIds.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-5 rounded-xl border transition-all flex items-start gap-4 ${
                  isUnlocked
                    ? 'bg-white border-amber-200/80 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200/60 opacity-70'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    isUnlocked
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {isUnlocked ? (
                    renderBadgeIcon(badge.icon, true)
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {badge.name}
                    </h3>
                    {isUnlocked ? (
                      <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Đã mở
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-700">Chưa mở</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {badge.description}
                  </p>

                  <div className="text-[11px] text-slate-700 font-medium pt-1 border-t border-slate-100">
                    Yêu cầu: {badge.requirement}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Bảng Xếp Hạng Thi Đua Toàn Cơ Quan</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Cập nhật điểm theo thời gian thực dựa trên tiến độ bài học, thực hành tình huống và điểm số bài thi.
            </p>
          </div>
          <span className="text-xs text-slate-700">
            {leaderboardList.length} thành viên tham gia
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-700">
                <th className="py-3 font-semibold text-center w-12">Hạng</th>
                <th className="py-3 font-semibold">Nhân sự</th>
                <th className="py-3 font-semibold hidden md:table-cell">Bộ phận / Vị trí</th>
                <th className="py-3 font-semibold text-center">Bài học</th>
                <th className="py-3 font-semibold text-center">Huy hiệu</th>
                <th className="py-3 font-semibold text-right pr-2">Điểm XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboardList.map((user, idx) => {
                const rank = idx + 1;
                const isUser = user.isCurrentUser;

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      isUser
                        ? 'bg-blue-50/70 font-medium'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 text-center font-mono tabular-nums">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold">
                          🥇
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold">
                          🥈
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-900 font-bold">
                          🥉
                        </span>
                      ) : (
                        <span className="text-slate-500 font-semibold">{rank}</span>
                      )}
                    </td>

                    {/* User Info */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isUser ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isUser && (
                              <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-700 md:hidden">
                            {user.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department / Role */}
                    <td className="py-3.5 hidden md:table-cell text-slate-600">
                      <div>{user.department}</div>
                      <div className="text-[11px] text-slate-700">{user.role}</div>
                    </td>

                    {/* Completed Lessons */}
                    <td className="py-3.5 text-center font-mono tabular-nums text-slate-700">
                      {user.completedLessonsCount}/10
                    </td>

                    {/* Badges Count */}
                    <td className="py-3.5 text-center font-mono tabular-nums text-slate-700">
                      {user.badgeCount}
                    </td>

                    {/* Points (XP) */}
                    <td className="py-3.5 text-right font-mono tabular-nums font-extrabold text-blue-900 text-sm pr-2">
                      {user.points} XP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

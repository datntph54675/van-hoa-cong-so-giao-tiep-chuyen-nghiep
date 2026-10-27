import React from 'react';
import { UserAccount, Lesson, Scenario } from '../../types';
import {
  Users,
  MessageCircle,
  Ear,
  Mail,
  Handshake,
  BookOpen,
  Target,
  Trophy,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Building,
  UserCheck,
  Compass,
  FileText,
  Lock,
  ArrowUpRight
} from 'lucide-react';

interface LandingViewProps {
  currentUser: UserAccount | null;
  lessons: Lesson[];
  scenarios: Scenario[];
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onNavigateLessons: () => void;
  onNavigateScenarios: (scenarioId?: string) => void;
  onNavigateOverview: () => void;
  onPreviewLesson: (lessonId: string) => void;
  onOpenPolicyModal: (tab: 'terms' | 'privacy') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  currentUser,
  lessons,
  scenarios,
  onNavigateLogin,
  onNavigateRegister,
  onNavigateLessons,
  onNavigateScenarios,
  onNavigateOverview,
  onPreviewLesson,
  onOpenPolicyModal
}) => {
  // 6 Curated Featured Lessons per Section 5 specification
  const featuredLessons = [
    {
      id: 'lesson-1',
      title: 'Tổng quan về văn hoá công sở',
      summary:
        'Hiểu rõ các tầng bậc văn hóa tổ chức, giá trị cốt lõi và các chuẩn mực đạo đức hành vi nơi làm việc hiện đại.',
      level: 'Cơ bản',
      duration: '15 phút',
      icon: Users,
      badgeColor: 'bg-blue-50 text-blue-900 border-blue-200'
    },
    {
      id: 'lesson-3',
      title: 'Kỹ năng giao tiếp trực tiếp',
      summary:
        'Làm chủ ngôn ngữ cơ thể, ánh mắt, khoảng cách giao tiếp và giọng điệu chuẩn mực trong các cuộc hội thoại công việc.',
      level: 'Thực hành',
      duration: '20 phút',
      icon: MessageCircle,
      badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200'
    },
    {
      id: 'lesson-4',
      title: 'Lắng nghe tích cực và thấu cảm',
      summary:
        'Kỹ thuật lắng nghe thấu đáo, phản hồi xác nhận và thấu hiểu cảm xúc đối phương để tạo dựng niềm tin bền vững.',
      level: 'Thực hành',
      duration: '18 phút',
      icon: Ear,
      badgeColor: 'bg-purple-50 text-purple-900 border-purple-200'
    },
    {
      id: 'lesson-5',
      title: 'Kỹ năng viết email chuyên nghiệp',
      summary:
        'Quy tắc đặt tiêu đề, bố cục theo cấu trúc BLUF, văn phong trang trọng và nghệ thuật hồi đáp thư từ tinh tế.',
      level: 'Thực hành',
      duration: '25 phút',
      icon: Mail,
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    {
      id: 'lesson-7',
      title: 'Giải quyết xung đột nơi làm việc',
      summary:
        'Phương pháp hòa giải bất đồng theo mô hình Harvard và công thức phản hồi SBI (Tình huống - Hành vi - Tác động).',
      level: 'Nâng cao',
      duration: '22 phút',
      icon: Handshake,
      badgeColor: 'bg-rose-50 text-rose-900 border-rose-200'
    },
    {
      id: 'lesson-6',
      title: 'Xây dựng mối quan hệ đồng nghiệp',
      summary:
        'Nghệ thuật khen ngợi, hỗ trợ lẫn nhau, tôn trọng ranh giới cá nhân và cùng kiến tạo môi trường làm việc tích cực.',
      level: 'Cơ bản',
      duration: '15 phút',
      icon: Users,
      badgeColor: 'bg-cyan-50 text-cyan-900 border-cyan-200'
    }
  ];

  // 4 Skill Groups per Section 6 specification
  const skillGroups = [
    {
      title: 'Giao tiếp với cấp trên',
      audience: 'Lãnh đạo & Quản lý',
      description:
        'Báo cáo rõ ràng theo mô hình BLUF/5W1H, chủ động đề xuất giải pháp khả thi trước khi xin ý kiến, tôn trọng thời gian và tiếp thu chỉ đạo với tinh thần cầu thị.',
      tips: [
        'Trình bày kết quả và kết luận trước, chi tiết giải thích sau.',
        'Khi nêu ra vấn đề, luôn đi kèm tối thiểu 2 phương án giải quyết.',
        'Ghi chép cẩn thận mọi phân công và xác nhận lại mốc thời gian hoàn thành.'
      ],
      color: 'border-blue-200 hover:border-blue-400 bg-white'
    },
    {
      title: 'Giao tiếp với đồng nghiệp',
      audience: 'Nội bộ & Làm việc nhóm',
      description:
        'Hợp tác cởi mở, chia sẻ thông tin và tài liệu kịp thời, tôn trọng không gian làm việc chung, lắng nghe ý kiến đóng góp và ứng xử hòa nhã, tương trợ.',
      tips: [
        'Tôn trọng giờ giấc làm việc tập trung và ranh giới riêng tư của đồng nghiệp.',
        'Phản hồi email/tin nhắn công việc đúng hạn, không để người khác chờ đợi.',
        'Công nhận công sức đóng góp của cộng sự khi báo cáo thành tích chung.'
      ],
      color: 'border-indigo-200 hover:border-indigo-400 bg-white'
    },
    {
      title: 'Giao tiếp với khách hàng & đối tác',
      audience: 'Đối ngoại & Dịch vụ',
      description:
        'Lịch thiệp, chuẩn mực, lắng nghe thấu hiểu nhu cầu của khách hàng, kiềm chế cảm xúc trước khiếu nại và cam kết giải quyết vấn đề thấu đáo, chuyên nghiệp.',
      tips: [
        'Tuyệt đối không đổ lỗi cho bộ phận khác hay hoàn cảnh khách quan trước mặt khách.',
        'Đồng cảm với sự bất tiện của khách trước khi giải thích quy trình kỹ thuật.',
        'Luôn giữ lời hứa về thời hạn cập nhật thông tin và xử lý sự cố.'
      ],
      color: 'border-teal-200 hover:border-teal-400 bg-white'
    },
    {
      title: 'Giao tiếp trong cuộc họp',
      audience: 'Hội nghị & Thảo luận',
      description:
        'Chuẩn bị tài liệu chu đáo trước giờ G, phát biểu súc tích đúng trọng tâm chương trình nghị sự, tôn trọng các góc nhìn khác biệt và ghi nhận biên bản chuẩn xác.',
      tips: [
        'Đến trước giờ họp 5 phút để ổn định vị trí và thiết bị kết nối.',
        'Giơ tay hoặc ra hiệu lịch sự trước khi nêu quan điểm, không ngắt lời người khác.',
        'Tập trung vào giải pháp cho công việc chung, không công kích cá nhân.'
      ],
      color: 'border-amber-200 hover:border-amber-400 bg-white'
    }
  ];

  // 3 Practice Scenarios per Section 7 specification (without revealing answers)
  const previewScenarios = [
    {
      id: 'scenario-4',
      title: 'Tình huống bất đồng ý kiến trong cuộc họp nhóm',
      context:
        'Trong cuộc họp đánh giá kết quả quý, trưởng nhóm đối tác nhận xét chất lượng số liệu từ nhóm bạn gửi sang chưa đạt yêu cầu. Các thành viên trong phòng bắt đầu tranh cãi gay gắt và đổ lỗi cho nhau.',
      problemStatement:
        'Làm sao để hóa giải căng thẳng ngay tại phòng họp, bảo vệ uy tín đội ngũ một cách văn minh và đưa cuộc họp trở lại trọng tâm giải pháp thực tế?',
      tag: 'Kỹ năng Điều phối & Giải quyết xung đột'
    },
    {
      id: 'scenario-2',
      title: 'Tình huống bị giao việc gấp khi đang quá tải deadline',
      context:
        'Vào lúc 15h30 chiều, cấp trên trực tiếp gọi bạn và giao thêm một báo cáo phân tích khẩn cấp cần gửi cho ban giám đốc trước 17h30, trong khi bạn đang dở hạn chót hợp đồng khách hàng quan trọng.',
      problemStatement:
        'Bạn cần từ chối khéo léo hoặc đàm phán thứ tự ưu tiên như thế nào để vừa đảm bảo chất lượng công việc, vừa thể hiện tác phong tinh tế và tận tâm?',
      tag: 'Kỹ năng Đàm phán & Quản lý kỳ vọng'
    },
    {
      id: 'scenario-1',
      title: 'Tình huống phản hồi khi đồng nghiệp làm sai quy trình',
      context:
        'Bạn phát hiện một đồng nghiệp thân thiết cùng nhóm gửi báo cáo số liệu chưa qua kiểm duyệt nội bộ cho đối tác bên ngoài, vi phạm quy trình bảo mật thông tin chung của cơ quan.',
      problemStatement:
        'Làm thế nào để góp ý thẳng thắn giúp đồng nghiệp nhận ra sai sót và khắc phục ngay lập tức mà không làm tổn thương lòng tự trọng hay ảnh hưởng đến mối quan hệ đồng nghiệp?',
      tag: 'Kỹ năng Phản hồi xây dựng (SBI)'
    }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* SECTION 3: HERO AREA */}
      <section
        id="trang-chu"
        className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800"
      >
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_workplace_culture_1792583598654.jpg"
            alt="Văn hóa công sở và giao tiếp chuyên nghiệp"
            className="w-full h-full object-cover opacity-25 scale-105 transform hover:scale-100 transition-transform duration-1000 ease-out"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/40" />
          <div className="absolute inset-0 bg-radial-at-t from-transparent via-transparent to-slate-950/70" />
        </div>

        <div className="relative z-10 p-6 sm:p-12 lg:p-16 max-w-4xl space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Chương trình Chuẩn mực Ứng xử Doanh nghiệp & Công sở 2026</span>
          </div>

          <div className="space-y-3">
            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Văn hoá công sở <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-blue-400 to-indigo-300">
                và Giao tiếp chuyên nghiệp
              </span>
            </h1>

            <p className="text-lg sm:text-2xl font-medium text-blue-100/90 tracking-normal pt-1">
              Xây dựng tác phong chuyên nghiệp. Giao tiếp tinh tế. Thành công bền vững.
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Nền tảng học tập giúp bạn rèn luyện kỹ năng giao tiếp, ứng xử văn minh, làm việc hiệu quả
            và xây dựng môi trường công sở tích cực thông qua bài học thực tế và các tình huống
            tương tác.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {currentUser ? (
              <button
                onClick={onNavigateOverview}
                className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2.5 group cursor-pointer"
              >
                <span>Vào trang học tập cá nhân</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={onNavigateRegister}
                className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2.5 group cursor-pointer"
              >
                <span>Bắt đầu học ngay</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <button
              onClick={() => scrollToSection('bai-hoc')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 backdrop-blur-md transition-colors cursor-pointer flex items-center gap-2"
            >
              <span>Khám phá bài học</span>
              <ChevronRight className="w-4 h-4 text-blue-300" />
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-white/10 text-xs text-slate-300">
            <div className="space-y-0.5">
              <div className="font-extrabold text-white text-xl sm:text-2xl font-mono">10</div>
              <div className="text-slate-400">Chuyên đề bài học</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-extrabold text-white text-xl sm:text-2xl font-mono">08</div>
              <div className="text-slate-400">Tình huống thực tế</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-extrabold text-white text-xl sm:text-2xl font-mono">20+</div>
              <div className="text-slate-400">Câu hỏi trắc nghiệm</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-extrabold text-white text-xl sm:text-2xl font-mono">24/7</div>
              <div className="text-slate-400">Trợ lý AI Cố vấn</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: GIỚI THIỆU WEBSITE & 4 GIÁ TRỊ CỐT LÕI */}
      <section id="gioi-thieu" className="space-y-10 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
            <Building className="w-3.5 h-3.5" />
            <span>Mục tiêu nền tảng</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Xây dựng Chuẩn mực Ứng xử Công sở Văn minh
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Nền tảng được thiết kế với sứ mệnh cung cấp kiến thức nền tảng, hoàn thiện tác phong làm
            việc chuyên nghiệp và rèn luyện kỹ năng mềm cho cán bộ, công chức, viên chức, nhân viên
            văn phòng và sinh viên chuẩn bị bước vào môi trường doanh nghiệp.
          </p>
        </div>

        {/* 4 Core Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">1. Tác phong chuyên nghiệp</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rèn luyện tính kỷ luật, thói quen đúng giờ, trang phục lịch sự chỉn chu, tuân thủ nội
              quy và nêu cao tinh thần chịu trách nhiệm cá nhân trước mọi công việc được giao.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center group-hover:bg-indigo-900 group-hover:text-white transition-colors">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">2. Giao tiếp văn minh</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thực hành lắng nghe tích cực, phản hồi mang tính xây dựng, tôn trọng sự khác biệt cá
              nhân, sử dụng ngôn từ lịch thiệp và giữ gìn thái độ đúng mực trong mọi tình huống.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-900 flex items-center justify-center group-hover:bg-teal-900 group-hover:text-white transition-colors">
              <Handshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">3. Hợp tác hiệu quả</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gắn kết làm việc nhóm, chia sẻ tri thức kịp thời, biết cách giải quyết mâu thuẫn khéo
              léo trên tinh thần hướng đến mục tiêu chung và hỗ trợ đồng nghiệp cùng tiến bộ.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center group-hover:bg-amber-900 group-hover:text-white transition-colors">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">4. Phát triển bản thân</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chủ động tự đánh giá năng lực qua bài trắc nghiệm, tiếp thu góp ý để hoàn thiện kỹ năng,
              xây dựng thương hiệu cá nhân uy tín và mở rộng lộ trình thăng tiến nghề nghiệp.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: BÀI HỌC TIÊU BIỂU (6 BÀI NỔI BẬT) */}
      <section id="bai-hoc" className="space-y-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Khung chương trình chọn lọc</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              6 Bài Học Tiêu Biểu Trong Chương Trình
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Nội dung biên soạn bài bản, tích hợp mô hình phân tích hành vi thực tế, bảng kiểm Nên
              làm / Nên tránh và ví dụ mẫu sinh động.
            </p>
          </div>

          <button
            onClick={onNavigateLessons}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>Xem tất cả bài học (10 bài)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Lesson Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLessons.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between p-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${item.badgeColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                        {item.level}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {item.duration}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-blue-700 font-semibold uppercase tracking-wider block">
                      Chuyên đề 0{index + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors mt-0.5">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onPreviewLesson(item.id)}
                    className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer group-hover:underline"
                  >
                    <span>Xem bài học</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">Bản quyền 2026</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: KỸ NĂNG GIAO TIẾP CÔNG SỞ (4 NHÓM) */}
      <section id="ky-nang" className="space-y-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Kỹ năng ứng xử thực chiến</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            4 Nhóm Kỹ Năng Giao Tiếp Công Sở Thiết Yếu
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Mỗi đối tượng và ngữ cảnh công việc đòi hỏi nghệ thuật ứng xử riêng biệt. Nắm vững 4
            nhóm chuẩn mực giúp bạn tự tin làm chủ mọi tương tác hàng ngày.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skillGroups.map((group, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-7 rounded-2xl border shadow-2xs transition-all space-y-4 ${group.color}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                  {group.audience}
                </span>
                <span className="text-xs font-mono text-slate-400">Nhóm 0{idx + 1}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">{group.title}</h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {group.description}
              </p>

              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 space-y-2">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Lời khuyên ứng xử hữu ích:</span>
                </div>
                <ul className="space-y-1.5">
                  {group.tips.map((tip, tIdx) => (
                    <li key={tIdx} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: THỰC HÀNH TÌNH HUỐNG (3 TÌNH HUỐNG TIÊU BIỂU) */}
      <section id="tinh-huong" className="space-y-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
              <Target className="w-3.5 h-3.5" />
              <span>Phương pháp Case Study</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Mô Phỏng Xử Lý Tình Huống Thực Tế
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Học qua tình huống thực chiến giúp bạn thử nghiệm phản xạ giao tiếp, nhận phân tích tâm
              lý đối phương và nâng cao khả năng hòa giải mâu thuẫn.
            </p>
          </div>

          <button
            onClick={() => onNavigateScenarios()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>Tất cả 8 tình huống</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Scenario Preview Cards (NO answers revealed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewScenarios.map((sc, index) => (
            <div
              key={sc.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 text-[11px] font-semibold border border-indigo-100">
                    Tình huống 0{index + 1}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Bảo mật đáp án</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{sc.title}</h3>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-800 block mb-1">Bối cảnh:</strong>
                    <p className="leading-relaxed">{sc.context}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-950">
                    <strong className="block mb-1 font-semibold text-amber-900">
                      Vấn đề hóc búa cần xử lý:
                    </strong>
                    <p className="leading-relaxed">{sc.problemStatement}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateScenarios(sc.id)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-900 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Thử xử lý tình huống</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: QUY TRÌNH HỌC TẬP VÀ 4 LỢI ÍCH THIẾT THỰC */}
      <section id="quy-trinh" className="space-y-12 scroll-mt-24">
        {/* 3 Step Process */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              Lộ trình chuẩn hóa
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quy Trình Học Tập 3 Bước Tinh Gọn
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Dễ dàng học mọi lúc mọi nơi trên máy tính hoặc điện thoại thông minh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white font-extrabold flex items-center justify-center text-sm font-mono shadow-md">
                01
              </div>
              <h3 className="text-base font-bold text-white">Học lý thuyết thực tiễn</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Nắm bắt kiến thức cốt lõi qua các bài học ngắn gọn 15-20 phút, tập trung vào tình
                huống văn phòng thực tế, mô hình SBI, BLUF và các quy tắc Nên làm / Nên tránh.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white font-extrabold flex items-center justify-center text-sm font-mono shadow-md">
                02
              </div>
              <h3 className="text-base font-bold text-white">Thực hành & Trắc nghiệm</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Thử sức với 8 kịch bản giả lập có tính phân nhánh cao và hoàn thành bộ câu hỏi kiểm
                tra kiến thức để nhận ngay giải thích cặn kẽ vì sao cách làm đó tối ưu.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-extrabold flex items-center justify-center text-sm font-mono shadow-md">
                03
              </div>
              <h3 className="text-base font-bold text-white">Tích lũy & Nhận chứng nhận</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tích lũy điểm kinh nghiệm (XP), mở khóa bộ huy hiệu danh dự, ghi danh bảng xếp hạng
                và theo dõi biểu đồ tiến độ năng lực bản thân qua từng tuần học tập.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Practical Benefits */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              4 Lợi Ích Thiết Thực Khi Hoàn Thành Khóa Học
            </h3>
            <p className="text-xs text-slate-600">
              Trang bị hành trang tác phong chuẩn mực để phát triển bền vững trong môi trường làm việc
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Tự tin trong giao tiếp hàng ngày</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Làm chủ cách chào hỏi, diễn đạt ý kiến trong cuộc họp và viết email không gây hiểu
                  lầm.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Handshake className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hạn chế xung đột & ma sát</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Hóa giải các bất đồng quan điểm trong êm thấm, bảo vệ mối quan hệ gắn kết lâu dài
                  với cộng sự.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Nâng cao cơ hội thăng tiến</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Được cấp trên tin cậy giao phó dự án trọng điểm nhờ tác phong chuẩn xác và có tinh
                  thần chịu trách nhiệm.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hình ảnh cá nhân chuyên nghiệp</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Xây dựng uy tín cá nhân vững vàng, được đồng nghiệp nể trọng và đối tác đánh giá
                  cao.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: KHU VỰC KÊU GỌI HÀNH ĐỘNG (CTA) */}
      <section className="p-8 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-400/20 text-blue-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nâng tầm phong cách công sở 2026</span>
          </div>

          <h2
            className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Bắt đầu xây dựng phong cách công sở chuyên nghiệp ngay hôm nay
          </h2>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Đăng ký tài khoản miễn phí để tham gia học tập, lưu lại tiến độ học tập, thử sức với 8
            tình huống đối thoại thực chiến và nhận tư vấn 24/7 từ Trợ lý AI.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            {currentUser ? (
              <button
                onClick={onNavigateOverview}
                className="px-8 py-3.5 bg-white text-blue-950 hover:bg-blue-50 text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Vào học ngay (Trang tổng quan)
              </button>
            ) : (
              <>
                <button
                  onClick={onNavigateRegister}
                  className="px-8 py-3.5 bg-white text-blue-950 hover:bg-blue-50 text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <span>Đăng ký tài khoản miễn phí</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onNavigateLogin}
                  className="px-6 py-3.5 bg-blue-800/80 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl border border-blue-400/40 backdrop-blur-xs transition-colors cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 10: CHÂN TRANG FOOTER */}
      <footer className="border-t border-slate-200 pt-12 space-y-8 text-xs text-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Author */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                CS
              </div>
              <span className="font-bold text-slate-900 text-sm">
                Văn hoá công sở & Giao tiếp chuyên nghiệp
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Chương trình chuẩn mực ứng xử doanh nghiệp và kỹ năng giao tiếp công sở hiện đại.
            </p>
            <div className="pt-1 text-slate-700 font-semibold text-xs">
              Tác giả: <span className="text-blue-900 font-bold">Nguyễn Tuấn Đạt</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Điều hướng chính
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('trang-chu')}
                  className="hover:text-blue-900 transition-colors cursor-pointer"
                >
                  Trang chủ
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('gioi-thieu')}
                  className="hover:text-blue-900 transition-colors cursor-pointer"
                >
                  Giới thiệu nền tảng
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('bai-hoc')}
                  className="hover:text-blue-900 transition-colors cursor-pointer"
                >
                  Bài học tiêu biểu
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('ky-nang')}
                  className="hover:text-blue-900 transition-colors cursor-pointer"
                >
                  Kỹ năng giao tiếp
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('tinh-huong')}
                  className="hover:text-blue-900 transition-colors cursor-pointer"
                >
                  Thực hành tình huống
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Learning Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Chức năng học tập
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onNavigateLessons}
                  className="hover:text-blue-900 transition-colors cursor-pointer"
                >
                  Thư viện 10 bài học
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateScenarios()}
                  className="hover:text-blue-900 transition-colors cursor-pointer"
                >
                  8 Kịch bản mô phỏng
                </button>
              </li>
              <li>
                {currentUser ? (
                  <button
                    onClick={onNavigateOverview}
                    className="hover:text-blue-900 transition-colors cursor-pointer"
                  >
                    Bảng điều khiển cá nhân
                  </button>
                ) : (
                  <button
                    onClick={onNavigateLogin}
                    className="hover:text-blue-900 transition-colors cursor-pointer"
                  >
                    Đăng nhập tài khoản
                  </button>
                )}
              </li>
              {!currentUser && (
                <li>
                  <button
                    onClick={onNavigateRegister}
                    className="hover:text-blue-900 transition-colors cursor-pointer text-blue-900 font-semibold"
                  >
                    Đăng ký tài khoản mới
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Legal & Policy */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Chính sách & Quy định
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onOpenPolicyModal('terms')}
                  className="hover:text-blue-900 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Điều khoản sử dụng</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPolicyModal('privacy')}
                  className="hover:text-blue-900 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chính sách quyền riêng tư</span>
                </button>
              </li>
              <li className="pt-2 text-slate-500 text-[11px] leading-relaxed">
                Mã hóa mật khẩu chuẩn Salted SHA-256 an toàn. Dữ liệu học tập bảo mật trên thiết bị
                người dùng.
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            © 2026 Văn hoá công sở và Giao tiếp chuyên nghiệp. All rights reserved.
          </div>
          <div>
            Được phát triển bởi tác giả <strong className="text-slate-800">Nguyễn Tuấn Đạt</strong>
          </div>
        </div>
      </footer>
    </div>
  );
};

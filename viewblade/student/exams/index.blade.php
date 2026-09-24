<x-app-layout>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <style>
        body {
            font-family: 'Nunito', sans-serif;
            background-color: #f8fafc;
        }

        [x-cloak] {
            display: none !important;
        }

        /* Custom Scrollbar untuk Tabel */
        .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
        }

        @media (min-width: 640px) {
            .custom-scrollbar::-webkit-scrollbar {
                height: 8px;
            }
        }

        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        @media (max-width: 639px) {

            .exam-table td,
            .exam-table th {
                white-space: normal;
            }
        }
    </style>

    {{-- Topbar & Server Clock --}}
    <div class="bg-white border-b border-indigo-50 shadow-sm relative z-20" x-data="serverClock()">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
            <div class="flex items-center gap-2 sm:gap-3 text-indigo-900">
                <div
                    class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <i class="fas fa-graduation-cap text-sm sm:text-lg"></i>
                </div>
                <div class="flex flex-col">
                    <span class="font-black tracking-tight text-sm sm:text-lg leading-none">PORTAL UJIAN</span>
                    <span
                        class="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">CBT
                        System</span>
                </div>
            </div>

            <div
                class="flex items-center gap-2 sm:gap-4 bg-slate-50 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-100">
                <div
                    class="hidden sm:flex w-8 h-8 rounded-full bg-white items-center justify-center text-indigo-600 shadow-sm">
                    <i class="fas fa-clock text-sm animate-pulse"></i>
                </div>
                <div class="flex flex-col items-end leading-tight">
                    <span class="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide"
                        x-text="dateString">Memuat...</span>
                    <span class="font-mono font-black text-sm sm:text-lg text-indigo-700 tracking-widest"
                        x-text="timeString">--:--:--</span>
                </div>
            </div>
        </div>
    </div>

    {{-- Main App / Alpine Datatable Logic --}}
    <div class="min-h-screen py-4 sm:py-6" x-data="datatableManager()">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {{-- Banner Welcome --}}
            <div
                class="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 mb-3 sm:mb-4 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div
                    class="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-20 mix-blend-overlay">
                </div>
                <div class="absolute left-0 bottom-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -ml-10 -mb-10">
                </div>

                <div
                    class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
                    <div class="w-full lg:w-auto">
                        <div
                            class="inline-flex items-center gap-2 mb-2 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
                            <span class="text-sm sm:text-base">👋</span>
                            <span
                                class="font-bold text-indigo-100 uppercase tracking-widest text-[8px] sm:text-[9px]">Selamat
                                Datang</span>
                        </div>
                        <h1
                            class="text-xl sm:text-2xl md:text-3xl font-black mb-1 sm:mb-2 leading-tight tracking-tight">
                            Halo, {{ Auth::user()->name }}!</h1>
                        <p
                            class="text-indigo-100 font-medium max-w-xl text-[11px] sm:text-xs md:text-sm leading-relaxed opacity-90">
                            Siap untuk menguji kemampuanmu? Pastikan koneksi internet stabil dan kerjakan dengan jujur
                            ya!
                        </p>
                    </div>

                    <div class="flex gap-2 sm:gap-3 shrink-0 w-full lg:w-auto">
                        <div
                            class="flex-1 lg:flex-none bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-3.5 text-center border border-white/20 lg:min-w-[88px]">
                            <span class="block text-xl sm:text-2xl font-black mb-0.5">{{
                                collect($mySessions)->where('is_open', true)->count() }}</span>
                            <span
                                class="text-[8px] sm:text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Tersedia</span>
                        </div>
                        <div
                            class="flex-1 lg:flex-none bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-3.5 text-center border border-white/20 lg:min-w-[88px]">
                            <span class="block text-xl sm:text-2xl font-black mb-0.5">{{
                                collect($mySessions)->where('user_status', 'completed')->count() }}</span>
                            <span
                                class="text-[8px] sm:text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Selesai</span>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Datatable Toolbar --}}
            <div
                class="bg-white p-4 rounded-t-2xl sm:rounded-t-[2rem] border border-slate-200 border-b-0 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-4 mt-4">

                {{-- Toggle Filter Tabs --}}
                <div class="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto overflow-hidden">
                    <button @click="filterTab = 'pending'"
                        :class="filterTab === 'pending' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-700'"
                        class="flex-1 xl:flex-none px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all duration-200 text-center whitespace-nowrap">
                        <i class="fas fa-hourglass-half mr-1 sm:mr-1.5"></i> Belum Selesai
                    </button>
                    <button @click="filterTab = 'completed'"
                        :class="filterTab === 'completed' ? 'bg-white shadow-sm text-emerald-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-700'"
                        class="flex-1 xl:flex-none px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all duration-200 text-center whitespace-nowrap">
                        <i class="fas fa-check-circle mr-1 sm:mr-1.5"></i> Selesai
                    </button>
                </div>

                {{-- Search Box & Page Length --}}
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                    <select x-model="perPage"
                        class="bg-slate-50 border-slate-200 text-slate-600 text-xs sm:text-sm rounded-xl focus:ring-indigo-500 py-2 sm:py-2.5 font-bold w-full sm:w-auto">
                        <option value="5">5 Baris</option>
                        <option value="10">10 Baris</option>
                        <option value="20">20 Baris</option>
                        <option value="50">50 Baris</option>
                    </select>

                    <div class="relative flex-1 sm:w-64">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="fas fa-search text-slate-400"></i>
                        </div>
                        <input type="text" x-model="searchQuery" placeholder="Cari ujian..."
                            class="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-700">
                    </div>
                </div>
            </div>

            {{-- Datatable Content --}}
            <div
                class="bg-white rounded-b-2xl sm:rounded-b-[2rem] border border-slate-200 shadow-sm overflow-hidden relative">
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="exam-table w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                        <thead
                            class="bg-slate-50 border-y border-slate-200 text-slate-500 text-[10px] sm:text-xs uppercase font-black tracking-wider">
                            <tr>
                                <th class="px-3 py-2.5 sm:px-4 sm:py-3 rounded-tl-[2rem]">Ujian & Sesi</th>
                                <th class="px-3 py-2.5 sm:px-4 sm:py-3">Jadwal</th>
                                <th class="px-3 py-2.5 sm:px-4 sm:py-3">Detail</th>
                                <th class="px-3 py-2.5 sm:px-4 sm:py-3 text-center">Status</th>
                                <th class="px-3 py-2.5 sm:px-4 sm:py-3 text-center">Nilai</th>
                                <th class="px-3 py-2.5 sm:px-4 sm:py-3 text-right rounded-tr-[2rem]">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">

                            @forelse($mySessions as $session)
                            <tr class="hover:bg-slate-50/50 transition-colors exam-row"
                                data-status="{{ $session->user_status }}"
                                data-search="{{ strtolower($session->session_name . ' ' . ($session->exam->title ?? '')) }}"
                                style="display: none;">

                                {{-- Kolom 1 --}}
                                <td class="px-3 py-3 sm:px-4 sm:py-3 min-w-[190px]">
                                    <div class="flex flex-col gap-1">
                                        <span
                                            class="inline-flex max-w-max bg-slate-100 text-slate-600 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                            {{ $session->session_name }}
                                        </span>
                                        @if($session->exam)
                                        @if($session->user_status == 'completed')
                                        <a href="{{ route('student.exam.result', $session->exam) }}"
                                            class="group/exam inline-flex items-start gap-1.5 font-black text-indigo-700 hover:text-indigo-500 text-xs sm:text-sm max-w-[220px] sm:max-w-xs whitespace-normal leading-tight">
                                            <span>{{ $session->exam->title }}</span>
                                            <i
                                                class="fas fa-arrow-up-right-from-square text-[10px] mt-1.5 opacity-50 group-hover/exam:opacity-100 shrink-0"></i>
                                        </a>
                                        @elseif($session->is_open && (!isset($session->pivot) || !
                                        $session->pivot->is_locked))
                                        <a href="{{ route('student.exam.verify.show', $session->exam) }}"
                                            class="group/exam inline-flex items-start gap-1.5 font-black text-indigo-700 hover:text-indigo-500 text-xs sm:text-sm max-w-[220px] sm:max-w-xs whitespace-normal leading-tight">
                                            <span>{{ $session->exam->title }}</span>
                                            <i
                                                class="fas fa-play text-[10px] mt-1.5 opacity-50 group-hover/exam:opacity-100 shrink-0"></i>
                                        </a>
                                        @else
                                        <span
                                            class="font-black text-slate-800 text-xs sm:text-sm max-w-[220px] sm:max-w-xs whitespace-normal leading-tight">
                                            {{ $session->exam->title }}
                                        </span>
                                        @endif
                                        @else
                                        <span
                                            class="font-black text-slate-400 text-xs sm:text-sm whitespace-normal leading-tight">
                                            Ujian Tidak Tersedia (Dihapus)
                                        </span>
                                        @endif
                                    </div>
                                </td>

                                {{-- Kolom 2 --}}
                                <td class="px-3 py-2.5 sm:px-4 sm:py-3 min-w-[145px]">
                                    <div class="flex flex-col gap-0.5 text-[10px] sm:text-[11px]">
                                        <div class="flex items-center gap-2 text-emerald-600">
                                            <i class="fas fa-play-circle"></i>
                                            <span class="font-bold">{{
                                                \Carbon\Carbon::parse($session->start_time)->translatedFormat('d M Y,
                                                H:i') }}</span>
                                        </div>
                                        <div class="flex items-center gap-2 text-rose-500">
                                            <i class="fas fa-stop-circle"></i>
                                            <span class="font-bold">{{
                                                \Carbon\Carbon::parse($session->end_time)->translatedFormat('d M Y,
                                                H:i') }}</span>
                                        </div>
                                    </div>
                                </td>

                                {{-- Kolom 3 --}}
                                <td class="px-3 py-2.5 sm:px-4 sm:py-3">
                                    <div class="flex flex-col gap-0.5 text-slate-500 text-[10px] sm:text-[11px]">
                                        <span class="flex items-center gap-2">
                                            <i class="fas fa-stopwatch w-4 text-center"></i> {{
                                            $session->exam?->duration_minutes ?? 0 }} Menit
                                        </span>
                                        <span class="flex items-center gap-2">
                                            <i class="fas fa-file-alt w-4 text-center"></i> {{
                                            $session->exam->questions_count ?? 0 }} Soal
                                        </span>
                                    </div>
                                </td>

                                {{-- Kolom 4 --}}
                                <td class="px-3 py-2.5 sm:px-4 sm:py-3 text-center">
                                    @if($session->user_status == 'completed')
                                    <span
                                        class="inline-flex bg-emerald-50 text-emerald-600 text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-emerald-100 items-center gap-1.5 uppercase">
                                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Selesai
                                    </span>
                                    @elseif(isset($session->pivot) && $session->pivot->is_locked)
                                    <span
                                        class="inline-flex bg-rose-50 text-rose-600 text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-rose-100 items-center gap-1.5 uppercase">
                                        <i class="fas fa-lock"></i> Dikunci
                                    </span>
                                    @elseif($session->is_open)
                                    <span
                                        class="inline-flex bg-indigo-50 text-indigo-600 text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-indigo-100 items-center gap-1.5 uppercase">
                                        <span class="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                                            <span
                                                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span
                                                class="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-indigo-500"></span>
                                        </span>
                                        Tersedia
                                    </span>
                                    @else
                                    <span
                                        class="inline-flex bg-slate-50 text-slate-400 text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-200 items-center gap-1.5 uppercase">
                                        <i class="fas fa-clock"></i> Menunggu
                                    </span>
                                    @endif
                                </td>

                                {{-- Kolom 5 --}}
                                <td class="px-3 py-2.5 sm:px-4 sm:py-3 text-center">
                                    @if($session->user_status == 'completed')
                                    <div
                                        class="inline-flex items-center justify-center min-w-[2.5rem] sm:min-w-[3rem] px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-900 text-white rounded-lg font-black text-xs sm:text-sm">
                                        {{ $session->user_score }}
                                    </div>
                                    @else
                                    <span class="text-slate-300 font-bold">-</span>
                                    @endif
                                </td>

                                {{-- Kolom 6 --}}
                                <td class="px-3 py-2.5 sm:px-4 sm:py-3 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        @if($session->user_status == 'completed')
                                        <a href="{{ route('student.exam.result', $session->exam) }}" title="Lihat Hasil"
                                            class="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg sm:rounded-xl transition-all border border-emerald-100 shadow-sm focus:ring-2 focus:ring-emerald-200">
                                            <i class="fas fa-chart-line text-sm sm:text-base"></i>
                                        </a>

                                        @if(isset($exam) ? $exam->show_explanation : $session->exam->show_explanation)
                                        <a href="{{ route('student.exams.explanation', Hashids::encode($session->id)) }}"
                                            title="Lihat Pembahasan"
                                            class="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg sm:rounded-xl transition-all border border-indigo-100 shadow-sm focus:ring-2 focus:ring-indigo-200">
                                            <i class="fas fa-lightbulb text-sm sm:text-base"></i>
                                        </a>
                                        @endif

                                        @elseif(isset($session->pivot) && $session->pivot->is_locked)
                                        <button disabled title="Akses Terblokir"
                                            class="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-rose-50 text-rose-400 rounded-lg sm:rounded-xl cursor-not-allowed border border-rose-100">
                                            <i class="fas fa-ban text-sm sm:text-base"></i>
                                        </button>

                                        @elseif($session->is_open)
                                        <a href="{{ route('student.exam.verify.show', $session->exam) }}"
                                            title="Kerjakan Ujian"
                                            class="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 focus:ring-2 focus:ring-indigo-300">
                                            <i class="fas fa-play text-sm sm:text-base translate-x-[1px]"></i>
                                        </a>

                                        @else
                                        <button disabled title="Ujian Ditutup"
                                            class="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-slate-50 text-slate-400 rounded-lg sm:rounded-xl cursor-not-allowed border border-slate-200">
                                            <i class="fas fa-lock text-sm sm:text-base"></i>
                                        </button>
                                        @endif
                                    </div>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="6" class="px-6 py-10 sm:py-12 text-center">
                                    <div class="flex flex-col items-center justify-center text-slate-400">
                                        <div
                                            class="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                            <i class="fas fa-inbox text-xl sm:text-2xl"></i>
                                        </div>
                                        <h3 class="text-base sm:text-lg font-black text-slate-600">Tidak ada jadwal
                                            ujian</h3>
                                        <p class="text-xs sm:text-sm font-bold mt-1">Belum ada ujian yang ditugaskan
                                            kepadamu saat ini.</p>
                                    </div>
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>

                {{-- Empty State Alert (Pencarian Tidak Ditemukan / Filter Kosong) --}}
                @if(count($mySessions) > 0)
                <div x-cloak x-show="visibleCount === 0" class="p-8 sm:p-12 text-center bg-slate-50/50">
                    <div
                        class="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 text-slate-400 mb-3 sm:mb-4">
                        <i class="fas fa-search text-xl sm:text-2xl"></i>
                    </div>
                    <h3 class="text-base sm:text-lg font-black text-slate-700">Tidak ada data ditemukan</h3>
                    <p class="text-slate-500 font-medium text-xs sm:text-sm mt-1">Coba ubah kata kunci pencarian atau
                        ganti tab filter di atas.</p>
                </div>
                @endif

                {{-- Bagian Paging (Pagination Controls) --}}
                <div x-cloak x-show="totalPages > 1"
                    class="p-4 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="text-xs sm:text-sm text-slate-500 font-medium text-center md:text-left">
                        Menampilkan halaman <span class="font-bold text-indigo-600" x-text="currentPage"></span>
                        dari <span class="font-bold text-slate-700" x-text="totalPages"></span>
                        <br class="block sm:hidden">
                        (Total: <span x-text="visibleCount"></span> Data)
                    </div>
                    <div class="flex items-center gap-2 w-full md:w-auto justify-center">
                        <button @click="prevPage()" :disabled="currentPage === 1"
                            class="flex-1 md:flex-none px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:hover:text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-all shadow-sm text-center">
                            <i class="fas fa-chevron-left md:mr-1"></i> <span class="hidden md:inline">Prev</span>
                        </button>
                        <button @click="nextPage()" :disabled="currentPage === totalPages"
                            class="flex-1 md:flex-none px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:hover:text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-all shadow-sm text-center">
                            <span class="hidden md:inline">Next</span> <i class="fas fa-chevron-right md:ml-1"></i>
                        </button>
                    </div>
                </div>

                {{-- Jika Controller diubah menjadi ->paginate(), tampilkan link bawaan Laravel --}}
                @if(method_exists($mySessions, 'hasPages') && $mySessions->hasPages())
                <div class="p-4 border-t border-slate-200 bg-slate-50">
                    {{ $mySessions->links() }}
                </div>
                @endif

            </div>

        </div>
    </div>

    <script>
        document.addEventListener('alpine:init', () => {

            // Fitur Tabel Dinamis & Pagination
            Alpine.data('datatableManager', () => ({
                filterTab: 'pending',
                searchQuery: '',
                visibleCount: 1,

                // Variabel Paging
                currentPage: 1,
                perPage: 10,
                totalPages: 1,

                init() {
                    this.$watch('filterTab', () => { this.currentPage = 1; this.updateVisibility(); });
                    this.$watch('searchQuery', () => { this.currentPage = 1; this.updateVisibility(); });
                    this.$watch('perPage', () => { this.currentPage = 1; this.updateVisibility(); });

                    this.$nextTick(() => this.updateVisibility());
                },

                updateVisibility() {
                    this.$nextTick(() => {
                        const allRows = Array.from(document.querySelectorAll('.exam-row'));
                        let filteredRows = [];

                        allRows.forEach(row => {
                            const status = row.dataset.status;
                            const searchStr = row.dataset.search;

                            const matchesTab = this.filterTab === 'completed' ? (status === 'completed') : (status !== 'completed');
                            const matchesSearch = searchStr.includes(this.searchQuery.toLowerCase());

                            if (matchesTab && matchesSearch) {
                                filteredRows.push(row);
                            } else {
                                row.style.display = 'none';
                            }
                        });

                        this.visibleCount = filteredRows.length;
                        this.totalPages = Math.ceil(this.visibleCount / parseInt(this.perPage)) || 1;

                        const startIdx = (this.currentPage - 1) * parseInt(this.perPage);
                        const endIdx = startIdx + parseInt(this.perPage);

                        filteredRows.forEach((row, index) => {
                            if (index >= startIdx && index < endIdx) {
                                row.style.display = '';
                            } else {
                                row.style.display = 'none';
                            }
                        });
                    });
                },

                nextPage() {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.updateVisibility();
                    }
                },

                prevPage() {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.updateVisibility();
                    }
                }
            }));

            // Fitur Waktu Server
            Alpine.data('serverClock', () => ({
                timeString: '--:--:--',
                dateString: 'Memuat Tanggal...',
                serverTime: null,

                init() {
                    this.serverTime = new Date('{{ now()->toIso8601String() }}');
                    this.updateClock();
                    setInterval(() => {
                        this.serverTime.setSeconds(this.serverTime.getSeconds() + 1);
                        this.updateClock();
                    }, 1000);
                },

                updateClock() {
                    this.timeString = this.serverTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g, ':');
                    this.dateString = this.serverTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
                }
            }));
        });

        document.addEventListener('DOMContentLoaded', () => {
            @if(session('error'))
                Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak!',
                    text: @json(session('error')),
                    confirmButtonText: 'Mengerti',
                    confirmButtonColor: '#ef4444',
                    background: '#fff',
                    allowOutsideClick: false
                });
            @endif

            @if(session('success'))
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: @json(session('success')),
                    confirmButtonText: 'Tutup',
                    confirmButtonColor: '#10b981',
                    timer: 4000,
                    timerProgressBar: true
                });
            @endif

            @if(session('info'))
                Swal.fire({
                    icon: 'info',
                    title: 'Informasi',
                    text: @json(session('info')),
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#3b82f6'
                });
            @endif
        });
    </script>
</x-app-layout>
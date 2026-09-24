<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center gap-4">
            <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg text-white shrink-0">
                <i class="fas fa-smile text-xl"></i>
            </div>
            <div>
                <h2 class="font-black text-2xl text-slate-800 tracking-tight">Ruang Belajar Siswa</h2>
                <p class="text-sm text-slate-500 font-bold">Selamat belajar dan semoga sukses ujiannya!</p>
            </div>
        </div>
    </x-slot>

    <div class="py-6 sm:py-8 mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">

        {{-- Banner Sapaan Siswa --}}
        <div
            class="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-emerald-100 relative overflow-hidden text-white">
            <div
                class="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none">
            </div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div
                        class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                        <span class="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
                        Selamat Datang
                    </div>
                    <h1 class="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
                        Halo, {{ explode(' ', trim($user->name))[0] }}! ✨
                    </h1>
                    <p class="text-emerald-50 font-medium text-sm sm:text-base max-w-xl leading-relaxed">
                        Hari ini adalah hari yang cerah untuk belajar. Periksa jadwal ujianmu dan kerjakan soal dengan
                        teliti serta jujur ya!
                    </p>
                </div>
                <div
                    class="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center shrink-0 min-w-32">
                    <div class="text-xs font-black text-emerald-200 uppercase tracking-wider">Kelas Anda</div>
                    <div class="text-xl sm:text-2xl font-black mt-1">{{ $classrooms->join(', ') ?: 'Belum diatur' }}</div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Ujian</p>
                <p class="text-2xl font-black text-slate-800 mt-1">{{ $stats['total_ujian'] }}</p>
            </div>
            <div class="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Sedang Aktif</p>
                <p class="text-2xl font-black text-emerald-600 mt-1">{{ $stats['ujian_aktif'] }}</p>
            </div>
            <div class="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Selesai</p>
                <p class="text-2xl font-black text-blue-600 mt-1">{{ $stats['ujian_selesai'] }}</p>
            </div>
            <div class="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Rata-rata Nilai</p>
                <p class="text-2xl font-black text-amber-600 mt-1">{{ $stats['rata_nilai'] !== null ? number_format($stats['rata_nilai'], 1) : '-' }}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 class="font-black text-slate-800">Agenda Ujian</h3>
                    <a href="{{ route('student.index') }}" class="text-xs font-black text-emerald-600">Ruang ujian</a>
                </div>
                <div class="divide-y divide-slate-100">
                    @forelse($upcomingSessions as $session)
                    <div class="px-5 py-3">
                        <p class="font-bold text-sm text-slate-700 truncate">{{ $session->exam->title }}</p>
                        <p class="text-xs text-slate-400 mt-1">{{ $session->start_time->format('d M Y, H:i') }} - {{ $session->end_time->format('H:i') }}</p>
                    </div>
                    @empty
                    <p class="px-5 py-8 text-center text-sm text-slate-400">Tidak ada agenda ujian terdekat.</p>
                    @endforelse
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div class="px-5 py-4 border-b border-slate-100">
                    <h3 class="font-black text-slate-800">Hasil Terbaru</h3>
                </div>
                <div class="divide-y divide-slate-100">
                    @forelse($recentResults as $session)
                    <div class="px-5 py-3 flex items-center justify-between gap-3">
                        <p class="font-bold text-sm text-slate-700 truncate">{{ $session->exam->title }}</p>
                        <span class="shrink-0 font-black text-emerald-600">{{ number_format((float) $session->pivot->final_score, 1) }}</span>
                    </div>
                    @empty
                    <p class="px-5 py-8 text-center text-sm text-slate-400">Belum ada hasil ujian.</p>
                    @endforelse
                </div>
            </div>
        </div>

        {{-- Grid Akses Menu Utama --}}
        <div>
            <h3 class="font-black text-lg text-slate-800 mb-4">Pilih Menu Belajar</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

                {{-- Kotak Masuk Ruang Ujian --}}
                <a href="{{ route('student.index') }}"
                    class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition-all group h-52">
                    <div
                        class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                        <i class="fas fa-pen-alt"></i>
                    </div>
                    <div>
                        <h4 class="font-black text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">
                            Ruang Ujian Utama</h4>
                        <p class="text-xs text-slate-400 font-bold mt-1 leading-relaxed">Masuk ke sini untuk melihat
                            daftar ujian sekolah dan memulainya.</p>
                    </div>
                </a>

                {{-- Kotak Masuk Latihan Ujian Matematika --}}
                <a href="{{ route('student.math.index') }}"
                    class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all group h-52">
                    <div
                        class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <div>
                        <h4 class="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                            Latihan Hitung MTK</h4>
                        <p class="text-xs text-slate-400 font-bold mt-1 leading-relaxed">Uji kemampuan berhitungmu
                            dengan soal matematika seru di sini.</p>
                    </div>
                </a>

                {{-- Kotak Modul Interaktif Kawan Hitung --}}
                <a href="{{ route('hitung.index') }}"
                    class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-purple-400 hover:shadow-md transition-all group h-52">
                    <div
                        class="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                        <span>🧮</span>
                    </div>
                    <div>
                        <h4 class="font-black text-slate-800 text-lg group-hover:text-purple-600 transition-colors">
                            Kawan Hitung</h4>
                        <p class="text-xs text-slate-400 font-bold mt-1 leading-relaxed">Modul bermain sambil belajar
                            hitungan matematika interaktif.</p>
                    </div>
                </a>

            </div>
        </div>

    </div>
</x-app-layout>
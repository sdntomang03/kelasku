<x-app-layout>
    <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

        {{-- ================= HEADER & NAVIGASI ================= --}}
        <div class="mb-8 flex items-center gap-4">
            <a href="{{ route('student.math.index') }}"
                class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm border border-slate-200 group">
                <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
            </a>
            <div>
                <h2 class="text-3xl font-black text-slate-800 tracking-tight leading-none">Hasil Misi</h2>
                <p class="text-slate-500 font-bold mt-2 text-sm">{{ $examUser->exam->title }}</p>
            </div>
        </div>

        {{-- ================= KARTU NILAI SISWA ================= --}}
        <div
            class="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 relative overflow-hidden flex flex-col md:flex-row gap-8 justify-between items-center text-center md:text-left">

            {{-- Aksen Latar --}}
            <div
                class="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-10">
            </div>

            <div class="relative z-10">
                <div
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 font-black text-sm uppercase tracking-widest mb-4 border border-emerald-100">
                    <i class="fas fa-check-circle"></i> Misi Selesai
                </div>
                <h3 class="font-black text-3xl text-slate-800 mb-2">Kerja Bagus!</h3>
                <p class="text-slate-500 font-medium max-w-md">
                    Kamu telah menyelesaikan tugas tes ini pada <br>
                    <strong class="text-slate-700">{{
                        \Carbon\Carbon::parse($examUser->finished_at)->timezone('Asia/Jakarta')->format('d M Y, H:i')
                        }}</strong>
                </p>
            </div>

            <div
                class="relative z-10 flex flex-col items-center justify-center bg-slate-50 border-2 border-slate-100 w-40 h-40 rounded-full shadow-inner shrink-0">
                <span class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Skor Akhir</span>
                <span
                    class="text-5xl font-black {{ $examUser->score >= 70 ? 'text-emerald-500' : 'text-rose-500' }} drop-shadow-sm">
                    {{ $examUser->score ?? 0 }}
                </span>
            </div>
        </div>

        {{-- ================= LOGIKA TAMPILKAN PEMBAHASAN ================= --}}
        @if($examUser->exam->show_explanation)

        {{-- 1. Catatan Guru (Jika Ada Teksnya) --}}
        @if(!empty($examUser->exam->explanation_text))
        <div
            class="bg-indigo-50/70 border border-indigo-100 p-6 md:p-8 rounded-[2rem] mb-8 relative overflow-hidden shadow-sm">
            <div class="absolute -right-6 -top-6 text-indigo-100 text-9xl pointer-events-none opacity-50 rotate-12">
                <i class="fas fa-book-open"></i>
            </div>

            <div class="relative z-10">
                <div class="flex items-center gap-4 mb-5">
                    <div
                        class="w-14 h-14 rounded-full bg-white text-indigo-500 flex items-center justify-center text-2xl shadow-sm border border-indigo-50">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div>
                        <h3 class="font-black text-2xl text-indigo-900 tracking-tight">Catatan & Pembahasan</h3>
                        <p class="text-indigo-600/70 text-sm font-bold">Pesan dari Gurumu</p>
                    </div>
                </div>

                <div
                    class="text-indigo-900/80 font-medium leading-relaxed bg-white/80 p-5 sm:p-6 rounded-2xl border border-white shadow-sm">
                    {!! nl2br(e($examUser->exam->explanation_text)) !!}
                </div>
            </div>
        </div>
        @endif

        {{-- 2. Daftar Kunci Jawaban Soal --}}
        <div class="mb-6 px-2 border-b border-slate-200 pb-4">
            <h3 class="font-black text-xl text-slate-800 flex items-center gap-2">
                <i class="fas fa-tasks text-indigo-500"></i> Detail Jawabanmu
            </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @foreach($questions as $index => $q)
            @php
            $isCorrect = $q->is_correct;
            $isUnanswered = is_null($q->student_answer);

            if ($isUnanswered) {
            $theme = ['border' => 'border-slate-300', 'bg' => 'bg-slate-50', 'text' => 'text-slate-500', 'icon' =>
            'fa-minus-circle', 'label' => 'KOSONG'];
            } elseif ($isCorrect) {
            $theme = ['border' => 'border-emerald-300', 'bg' => 'bg-emerald-50/50', 'text' => 'text-emerald-600', 'icon'
            => 'fa-check-circle', 'label' => 'BENAR'];
            } else {
            $theme = ['border' => 'border-rose-300', 'bg' => 'bg-rose-50/50', 'text' => 'text-rose-600', 'icon' =>
            'fa-times-circle', 'label' => 'SALAH'];
            }

            $opIcon = $q->operator == 'x' ? '&times;' : ($q->operator == ':' ? '&divide;' : $q->operator);
            @endphp

            <div
                class="rounded-[1.5rem] border-2 {{ $theme['border'] }} {{ $theme['bg'] }} flex flex-col overflow-hidden shadow-sm">
                <div class="flex justify-between items-center px-5 py-3 border-b border-black/5 bg-white/50">
                    <span class="text-[10px] font-black text-slate-400 tracking-widest uppercase">Soal #{{
                        str_pad($index + 1, 2, '0', STR_PAD_LEFT) }}</span>
                    <div
                        class="flex items-center gap-1.5 text-[10px] font-black tracking-wider uppercase {{ $theme['text'] }}">
                        <i class="fas {{ $theme['icon'] }} text-sm"></i> {{ $theme['label'] }}
                    </div>
                </div>

                <div class="flex-1 flex flex-col items-center justify-center p-6">
                    <div class="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
                        <span>{{ $q->num1 }}</span>
                        <span
                            class="text-indigo-500 bg-indigo-50 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm text-xl">{!!
                            $opIcon !!}</span>
                        <span>{{ $q->num2 }}</span>
                    </div>
                    <div class="mt-4 flex items-center gap-3 text-lg font-bold text-slate-400">
                        =
                        <div
                            class="min-w-[60px] text-center pb-1 border-b-4 {{ $isUnanswered ? 'border-slate-300' : ($isCorrect ? 'border-emerald-400' : 'border-rose-400') }}">
                            <span class="font-black text-3xl {{ $theme['text'] }} drop-shadow-sm">
                                {{ $isUnanswered ? '?' : $q->student_answer }}
                            </span>
                        </div>
                    </div>
                </div>

                @if(!$isCorrect)
                <div
                    class="bg-white border-t border-rose-100 p-3 text-center flex flex-col justify-center items-center gap-1">
                    <span class="text-[9px] font-black text-rose-400 uppercase tracking-widest">Kunci Jawaban:</span>
                    <span class="text-lg font-black text-emerald-600">{{ $q->correct_answer }}</span>
                </div>
                @endif
            </div>
            @endforeach
        </div>

        @else
        {{-- JIKA GURU MEMATIKAN PENGATURAN PEMBAHASAN --}}
        <div
            class="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center text-slate-400">
            <i class="fas fa-lock text-5xl mb-4 text-slate-300"></i>
            <h3 class="text-xl font-black text-slate-600 mb-2">Detail Jawaban Dirahasiakan</h3>
            <p class="font-bold max-w-md">Guru belum mengaktifkan pengaturan pembahasan untuk misi ini. Silakan hubungi
                gurumu jika ada pertanyaan tentang nilaimu.</p>
        </div>
        @endif

    </div>
</x-app-layout>
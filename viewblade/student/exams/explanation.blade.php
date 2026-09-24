<x-app-layout>

    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Pembahasan Ujian') }}
        </h2>
        {{-- CSS KaTeX --}}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </x-slot>

    <div class="py-12">
        <div class="max-w-5xl mx-auto sm:px-6 lg:px-8">

            {{-- HEADER INFO UJIAN --}}
            <div
                class="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 class="text-2xl font-black text-slate-800">Pembahasan Ujian</h1>
                    <p class="text-slate-500 mt-1 font-bold">{{ $examSession->exam->title }}</p>
                </div>
                <div
                    class="bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl text-center shrink-0">
                    <span class="block text-xs uppercase tracking-widest font-bold opacity-70">Nilai Akhir</span>
                    <span class="block text-3xl font-black">{{ $participant->score }}</span>
                </div>
            </div>

            {{-- DAFTAR SOAL & PEMBAHASAN --}}
            <div class="space-y-8" id="explanation-container">
                @foreach($examSession->exam->questions as $index => $q)
                <div
                    class="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 relative overflow-hidden">

                    {{-- Garis gradasi atas --}}
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                    {{-- Header Soal --}}
                    <div class="flex items-center gap-3 mb-6">
                        <span class="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black shadow-md text-sm">
                            NO. {{ $index + 1 }}
                        </span>
                        <span
                            class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                            @if($q->type === 'single_choice') Pilihan Ganda
                            @elseif($q->type === 'complex_choice') PG Kompleks
                            @elseif($q->type === 'tkp') TKP Berbobot
                            @elseif($q->type === 'true_false' || $q->type === 'true_false_multi') Benar / Salah
                            @elseif($q->type === 'matching') Menjodohkan
                            @elseif($q->type === 'essay') Isian Singkat
                            @else {{ str_replace('_', ' ', $q->type) }} @endif
                        </span>
                    </div>

                    {{-- Narasi Soal --}}
                    <div
                        class="prose prose-indigo max-w-none text-slate-700 mb-8 overflow-x-auto __se__katex_container">
                        {!! $q->content !!}
                    </div>

                    @php
                    // Ambil jawaban aktual siswa & Decode JSON jika berbentuk string Array/Object
                    $studentAnsRaw = $studentAnswers[$q->id] ?? null;
                    $studentAns = $studentAnsRaw;

                    if (is_string($studentAnsRaw)) {
                    $decoded = json_decode($studentAnsRaw, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                    $studentAns = $decoded;
                    }
                    }
                    @endphp

                    {{-- 1. PREVIEW: PILIHAN GANDA & KOMPLEKS --}}
                    @if(in_array($q->type, ['single_choice', 'complex_choice', 'tkp']))
                    <div class="space-y-3 mb-8 pl-0 sm:pl-4 border-l-2 border-slate-100">
                        @foreach($q->options as $opt)
                        @php
                        // Cek apakah opsi ini dipilih siswa
                        $isStudentAnswer = false;
                        if ($studentAns !== null) {
                        $isStudentAnswer = is_array($studentAns) ? in_array($opt->id, $studentAns) : ($studentAns ==
                        $opt->id);
                        }

                        // Logika Pewarnaan Opsi
                        $bgClass = 'bg-slate-50 border-slate-100 opacity-70';
                        $iconClass = 'fas fa-circle text-slate-300';

                        if ($q->type === 'tkp') {
                        $bgClass = 'bg-slate-50 border-slate-100';
                        $iconClass = 'fas fa-weight-hanging text-indigo-400 text-lg';
                        } elseif ($opt->is_correct) {
                        $bgClass = 'bg-emerald-50 border-emerald-400';
                        $iconClass = 'fas fa-check-circle text-emerald-500 text-xl';
                        } elseif ($isStudentAnswer && !$opt->is_correct) {
                        $bgClass = 'bg-rose-50 border-rose-400';
                        $iconClass = 'fas fa-times-circle text-rose-500 text-xl';
                        }
                        @endphp

                        <div class="p-4 rounded-2xl border-2 transition-all flex items-start gap-4 {{ $bgClass }}">
                            <div class="mt-1 shrink-0"><i class="{{ $iconClass }}"></i></div>
                            <div
                                class="flex-1 prose prose-sm max-w-none text-slate-700 overflow-x-auto __se__katex_container">
                                {!! $opt->option_text !!}
                            </div>
                            @if($q->type === 'tkp')
                            <span class="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black">
                                Bobot {{ number_format((float) $opt->score_weight, 2) }}
                            </span>
                            @endif

                            @if($isStudentAnswer)
                            <div class="shrink-0 mt-0.5">
                                <span
                                    class="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-black tracking-widest uppercase shadow-sm">
                                    {{ $q->type === 'tkp' ? 'Pilihan Kamu' : 'Jawaban Kamu' }}
                                </span>
                            </div>
                            @endif
                        </div>
                        @endforeach
                    </div>

                    {{-- 2. PREVIEW: BENAR SALAH (TRUE/FALSE) --}}
                    @elseif(in_array($q->type, ['true_false', 'true_false_multi']))
                    <div class="space-y-3 mb-8 pl-0 sm:pl-4 border-l-2 border-slate-100">
                        <div class="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                            <table class="w-full text-sm text-left">
                                <thead
                                    class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th class="px-5 py-4 w-3/5">Pernyataan</th>
                                        <th class="px-5 py-4 text-center border-l border-slate-200">Kunci Benar</th>
                                        <th class="px-5 py-4 text-center border-l border-slate-200">Jawaban Kamu</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 bg-white">
                                    @foreach($q->options as $opt)
                                    @php
                                    $studentOptAns = is_array($studentAns) ? ($studentAns[$opt->id] ?? null) : null;
                                    $isAnswered = $studentOptAns !== null;
                                    $correctVal = $opt->is_correct ? 'benar' : 'salah';
                                    $studentVal = is_bool($studentOptAns)
                                        ? ($studentOptAns ? 'benar' : 'salah')
                                        : strtolower(trim((string) $studentOptAns));
                                    if (in_array($studentVal, ['1', 'true'], true)) {
                                        $studentVal = 'benar';
                                    } elseif (in_array($studentVal, ['0', 'false'], true)) {
                                        $studentVal = 'salah';
                                    }
                                    $isCorrect = ($isAnswered && $studentVal === $correctVal);
                                    @endphp
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="px-5 py-4 font-bold text-slate-700 __se__katex_container">
                                            {!! $opt->option_text !!}
                                        </td>
                                        <td class="px-5 py-4 text-center border-l border-slate-200">
                                            <span
                                                class="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-sm {{ $correctVal ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600' }}">
                                                {{ $correctVal ? 'BENAR' : 'SALAH' }}
                                            </span>
                                        </td>
                                        <td class="px-5 py-4 text-center border-l border-slate-200">
                                            @if($isAnswered)
                                            <span
                                                class="px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-sm inline-flex items-center gap-1.5 {{ $isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white' }}">
                                                <i class="fas {{ $isCorrect ? 'fa-check' : 'fa-times' }}"></i>
                                                {{ strtoupper($studentVal) }}
                                            </span>
                                            @else
                                            <span class="text-xs text-slate-400 italic font-bold">- Kosong -</span>
                                            @endif
                                        </td>
                                    </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {{-- 3. PREVIEW: MENJODOHKAN (MATCHING) --}}
                    @elseif($q->type === 'matching')
                    <div class="space-y-5 mb-8 pl-0 sm:pl-4 border-l-2 border-slate-100">
                        @php
                        $matchedAnswers = [];
                        if (!empty($studentAns)) {
                        $matchedAnswers = is_string($studentAns) ? json_decode($studentAns, true) : (array) $studentAns;
                        }
                        @endphp

                        @foreach($q->matches ?? [] as $m)
                        @php
                        $studentTargetId = $matchedAnswers[$m->id] ?? null;
                        $studentTargetHtml = '<span class="text-slate-400 italic font-medium">- Tidak Dijawab -</span>';
                        $isMatchCorrect = false;

                        if($studentTargetId) {
                        if($studentTargetId == $m->id) {
                        $isMatchCorrect = true;
                        $studentTargetHtml = $m->target_text;
                        } else {
                        $fallbackTarget = collect($q->matches)->firstWhere('id', $studentTargetId);
                        $studentTargetHtml = $fallbackTarget ? $fallbackTarget->target_text : '<span
                            class="text-rose-500">- Tidak Valid -</span>';
                        }
                        }
                        @endphp

                        <div class="flex flex-col md:flex-row items-center gap-2 md:gap-4 relative w-full">
                            {{-- KOTAK PREMIS (KIRI) --}}
                            <div
                                class="match-item w-full md:w-5/12 !cursor-default !border-slate-300 shadow-sm relative">
                                <div
                                    class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 opacity-70">
                                    Premis:</div>
                                <div class="prose prose-sm max-w-none text-slate-700 font-bold __se__katex_container">
                                    {!! $m->premise_text !!}</div>
                                <div class="match-dot dot-right hidden md:block"></div>
                            </div>

                            {{-- IKON PENGHUBUNG --}}
                            <div class="shrink-0 text-slate-300 flex flex-col items-center">
                                <i class="fas fa-link text-lg md:rotate-0 rotate-90 my-1 md:my-0"></i>
                            </div>

                            {{-- KOTAK TARGET JAWABAN SISWA (KANAN) --}}
                            <div
                                class="match-item w-full md:w-5/12 !cursor-default shadow-sm relative {{ $isMatchCorrect ? '!border-emerald-500 !bg-emerald-50' : '!border-rose-500 !bg-rose-50' }}">
                                <div
                                    class="match-dot dot-left hidden md:block {{ $isMatchCorrect ? '!bg-emerald-500' : '!bg-rose-500' }}">
                                </div>
                                <div class="flex items-center gap-2 mb-2">
                                    <i
                                        class="fas {{ $isMatchCorrect ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-rose-500' }}"></i>
                                    <div
                                        class="text-xs font-black {{ $isMatchCorrect ? 'text-emerald-600' : 'text-rose-600' }} uppercase tracking-widest opacity-70">
                                        Jawaban Kamu</div>
                                </div>
                                <div
                                    class="prose prose-sm max-w-none font-bold {{ $isMatchCorrect ? 'text-emerald-800' : 'text-rose-800' }} __se__katex_container">
                                    {!! $studentTargetHtml !!}
                                </div>

                                {{-- Jika salah, tunjukkan pasangan yang benar di bawahnya --}}
                                @if(!$isMatchCorrect)
                                <div
                                    class="mt-4 pt-3 border-t border-rose-200 text-xs text-rose-700 __se__katex_container">
                                    <span class="font-black uppercase tracking-widest block mb-1">Seharusnya:</span>
                                    <div class="font-bold opacity-80">{!! $m->target_text !!}</div>
                                </div>
                                @endif
                            </div>
                        </div>
                        @endforeach
                    </div>

                    {{-- 4. PREVIEW: ESSAY / ISIAN SINGKAT --}}
                    @elseif($q->type === 'essay')
                    <div class="space-y-8 mb-8 pl-0 sm:pl-4 border-l-2 border-slate-100">

                        {{-- Kotak Jawaban Siswa --}}
                        <div class="relative pt-6">
                            <span
                                class="text-[10px] bg-slate-800 text-white px-4 py-2 rounded-t-xl font-black uppercase tracking-widest absolute top-0 left-0 shadow-sm">
                                Jawaban Kamu
                            </span>
                            <div
                                class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl rounded-tl-none p-5 text-slate-700 font-bold whitespace-pre-wrap min-h-[100px] __se__katex_container shadow-inner">
                                {{ is_string($studentAnsRaw) && $studentAnsRaw !== '' ? $studentAnsRaw : '- Kosong
                                (Siswa tidak memberikan jawaban) -' }}
                            </div>
                        </div>

                        {{-- Kotak Kunci Jawaban --}}
                        <div class="relative pt-6">
                            <span
                                class="text-[10px] bg-emerald-500 text-white px-4 py-2 rounded-t-xl font-black uppercase tracking-widest absolute top-0 left-0 shadow-sm">
                                Kunci / Kata Kunci
                            </span>
                            <div
                                class="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl rounded-tl-none p-5 text-emerald-800 font-bold shadow-sm">
                                <ul class="list-disc list-inside space-y-2">
                                    @forelse($q->options as $opt)
                                    <li class="__se__katex_container marker:text-emerald-400">{!! $opt->option_text !!}
                                    </li>
                                    @empty
                                    <li class="italic text-emerald-600/70 list-none font-medium">Kunci jawaban belum
                                        diatur oleh guru.</li>
                                    @endforelse
                                </ul>
                            </div>
                        </div>

                    </div>
                    @endif

                    {{-- PEMBAHASAN GURU (JIKA ADA) --}}
                    @if($q->explanation)
                    <div
                        class="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 relative mt-4">
                        <div class="flex items-center gap-2 mb-4">
                            <i class="fas fa-lightbulb text-amber-500 text-lg shadow-amber-200"></i>
                            <h4 class="font-black text-indigo-900 tracking-wide text-sm uppercase">Penjelasan &
                                Pembahasan</h4>
                        </div>
                        <div
                            class="prose prose-indigo max-w-none text-slate-700 text-sm md:text-base leading-relaxed overflow-x-auto __se__katex_container">
                            {!! $q->explanation !!}
                        </div>
                    </div>
                    @else
                    <div class="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-4 text-center mt-4">
                        <span class="text-slate-400 text-sm italic">Tidak ada pembahasan khusus untuk soal ini.</span>
                    </div>
                    @endif

                </div>
                @endforeach
            </div>

            {{-- TOMBOL KEMBALI --}}
            <div class="mt-10 text-center">
                <a href="{{ route('student.dashboard') }}"
                    class="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg">
                    <i class="fas fa-arrow-left"></i> Kembali ke Dashboard
                </a>
            </div>

        </div>
    </div>

    {{-- SCRIPT KATEX AUTO-RENDER (Menerjemahkan rumus saat halaman dimuat) --}}
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/contrib/auto-render.min.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            const container = document.getElementById('explanation-container');
            if (!container) return;

            // 1. Render rumus manual ($...$ atau $$...$$) di seluruh teks
            if (typeof renderMathInElement !== 'undefined') {
                renderMathInElement(container, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });
            }

            // 2. Render rumus buatan tombol Math Quill Editor (__se__katex)
            if (typeof katex !== 'undefined') {
                container.querySelectorAll('.__se__katex, .ql-formula').forEach(el => {
                    let exp = el.getAttribute('data-exp') || el.getAttribute('data-value');
                    if (exp) {
                        // Bersihkan string HTML Entities bawaan database
                        let decodedExp = exp.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
                                            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
                                            .replace(/\u00A0/g, ' ').replace(/<br\s*\/?>/gi, '\n');
                        try {
                            katex.render(decodedExp, el, {
                                throwOnError: false,
                                displayMode: el.style.display === 'block' || el.tagName === 'DIV'
                            });
                        } catch (e) {
                            console.error("KaTeX Render Error:", e);
                        }
                    }
                });
            }
        });
    </script>
</x-app-layout>

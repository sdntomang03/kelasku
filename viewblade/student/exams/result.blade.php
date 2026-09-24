<x-cbt-layout>
    @push('styles')
    <style>
        body {
            overflow-y: auto !important;
            overflow-x: hidden;
        }
    </style>
    @endpush

    <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-12">
        <div class="max-w-5xl mx-auto space-y-6">

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <a href="{{ route('student.dashboard') }}"
                    class="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm w-full sm:w-auto">
                    <i class="fas fa-house"></i> Kembali ke Home
                </a>
                <a href="{{ route('student.index') }}"
                    class="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm w-full sm:w-auto">
                    <i class="fas fa-clipboard-list"></i> Ruang Ujian
                </a>
            </div>

            <!-- Header Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div
                    class="bg-indigo-700 px-6 py-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <!-- Subtle pattern background -->
                    <div class="absolute inset-0 opacity-10"
                        style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;">
                    </div>

                    <div class="relative flex items-center gap-5 z-10">
                        <div
                            class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
                            <i class="fas fa-clipboard-check text-white text-3xl"></i>
                        </div>
                        <div class="text-white">
                            <p class="text-indigo-200 text-xs font-semibold uppercase tracking-widest">Ringkasan Ujian
                            </p>
                            <h1 class="text-2xl sm:text-3xl font-bold mt-1 text-white">{{ $exam->title }}</h1>
                        </div>
                    </div>
                    <div class="relative z-10 md:text-right">
                        <p class="text-indigo-200 text-xs font-semibold uppercase tracking-widest">
                            {{ $resultMode === 'total' ? 'Total Perolehan Poin' : 'Nilai Akhir' }}
                        </p>
                        <div class="mt-1 text-5xl sm:text-6xl font-bold text-white leading-none tracking-tight">
                            {{ number_format((float) $attempt->final_score, 2) }}
                        </div>
                        <p class="mt-2 text-sm text-indigo-200">Sesi ujian telah diselesaikan</p>
                    </div>
                </div>



            </div>

            <!-- Section Details -->
            <div class="pt-4">
                <div class="flex items-end justify-between gap-4 mb-5 px-1">
                    <div>
                        <h2 class="text-xl font-bold text-slate-800">Perincian Penilaian</h2>
                        <p class="text-sm text-slate-500 mt-1">Distribusi nilai per bagian ujian</p>
                    </div>
                    <span
                        class="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                        <i class="fas fa-list-ul text-slate-400"></i> {{ $sectionResults->count() }} Section
                    </span>
                </div>

                <div class="grid grid-cols-1 {{ $sectionResults->count() > 1 ? 'lg:grid-cols-2' : '' }} gap-5">
                    @foreach($sectionResults as $section)
                    <div
                        class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-indigo-100 transition duration-200">
                        <div class="flex items-start justify-between gap-4">
                            <div class="min-w-0">
                                <h3 class="font-semibold text-lg text-slate-800 truncate">{{ $section['name'] }}</h3>
                                <p class="mt-1 text-sm text-slate-500">{{ $section['question_count'] }} Pertanyaan</p>
                            </div>
                            <div class="text-right shrink-0">
                                <p class="text-2xl font-bold text-slate-800">{{ number_format($section['display_score'],
                                    2) }}
                                </p>
                                <p class="text-xs text-slate-500">
                                    {{ $section['result_mode'] === 'total' ? 'poin' : '%' }}
                                </p>
                            </div>
                        </div>

                        <div class="mt-5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            @php
                            $scorePercentage = min(100, max(0, $section['score']));
                            $barColor = $scorePercentage >= 75 ? 'bg-emerald-500' : ($scorePercentage >= 50 ?
                            'bg-amber-400' : 'bg-rose-500');
                            @endphp
                            <div class="h-full rounded-full {{ $barColor }} transition-all duration-500"
                                style="width: {{ $scorePercentage }}%"></div>
                        </div>

                        <div class="mt-3 flex justify-between gap-3 text-sm text-slate-500">
                            <span>Bobot skor terjawab</span>
                            <strong class="text-slate-700 font-medium">{{ number_format($section['earned'], 2) }} / {{
                                number_format($section['maximum'], 2) }}</strong>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>

        </div>
    </div>
</x-cbt-layout>
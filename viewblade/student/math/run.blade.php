<x-cbt-layout>
    <style>
        /* Sembunyikan elemen bawaan layout jika perlu */
        header,
        nav {
            display: none !important;
        }

        body {
            background-color: #f8fafc;
            font-family: 'Nunito', sans-serif;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }

        [x-cloak] {
            display: none !important;
        }

        /* Menghilangkan panah atas/bawah di input number */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        input[type=number] {
            -moz-appearance: textfield;
        }

        /* Custom scrollbar untuk panel navigasi */
        .question-nav-scroll::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        .question-nav-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
        }

        .question-nav-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }

        .question-nav-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        /* Animasi untuk tombol nomor soal */
        @keyframes pulse-green {

            0%,
            100% {
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }

            50% {
                box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
            }
        }

        @keyframes pulse-orange {

            0%,
            100% {
                box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
            }

            50% {
                box-shadow: 0 0 0 8px rgba(249, 115, 22, 0);
            }
        }

        .answered-pulse {
            animation: pulse-green 2s infinite;
        }

        .skipped-pulse {
            animation: pulse-orange 2s infinite;
        }

        /* Anti-copy paste */
        * {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }

        input,
        textarea {
            -webkit-user-select: text;
            -khtml-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
        }

        /* Shake animation */
        @keyframes shake {

            0%,
            100% {
                transform: translateX(0);
            }

            25% {
                transform: translateX(-8px);
            }

            75% {
                transform: translateX(8px);
            }
        }

        .animate-shake {
            animation: shake 0.2s ease-in-out 0s 2;
        }

        /* Blur effect untuk anti-cheat warning */
        .blur-warning {
            filter: blur(12px);
            pointer-events: none;
        }

        /* Grid layout untuk nomor soal */
        .question-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
            gap: 8px;
        }

        @media (min-width: 640px) {
            .question-grid {
                grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
                gap: 10px;
            }
        }
    </style>

    <div class="h-screen flex flex-col"
        x-data="mathExamRunner({{ json_encode($questions) }}, {{ $timeLeftSeconds }}, {{ $exam->max_violations ?? 3 }}, {{ $exam->enable_anti_cheat ?? 1 }})"
        @visibilitychange.window="handleVisibilityChange()" @blur.window="handleWindowBlur()"
        @focus.window="handleWindowFocus()">

        {{-- ========================================== --}}
        {{-- LAYAR PERSIAPAN (JANJI KEJUJURAN) --}}
        {{-- ========================================== --}}
        <div x-show="!hasStarted" class="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
            x-transition>

            {{-- Ornamen Background --}}
            <div class="absolute inset-0 pointer-events-none opacity-[0.03]">
                <i class="fas fa-shield-alt absolute top-20 left-10 text-9xl"></i>
                <i class="fas fa-balance-scale absolute bottom-10 right-10 text-9xl"></i>
                <i
                    class="fas fa-gavel absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl"></i>
            </div>

            {{-- Card Kejujuran --}}
            <div
                class="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 max-w-lg w-full text-center relative z-10 transform transition-all">

                <div
                    class="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg shadow-indigo-300/50 relative">
                    <i class="fas fa-file-signature"></i>
                    <div
                        class="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                        <i class="fas fa-check text-white text-sm"></i>
                    </div>
                </div>

                {{-- Card Kejujuran --}}
                <h2 class="text-2xl md:text-3xl font-black text-slate-800 mb-4 uppercase tracking-widest">Janji
                    Kejujuran</h2>

                {{-- TAMBAHKAN x-show DI SINI --}}
                <div x-show="enableAntiCheat"
                    class="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-exclamation-triangle text-red-500 text-xl mt-1"></i>
                        <div class="text-left text-sm text-slate-700 leading-relaxed">
                            <p class="font-bold text-red-600 mb-2">PERHATIAN PENTING:</p>
                            <ul class="space-y-1 text-xs">
                                <li>• Sistem akan mendeteksi jika Anda keluar dari tab/aplikasi</li>
                                <li>• Fullscreen mode akan aktif otomatis</li>
                                <li>• Kalkulator & alat bantu TIDAK diperbolehkan</li>
                                <li>• Pelanggaran akan tercatat dalam sistem</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <p class="text-slate-600 mb-8 leading-relaxed text-sm md:text-base">
                    Saya berjanji akan mengerjakan ujian ini dengan <strong
                        class="text-indigo-600 font-bold">jujur</strong>,
                    tanpa menggunakan alat bantu hitung (kalkulator, hp, dsb) dan tanpa meminta bantuan dari siapapun.
                </p>

                <button @click="startExam()"
                    class="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-300 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3">
                    <i class="fas fa-check-circle text-xl"></i>
                    <span>Saya Berjanji & Mulai</span>
                </button>
            </div>
        </div>

        {{-- ========================================== --}}
        {{-- ANTI-CHEAT WARNING OVERLAY --}}
        {{-- ========================================== --}}
        <div x-show="showCheatWarning" x-cloak
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0"
            x-transition:enter-end="opacity-100">

            <div class="bg-white rounded-3xl p-8 md:p-12 max-w-md text-center shadow-2xl">
                <div
                    class="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-pulse">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>

                <h3 class="text-2xl font-black text-slate-800 mb-4">PERINGATAN!</h3>

                <p class="text-slate-600 mb-6 leading-relaxed">
                    Anda terdeteksi <strong class="text-red-600">keluar dari halaman ujian</strong>.
                    Pelanggaran ke-<span class="text-red-600 font-bold text-xl" x-text="violationCount"></span> telah
                    dicatat!
                </p>

                <div class="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                    <p class="text-sm text-red-700 font-semibold">
                        <i class="fas fa-ban"></i>
                        Jika pelanggaran mencapai <span class="font-black">3 kali</span>,
                        ujian akan otomatis dikumpulkan!
                    </p>
                </div>

                <button @click="acknowledgeWarning()"
                    class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all">
                    <i class="fas fa-undo"></i> Kembali ke Ujian
                </button>
            </div>
        </div>

        {{-- ========================================== --}}
        {{-- LAYAR UJIAN (HEADER, SOAL, NAVIGASI) --}}
        {{-- ========================================== --}}
        <div x-show="hasStarted" x-cloak class="flex flex-col h-full w-full bg-[#f8fafc]"
            :class="showCheatWarning ? 'blur-warning' : ''">

            {{-- HEADER UJIAN --}}
            <div
                class="bg-white h-20 shadow-md border-b-2 border-indigo-100 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-30">
                <div class="flex items-center gap-3 md:gap-4">
                    <div
                        class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg md:text-xl shadow-lg rotate-3 transform hover:rotate-0 transition-transform">
                        <i class="fas fa-calculator -rotate-3"></i>
                    </div>
                    <div>
                        <h1
                            class="font-black text-sm md:text-lg text-slate-800 uppercase tracking-widest hidden sm:block">
                            Tes Matematika
                        </h1>
                        <h1 class="font-black text-sm text-slate-800 uppercase tracking-widest sm:hidden">Tes MTK</h1>
                        <p class="text-[10px] md:text-xs font-bold text-slate-400">
                            Soal <span x-text="currentIndex + 1"></span> dari {{ $exam->total_questions }}
                        </p>
                    </div>
                </div>

                {{-- Violation Warning Badge --}}
                <div x-show="violationCount > 0"
                    class="hidden md:flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
                    <i class="fas fa-exclamation-triangle animate-pulse"></i>
                    <span>Pelanggaran: <span x-text="violationCount"></span>/3</span>
                </div>

                <div class="bg-slate-900 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl font-mono font-bold text-lg md:text-2xl shadow-lg flex items-center gap-2 md:gap-3 transition-colors"
                    :class="timeLeft <= 60 ? 'bg-red-600 animate-pulse' : ''">
                    <i class="fas fa-stopwatch text-xs md:text-sm opacity-50"></i>
                    <span x-text="formatTime(timeLeft)"></span>
                </div>
            </div>

            {{-- AREA TENGAH: SIDEBAR + SOAL --}}
            <div class="flex-1 flex overflow-hidden">

                {{-- SIDEBAR NAVIGASI NOMOR SOAL (Desktop & Tablet) --}}
                <div class="hidden md:flex md:w-64 lg:w-72 bg-white border-r-2 border-slate-100 flex-col shadow-lg">

                    {{-- Header Sidebar --}}
                    <div class="p-4 border-b-2 border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <h3 class="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                            <i class="fas fa-list-ol text-indigo-600"></i>
                            Daftar Soal
                        </h3>
                        <p class="text-xs text-slate-500 mt-1">Klik nomor untuk navigasi</p>
                    </div>

                    {{-- Status Legend --}}
                    <div class="p-4 border-b border-slate-100 space-y-2">
                        <div class="flex items-center gap-2 text-xs">
                            <div
                                class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                                <i class="fas fa-check text-xs"></i>
                            </div>
                            <span class="text-slate-600">Sudah Dijawab</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs">
                            <div
                                class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                                <i class="fas fa-forward text-xs"></i>
                            </div>
                            <span class="text-slate-600">Dilewati</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs">
                            <div
                                class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold ring-2 ring-indigo-300">
                                <i class="fas fa-arrow-right text-xs"></i>
                            </div>
                            <span class="text-slate-600">Soal Aktif</span>
                        </div>
                    </div>

                    {{-- Grid Nomor Soal --}}
                    <div class="flex-1 p-4 overflow-y-auto question-nav-scroll">
                        <div class="question-grid">
                            <template x-for="(q, index) in questions" :key="q.id">
                                <button @click="jumpToQuestion(index)"
                                    class="relative w-full h-12 rounded-xl font-bold text-sm transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                                    :class="{
                                            'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600': isAnswered(q.id) && currentIndex !== index,
                                            'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600': isSkipped(q.id) && currentIndex !== index,
                                            'bg-slate-100 text-slate-400 hover:bg-slate-200': !isAnswered(q.id) && !isSkipped(q.id) && currentIndex !== index,
                                            'bg-indigo-600 text-white ring-4 ring-indigo-300 scale-110': currentIndex === index
                                        }">
                                    <span x-text="index + 1"></span>

                                    {{-- Icon indicator --}}
                                    <div x-show="isAnswered(q.id) && currentIndex !== index"
                                        class="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <i class="fas fa-check text-emerald-500 text-[8px]"></i>
                                    </div>
                                    <div x-show="isSkipped(q.id) && currentIndex !== index"
                                        class="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <i class="fas fa-exclamation text-orange-500 text-[8px]"></i>
                                    </div>
                                </button>
                            </template>
                        </div>
                    </div>

                    {{-- Summary Stats --}}
                    <div class="p-4 border-t-2 border-slate-100 bg-slate-50 space-y-2">
                        <div class="flex justify-between text-xs">
                            <span class="text-slate-600">Dijawab:</span>
                            <span class="font-bold text-emerald-600" x-text="getAnsweredCount()"></span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span class="text-slate-600">Dilewati:</span>
                            <span class="font-bold text-orange-600" x-text="getSkippedCount()"></span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span class="text-slate-600">Kosong:</span>
                            <span class="font-bold text-slate-400" x-text="getUnansweredCount()"></span>
                        </div>
                    </div>
                </div>

                {{-- AREA SOAL --}}
                <div class="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto">

                    {{-- Ornamen Background --}}
                    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
                        <i class="fas fa-plus absolute top-10 left-10 text-9xl"></i>
                        <i class="fas fa-divide absolute bottom-10 right-10 text-9xl"></i>
                        <i class="fas fa-times absolute top-1/4 right-1/4 text-8xl"></i>
                        <i class="fas fa-minus absolute bottom-1/4 left-1/4 text-8xl"></i>
                    </div>

                    {{-- Wrapper Container untuk Soal & Navigasi --}}
                    <div class="w-full max-w-3xl flex flex-col gap-4 sm:gap-6 relative z-10">

                        {{-- MOBILE: Quick Navigation Dots --}}
                        <div class="md:hidden bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <i class="fas fa-list"></i> Navigasi Cepat
                                </span>
                                <span class="text-xs text-slate-400"
                                    x-text="`${getAnsweredCount()}/${questions.length} Dijawab`"></span>
                            </div>

                            <div class="grid grid-cols-10 gap-2">
                                <template x-for="(q, index) in questions" :key="q.id">
                                    <button @click="jumpToQuestion(index)"
                                        class="w-full aspect-square rounded-lg font-bold text-xs transition-all transform active:scale-90"
                                        :class="{
                                                'bg-emerald-500 text-white': isAnswered(q.id) && currentIndex !== index,
                                                'bg-orange-500 text-white': isSkipped(q.id) && currentIndex !== index,
                                                'bg-slate-200 text-slate-400': !isAnswered(q.id) && !isSkipped(q.id) && currentIndex !== index,
                                                'bg-indigo-600 text-white ring-2 ring-indigo-300': currentIndex === index
                                            }">
                                        <span x-text="index + 1"></span>
                                    </button>
                                </template>
                            </div>
                        </div>

                        {{-- KOTAK SOAL --}}
                        <div
                            class="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-indigo-100/50 border-2 border-slate-100 text-center w-full min-h-[300px] md:min-h-[400px] flex items-center justify-center overflow-hidden relative">

                            {{-- Decorative corner ribbons --}}
                            <div
                                class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 rounded-bl-[3rem]">
                            </div>
                            <div
                                class="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 opacity-10 rounded-tr-[3rem]">
                            </div>

                            <template x-for="(q, index) in questions" :key="q.id">
                                <div x-show="currentIndex === index"
                                    x-transition:enter="transition ease-out duration-300"
                                    x-transition:enter-start="opacity-0 transform scale-95 translate-y-4"
                                    x-transition:enter-end="opacity-100 transform scale-100 translate-y-0"
                                    class="w-full p-6 sm:p-10 md:p-12" x-cloak>

                                    {{-- Badge Nomor Soal --}}
                                    <div
                                        class="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs sm:text-sm px-4 py-2 rounded-full uppercase tracking-widest mb-4 shadow-lg">
                                        <i class="fas fa-hashtag"></i>
                                        <span>Soal <span x-text="index + 1"></span></span>
                                    </div>

                                    {{-- Notifikasi jika soal ini dilewati --}}
                                    <div x-show="skipped.includes(q.id) && (answers[q.id] === undefined || answers[q.id] === '')"
                                        x-transition:enter="transition ease-out duration-300"
                                        x-transition:enter-start="opacity-0 transform scale-75 -translate-y-4"
                                        x-transition:enter-end="opacity-100 transform scale-100 translate-y-0"
                                        class="inline-flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-[10px] sm:text-xs px-4 py-1.5 sm:py-2 rounded-full uppercase tracking-widest mb-6 shadow-lg shadow-orange-500/40 border-2 border-white ring-4 ring-orange-50 relative">

                                        {{-- Animasi titik peringatan berdenyut --}}
                                        <div class="relative flex h-2.5 w-2.5 justify-center items-center">
                                            <span
                                                class="animate-ping absolute inline-flex h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white opacity-75"></span>
                                            <span
                                                class="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white"></span>
                                        </div>
                                        <span>Soal Dilewati - Harap Dikerjakan</span>
                                    </div>

                                    <div
                                        class="text-indigo-600 font-black tracking-widest text-xs sm:text-sm mb-6 uppercase">
                                        Hitunglah hasil dari operasi di bawah ini:
                                    </div>

                                    <div
                                        class="text-5xl sm:text-7xl md:text-8xl font-black text-slate-800 flex items-center justify-center gap-4 sm:gap-6 md:gap-10 mb-8 sm:mb-12">

                                        {{-- Panggil fungsi formatNumber() untuk q.num1 --}}
                                        <span x-text="formatNumber(q.num1)" class="drop-shadow-lg"></span>

                                        <span x-html="getOperatorIcon(q.operator)"
                                            class="text-indigo-600 text-4xl sm:text-6xl md:text-7xl bg-gradient-to-br from-indigo-50 to-purple-50 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl border-2 border-indigo-100 transform hover:rotate-12 transition-transform"></span>

                                        {{-- Panggil fungsi formatNumber() untuk q.num2 --}}
                                        <span x-text="formatNumber(q.num2)" class="drop-shadow-lg"></span>

                                        <span class="text-slate-300">=</span>
                                    </div>

                                    <div>
                                        <input type="text" :id="'input-' + index" :value="formatNumber(answers[q.id])"
                                            @input="handleInput($event, q.id)" @keydown.enter="nextQuestion()"
                                            placeholder="?" :class="skipped.includes(q.id) && (answers[q.id] === undefined || answers[q.id] === '')
        ? 'border-orange-400 focus:border-orange-500 bg-orange-50/30 ring-4 ring-orange-100'
        : 'border-indigo-200 focus:border-indigo-500 bg-slate-50 ring-4 ring-indigo-50'"
                                            class="w-64 sm:w-80 md:w-96 text-center text-4xl sm:text-5xl md:text-6xl font-black text-indigo-700 border-4 focus:ring-0 rounded-2xl sm:rounded-3xl py-4 sm:py-6 transition-all shadow-lg placeholder-slate-300 focus:shadow-2xl focus:scale-105">

                                        <p
                                            class="text-slate-400 font-bold text-xs sm:text-sm mt-4 hidden sm:flex items-center justify-center gap-2">
                                            <i class="fas fa-keyboard"></i>
                                            <span>Ketik jawaban lalu tekan <strong
                                                    class="text-indigo-600">ENTER</strong></span>
                                        </p>
                                    </div>
                                </div>
                            </template>

                        </div>

                        {{-- NAVIGASI BAWAH --}}
                        <div
                            class="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/50 border-2 border-slate-100 w-full flex flex-col gap-5 sm:gap-6">

                            {{-- 1. Baris Tombol (Horizontal) --}}
                            <div class="flex flex-row items-center justify-between gap-3 sm:gap-4 w-full">

                                {{-- Tombol Kembali --}}
                                <button @click="prevQuestion()" :disabled="currentIndex === 0"
                                    class="flex items-center justify-center px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl font-black bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 transition-all tracking-wide shrink-0 shadow-sm hover:shadow-md transform active:scale-95">
                                    <div class="sm:hidden flex items-center">
                                        <i class="fas fa-angle-double-left text-lg"></i>
                                    </div>
                                    <div class="hidden sm:flex items-center gap-2">
                                        <i class="fas fa-arrow-left"></i>
                                        <span class="text-sm">KEMBALI</span>
                                    </div>
                                </button>

                                {{-- Tombol Lewati (Di Tengah) --}}
                                <button @click="skipQuestion()" x-show="currentIndex < questions.length - 1"
                                    class="flex-1 flex items-center justify-center gap-2 px-2 sm:px-8 py-3.5 sm:py-4 rounded-xl font-black bg-gradient-to-r from-orange-100 to-red-100 text-orange-600 hover:from-orange-200 hover:to-red-200 transition-all text-xs sm:text-sm tracking-widest uppercase shadow-sm hover:shadow-md transform active:scale-95">
                                    <i class="fas fa-forward"></i>
                                    <span>LEWATI</span>
                                </button>

                                {{-- Spacer Kosong --}}
                                <div x-show="currentIndex === questions.length - 1" class="flex-1"></div>

                                {{-- Tombol Lanjut / Selesai --}}
                                <button @click="nextQuestion()"
                                    class="flex items-center justify-center px-5 sm:px-8 py-3.5 sm:py-4 rounded-xl font-black text-white shadow-lg transition-all hover:shadow-xl tracking-wide shrink-0 transform hover:-translate-y-1 active:scale-95"
                                    :class="currentIndex === questions.length - 1
                                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-300'
                                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-300'">

                                    <div x-show="currentIndex !== questions.length - 1" class="w-full">
                                        <div class="sm:hidden flex items-center justify-center">
                                            <i class="fas fa-angle-double-right text-lg"></i>
                                        </div>
                                        <div class="hidden sm:flex items-center justify-center gap-2">
                                            <span class="text-sm">LANJUT</span>
                                            <i class="fas fa-arrow-right"></i>
                                        </div>
                                    </div>

                                    <div x-show="currentIndex === questions.length - 1" class="flex items-center gap-2">
                                        <i class="fas fa-check-double"></i>
                                        <span class="sm:hidden text-xs">SELESAI</span>
                                        <span class="hidden sm:block text-sm">KUMPULKAN</span>
                                    </div>
                                </button>

                            </div>

                            {{-- 2. Baris Progress Bar --}}
                            <div class="w-full flex flex-col gap-1.5 px-1 pb-1">
                                <div
                                    class="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 px-1">
                                    <span class="flex items-center gap-1.5">
                                        <i class="fas fa-tasks text-indigo-500"></i>
                                        Progress Mengerjakan
                                    </span>
                                    <span class="text-indigo-600 font-black text-sm"
                                        x-text="Math.round(((currentIndex + 1) / questions.length) * 100) + '%'"></span>
                                </div>

                                {{-- Bar Indikator --}}
                                <div class="h-3 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                                    <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-700 ease-out shadow-lg"
                                        :style="`width: ${((currentIndex + 1) / questions.length) * 100}%`">
                                        <div
                                            class="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse">
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    </div>

    {{-- Form Submit Hidden --}}
    <form id="math-submit-form" action="{{ route('student.math.submit', $exam->id) }}" method="POST" class="hidden">
        @csrf
        <input type="hidden" name="answers">
    </form>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    {{-- Anti-Cheat Protection Scripts --}}
    <script>
        // Disable right-click
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        }, true);

        // Disable keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
            if (e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key)) ||
                (e.ctrlKey && ['u', 's'].includes(e.key))) {
                e.preventDefault();
                return false;
            }
        }, true);

        // Disable copy-paste
        document.addEventListener('copy', function(e) {
            e.preventDefault();
            return false;
        }, true);

        document.addEventListener('paste', function(e) {
            e.preventDefault();
            return false;
        }, true);
    </script>

    <script>
        document.addEventListener('alpine:init', () => {
            // PERBAIKAN 1: Tambahkan maxViolations dan enableAntiCheat ke dalam parameter fungsi
            Alpine.data('mathExamRunner', (questions, initialTime, maxViolations, enableAntiCheat) => ({
                hasStarted: false,
                questions: questions,
                currentIndex: 0,
                timeLeft: parseInt(initialTime),
                answers: {},
                skipped: [],
                timerInterval: null,
                showCheatWarning: false,
                violationCount: 0,
                maxViolations: maxViolations,
                enableAntiCheat: Boolean(enableAntiCheat),
                isPageVisible: true,
                examId: '{{ $exam->id }}',

                init() {
                    this.questions.forEach(q => {
                        if (q.student_answer !== null && q.student_answer !== undefined) {
                            this.answers[q.id] = q.student_answer;
                        }
                    });
                },

                triggerAutosave(questionId) {
                    const answerValue = this.answers[questionId] !== undefined ? this.answers[questionId] : '';
                    const metaToken = document.querySelector('meta[name="csrf-token"]');
                    const csrfToken = metaToken ? metaToken.getAttribute('content') : '';

                    axios.post(`/math-exam/${this.examId}/autosave`, {
                        question_id: questionId,
                        answer: answerValue
                    }, {
                        headers: {
                            'X-CSRF-TOKEN': csrfToken,
                            'Accept': 'application/json'
                        }
                    })
                    .then(response => console.log('Autosave sukses soal ID:', questionId))
                    .catch(error => console.error('Autosave gagal:', error));
                },

                startExam() {
                    this.hasStarted = true;
                    let elem = document.documentElement;
                    if (elem.requestFullscreen) {
                        elem.requestFullscreen().catch(err => console.warn("Fullscreen blocked:", err));
                    } else if (elem.webkitRequestFullscreen) {
                        elem.webkitRequestFullscreen();
                    } else if (elem.msRequestFullscreen) {
                        elem.msRequestFullscreen();
                    }
                    this.$nextTick(() => { this.focusInput(); });
                    this.startTimer();
                },

                handleVisibilityChange() {
                    if (!this.enableAntiCheat) return;

                    if (this.hasStarted && !this.showCheatWarning) {
                        if (document.hidden) {
                            this.recordViolation();
                        }
                    }
                },

                handleWindowBlur() {
                    if (!this.enableAntiCheat) return;

                    if (this.hasStarted && !this.showCheatWarning) {
                        this.recordViolation();
                    }
                },

                handleWindowFocus() {
                    // Optional: log when user returns
                },

                recordViolation() {
                    this.violationCount++;
                    this.showCheatWarning = true;

                    // PERBAIKAN 2: Gunakan this.maxViolations, bukan angka 3 statis
                    if (this.violationCount >= this.maxViolations) {
                        setTimeout(() => {
                            Swal.fire({
                                title: 'Ujian Dikumpulkan!',
                                text: `Anda telah melakukan ${this.maxViolations} kali pelanggaran. Ujian akan otomatis dikumpulkan.`,
                                icon: 'error',
                                confirmButtonColor: '#dc2626',
                                confirmButtonText: 'Mengerti',
                                allowOutsideClick: false,
                            }).then(() => {
                                this.forceSubmit();
                            });
                        }, 500);
                    }
                },

                acknowledgeWarning() {
                    this.showCheatWarning = false;
                    let elem = document.documentElement;
                    if (elem.requestFullscreen) {
                        elem.requestFullscreen().catch(() => {});
                    }
                    this.focusInput();
                },

                getOperatorIcon(op) {
                    if(op === '+') return '+';
                    if(op === '-') return '&minus;';
                    if(op === 'x') return '&times;';
                    if(op === ':') return '&divide;';
                    return op;
                },

                startTimer() {
                    this.timerInterval = setInterval(() => {
                        if (this.timeLeft > 0) {
                            this.timeLeft--;
                        } else {
                            clearInterval(this.timerInterval);
                            if (document.exitFullscreen) {
                                document.exitFullscreen().catch(()=>{});
                            }
                            Swal.fire({
                                title: 'Waktu Habis!',
                                text: 'Sistem sedang menyimpan jawaban Anda...',
                                icon: 'warning',
                                timer: 2000,
                                showConfirmButton: false,
                                allowOutsideClick: false,
                            }).then(() => {
                                this.forceSubmit();
                            });
                        }
                    }, 1000);
                },

                formatTime(s) {
                    const m = Math.floor(s / 60);
                    const sec = s % 60;
                    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                },

                focusInput() {
                    setTimeout(() => {
                        const input = document.getElementById('input-' + this.currentIndex);
                        if (input) input.focus();
                    }, 50);
                },

                nextQuestion() {
                    const currentQ = this.questions[this.currentIndex];

                    if (this.answers[currentQ.id] === undefined || this.answers[currentQ.id] === '') {
                        this.focusInput();
                        const input = document.getElementById('input-' + this.currentIndex);
                        if(input) {
                            input.classList.add('animate-shake');
                            setTimeout(() => input.classList.remove('animate-shake'), 500);
                        }
                        return;
                    }

                    this.removeSkipped(currentQ.id);
                    this.triggerAutosave(currentQ.id);

                    if (this.currentIndex < this.questions.length - 1) {
                        this.currentIndex++;
                        this.focusInput();
                    } else {
                        this.finishExam();
                    }
                },

                skipQuestion() {
                    const currentQ = this.questions[this.currentIndex];

                    if (!this.skipped.includes(currentQ.id) && (this.answers[currentQ.id] === undefined || this.answers[currentQ.id] === '')) {
                        this.skipped.push(currentQ.id);
                    }

                    this.triggerAutosave(currentQ.id);

                    if (this.currentIndex < this.questions.length - 1) {
                        this.currentIndex++;
                        this.focusInput();
                    }
                },

                removeSkipped(id) {
                    const index = this.skipped.indexOf(id);
                    if (index > -1) {
                        this.skipped.splice(index, 1);
                    }
                },

                prevQuestion() {
                    if (this.currentIndex > 0) {
                        const currentQ = this.questions[this.currentIndex];
                        this.triggerAutosave(currentQ.id);
                        this.currentIndex--;
                        this.focusInput();
                    }
                },

                jumpToQuestion(index) {
                    const currentQ = this.questions[this.currentIndex];
                    this.triggerAutosave(currentQ.id);
                    this.currentIndex = index;
                    this.focusInput();
                },

                isAnswered(questionId) {
                    return this.answers[questionId] !== undefined && this.answers[questionId] !== '';
                },

                isSkipped(questionId) {
                    return this.skipped.includes(questionId) && !this.isAnswered(questionId);
                },

                getAnsweredCount() {
                    return this.questions.filter(q => this.isAnswered(q.id)).length;
                },

                getSkippedCount() {
                    return this.questions.filter(q => this.isSkipped(q.id)).length;
                },

                getUnansweredCount() {
                    return this.questions.filter(q => !this.isAnswered(q.id) && !this.isSkipped(q.id)).length;
                },

                formatNumber(value) {
                    if (value === undefined || value === null || value === '') return '';
                    // Hapus karakter selain angka dan minus, lalu parse jadi integer
                    let num = String(value).replace(/[^\d-]/g, '');
                    if (num === '' || num === '-') return num;
                    return parseInt(num, 10).toLocaleString('id-ID');
                },

                // Fungsi untuk menangani input user
                handleInput(event, questionId) {
                    let rawValue = event.target.value;
                    // Hapus semua titik untuk mendapatkan nilai numerik asli
                    let cleanValue = rawValue.replace(/\./g, '');

                    // Simpan nilai asli ke state answers
                    this.answers[questionId] = cleanValue;

                    // Paksa update tampilan input dengan nilai terformat
                    event.target.value = this.formatNumber(cleanValue);

                    this.removeSkipped(questionId);
                },

                finishExam() {
                    const unanswered = this.getUnansweredCount() + this.getSkippedCount();
                    let textMsg = "Pastikan semua soal sudah dihitung dengan teliti!";

                    if (unanswered > 0) {
                        textMsg = `Ada ${unanswered} soal yang belum dijawab. Yakin ingin mengumpulkan?`;
                    }

                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(()=>{});
                    }

                    Swal.fire({
                        title: 'Kumpulkan Ujian?',
                        text: textMsg,
                        icon: unanswered > 0 ? 'warning' : 'question',
                        showCancelButton: true,
                        confirmButtonColor: '#10b981',
                        cancelButtonColor: '#cbd5e1',
                        confirmButtonText: '<i class="fas fa-check"></i> Ya, Kumpulkan',
                        cancelButtonText: '<i class="fas fa-times"></i> Cek Kembali',
                        reverseButtons: true,
                        customClass: {
                            confirmButton: 'font-bold px-6 py-3 rounded-xl',
                            cancelButton: 'font-bold px-6 py-3 rounded-xl'
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            this.forceSubmit();
                        } else {
                            let elem = document.documentElement;
                            if (elem.requestFullscreen) {
                                elem.requestFullscreen().catch(()=>{});
                            }
                            this.focusInput();
                        }
                    });
                },

                forceSubmit() {
                    clearInterval(this.timerInterval);
                    const form = document.getElementById('math-submit-form');
                    let inputAnswers = form.querySelector('input[name="answers"]');
                    inputAnswers.value = JSON.stringify(Alpine.raw(this.answers));
                    form.submit();
                }
            }));
        });
    </script>
</x-cbt-layout>
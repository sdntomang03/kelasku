<x-app-layout>
    <div class="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto">

            <div class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div
                        class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 rotate-3">
                        <i class="fas fa-gamepad text-2xl -rotate-3"></i>
                    </div>
                    <div>
                        <h2 class="text-3xl font-black text-slate-800 tracking-tight">Misi Matematika</h2>
                        <p class="text-slate-500 font-bold mt-1">Selesaikan tantangan berhitung untuk melatih
                            kecepatanmu!</p>
                    </div>
                </div>
            </div>

            @if(session('info'))
            <div x-data="{ show: true }" x-show="show" x-init="setTimeout(() => show = false, 5000)"
                x-transition:leave="transition ease-in duration-300"
                x-transition:leave-start="opacity-100 transform translate-x-0"
                x-transition:leave-end="opacity-0 transform translate-x-8"
                class="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-r-xl mb-8 font-bold shadow-sm flex items-center justify-between">

                <div class="flex items-center gap-3">
                    <i class="fas fa-info-circle text-xl"></i>
                    <span>{{ session('info') }}</span>
                </div>

                <button @click="show = false"
                    class="text-blue-400 hover:text-blue-800 focus:outline-none p-1 transition-colors">
                    <i class="fas fa-times text-lg"></i>
                </button>
            </div>
            @endif

            @if(session('success'))
            <div x-data="{ show: true }" x-show="show" x-init="setTimeout(() => show = false, 5000)"
                x-transition:leave="transition ease-in duration-300"
                x-transition:leave-start="opacity-100 transform translate-x-0"
                x-transition:leave-end="opacity-0 transform translate-x-8"
                class="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r-xl mb-8 font-bold shadow-sm flex items-center justify-between">

                <div class="flex items-center gap-3">
                    <i class="fas fa-star text-xl text-yellow-400 animate-pulse"></i>
                    <span>{{ session('success') }}</span>
                </div>

                <button @click="show = false"
                    class="text-emerald-400 hover:text-emerald-800 focus:outline-none p-1 transition-colors">
                    <i class="fas fa-times text-lg"></i>
                </button>
            </div>
            @endif

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                @forelse($exams as $exam)
                <div
                    class="bg-white rounded-[2rem] p-6 border-2 transition-all hover:shadow-xl group flex flex-col {{ $exam->status === 'completed' ? 'border-slate-100 opacity-75 hover:opacity-100' : 'border-indigo-100 shadow-sm hover:-translate-y-1' }}">

                    <div class="flex justify-between items-start mb-6">
                        <div class="text-xs font-bold text-slate-400 flex flex-col">
                            <span>Ditugaskan pada:</span>
                            <span class="text-slate-600">{{ $exam->assigned_at->format('d M Y, H:i') }}</span>
                        </div>

                        @if($exam->status === 'not_started')
                        <span
                            class="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">Baru</span>
                        @elseif($exam->status === 'ongoing')
                        <span
                            class="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase animate-pulse">Sedang
                            Dikerjakan</span>
                        @else
                        <span
                            class="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">Selesai</span>
                        @endif
                    </div>

                    <div class="mb-6 flex-1">
                        <h3 class="font-black text-2xl text-indigo-700 mb-1">{{ $exam->title }}</h3>
                        <p class="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Tantangan Operasi:</p>

                        <div class="flex flex-wrap gap-2">
                            @php
                            $types = is_string($exam->types) ? json_decode($exam->types, true) : $exam->types;
                            @endphp

                            @if(is_array($types))
                            @if(in_array('addition', $types))
                            <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black"
                                title="Penjumlahan"><i class="fas fa-plus"></i></div>
                            @endif
                            @if(in_array('subtraction', $types))
                            <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-black"
                                title="Pengurangan"><i class="fas fa-minus"></i></div>
                            @endif
                            @if(in_array('multiplication', $types))
                            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black"
                                title="Perkalian"><i class="fas fa-times"></i></div>
                            @endif
                            @if(in_array('division', $types))
                            <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black"
                                title="Pembagian"><i class="fas fa-divide"></i></div>
                            @endif
                            @endif
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div class="flex flex-col items-center justify-center text-center border-r border-slate-200">
                            <span class="text-[10px] font-black text-slate-400 mb-1 tracking-widest uppercase">Total
                                Soal</span>
                            <span class="font-black text-xl text-slate-700">{{ $exam->total_questions }}</span>
                        </div>
                        <div class="flex flex-col items-center justify-center text-center">
                            <span class="text-[10px] font-black text-slate-400 mb-1 tracking-widest uppercase">Waktu
                                Ujian</span>
                            <span class="font-black text-xl text-slate-700">{{ $exam->duration_minutes }} <span
                                    class="text-xs">Menit</span></span>
                        </div>
                    </div>

                    @if($exam->status === 'completed')
                    <div class="flex flex-col gap-3">
                        {{-- Kotak Nilai Akhir --}}
                        <div
                            class="bg-slate-100 p-4 rounded-2xl flex items-center justify-between border border-slate-200">
                            <span class="font-bold text-slate-500">Nilai Akhir:</span>
                            <span
                                class="text-2xl font-black {{ $exam->score >= 70 ? 'text-emerald-500' : 'text-rose-500' }}">
                                {{ $exam->score }}
                            </span>
                        </div>

                        {{-- Tombol Lihat Pembahasan (Hanya muncul jika show_explanation aktif/1) --}}
                        @if($exam->show_explanation)
                        <a href="{{ route('student.math.result', $exam->id) }}"
                            class="w-full block text-center py-3 rounded-xl font-bold text-sm transition-all duration-300 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700 shadow-sm hover:shadow-md">
                            <i class="fas fa-book-open mr-1"></i> Lihat Pembahasan
                        </a>
                        @endif
                    </div>
                    @else
                    {{-- Tombol Mulai / Lanjutkan Ujian --}}
                    <a href="{{ route('student.math.run', $exam->id) }}"
                        class="w-full block text-center py-4 rounded-2xl font-black text-lg transition-all duration-300 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl hover:shadow-indigo-200 hover:-translate-y-1">
                        {{ $exam->status === 'ongoing' ? 'Lanjutkan Ujian' : 'Mulai Kerjakan' }} <i
                            class="fas fa-arrow-right ml-2"></i>
                    </a>
                    @endif

                </div>

                @empty
                <div
                    class="col-span-full bg-white p-12 rounded-[3rem] border border-slate-100 text-center flex flex-col items-center justify-center h-96 shadow-sm">
                    <div
                        class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-5xl mb-6">
                        <i class="fas fa-box-open -rotate-12"></i>
                    </div>
                    <h3 class="text-2xl font-black text-slate-700 mb-2">Belum Ada Misi</h3>
                    <p class="text-slate-500 font-bold max-w-md mx-auto">Guru belum menugaskan tes matematika apapun
                        untukmu saat ini. Silakan istirahat atau bersiap-siap!</p>
                </div>
                @endforelse

            </div>
        </div>
    </div>
</x-app-layout>
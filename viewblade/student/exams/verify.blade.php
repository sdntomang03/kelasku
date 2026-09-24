<x-app-layout>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
            <div
                class="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-6 transform rotate-3">
                <i class="fas fa-key text-2xl -rotate-3"></i>
            </div>
            <h2 class="text-center text-3xl font-black tracking-tight text-slate-900">
                Verifikasi Ujian
            </h2>
            <p class="mt-2 text-center text-sm font-bold text-slate-500">
                {{ $session->exam?->title ?? 'Ujian Tidak Tersedia (Dihapus)' }}
            </p>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div
                class="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-[2rem] sm:px-10 border border-slate-100 relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500"></div>

                <form class="space-y-6" action="{{ route('student.exam.verify.process', $session->exam) }}"
                    method="POST">
                    @csrf

                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">
                            Nama Peserta
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-user text-slate-400"></i>
                            </div>
                            <input type="text" value="{{ Auth::user()->name }}" disabled
                                class="block w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-semibold focus:ring-0 sm:text-sm py-3 cursor-not-allowed">
                        </div>
                    </div>

                    <div>
                        <label for="token" class="block text-sm font-bold text-slate-700 mb-2">
                            Token Ujian <span class="text-rose-500">*</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-unlock text-indigo-400"></i>
                            </div>
                            <input id="token" name="token" type="text" required autofocus autocomplete="off"
                                placeholder="Masukkan token..." {{-- OTOMATISASI DI SINI --}}
                                value="{{ $defaultToken }}" @if($defaultToken) readonly @endif
                                class="block w-full pl-10 border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg font-black tracking-widest uppercase text-center py-3 shadow-sm transition-colors @if($defaultToken) bg-slate-50 cursor-not-allowed @endif @error('token') border-rose-300 ring-rose-500 @enderror">
                        </div>

                        <p class="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                            @if($defaultToken)
                            <i class="fas fa-magic text-amber-500"></i> Token terisi otomatis.
                            @else
                            <i class="fas fa-info-circle text-indigo-400"></i> Dapatkan token ujian dari pengawas
                            ruangan.
                            @endif
                        </p>
                    </div>

                    <div class="pt-2 flex gap-3">
                        <a href="{{ route('student.dashboard') }}"
                            class="w-full flex justify-center py-3.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                            Batal
                        </a>
                        <button type="submit"
                            class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-200 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-95">
                            Verifikasi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- SweetAlert Notification Script --}}
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            @if(session('error'))
                Swal.fire({
                    icon: 'error',
                    title: 'Verifikasi Gagal!',
                    text: @json(session('error')),
                    confirmButtonText: 'Coba Lagi',
                    confirmButtonColor: '#ef4444',
                    background: '#fff',
                });
            @endif
        });
    </script>
</x-app-layout>
<div class="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
    <h5 class="font-black text-slate-800 mb-4 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <i class="fas fa-key"></i>
        </div>
        Kunci Jawaban Isian
    </h5>
    <p class="text-xs text-slate-400 mb-4 ml-1">Sistem akan mencocokkan jawaban siswa dengan teks di bawah ini.</p>

    <div class="relative">
        <input type="text" x-model="form.options[0].option_text"
            class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-lg font-bold rounded-2xl px-6 py-4 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 placeholder:font-semibold"
            placeholder="Tuliskan kunci jawaban singkat...">
        <div class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
            <i class="fas fa-pen-alt"></i>
        </div>
    </div>
</div>

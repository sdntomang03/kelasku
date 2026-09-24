@props(['q'])

<div class="relative">
    <input type="text" x-model="answers[q.id]" @input.debounce.1000ms="saveAnswer(q.id, $event.target.value)"
        @blur="saveAnswer(q.id, $event.target.value)"
        class="w-full p-6 pr-32 bg-white border-2 border-slate-100 rounded-[2rem]  text-slate-700 shadow-sm text-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none"
        placeholder="Ketik jawaban singkat Anda di sini...">

    <div
        class="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full pointer-events-none">
        <span x-text="answers[q.id] ? answers[q.id].length : 0"></span> Karakter
    </div>
</div>

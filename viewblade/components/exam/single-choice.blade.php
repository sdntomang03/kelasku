@props(['q'])

<div class="grid grid-cols-1 gap-3">
    <template x-for="(opt, oIndex) in q.options" :key="opt.id">
        <div @click="selectAnswer(q.id, opt.id)"
            class="relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 group"
            :class="answers[q.id] == opt.id
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.01]'
                : 'bg-white border-white text-slate-600 hover:border-indigo-300 shadow-sm'">

            <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-sm shrink-0 transition-colors"
                :class="answers[q.id] == opt.id ? 'bg-white text-indigo-600 border-white' : 'bg-slate-50 text-slate-400 group-hover:border-indigo-200'">
                <span x-text="String.fromCharCode(65 + oIndex)"></span>
            </div>

            <div class=" text-lg" x-html="opt.option_text"></div>

            <div x-show="answers[q.id] == opt.id" class="absolute right-4 text-white">
                <i class="fas fa-check-circle text-xl"></i>
            </div>
        </div>
    </template>
</div>

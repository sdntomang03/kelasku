@props(['q'])

<div class="grid grid-cols-1 gap-3">
    <template x-for="opt in q.options" :key="opt.id">
        <div @click="toggleMultipleAnswer(q.id, opt.id)"
            class="relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 group"
            :class="isOptionSelected(q.id, opt.id)
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl'
                : 'bg-white border-white text-slate-600 hover:border-indigo-300 shadow-sm'">

            <div class="w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors"
                :class="isOptionSelected(q.id, opt.id) ? 'bg-white text-indigo-600 border-white' : 'bg-slate-50 group-hover:border-indigo-200'">
                <i class="fas fa-check text-sm" x-show="isOptionSelected(q.id, opt.id)"></i>
            </div>

            <div class=" text-lg" x-html="opt.option_text"></div>
        </div>
    </template>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <template x-for="(opt, index) in form.options" :key="index">
        <div
            class="bg-white p-5 rounded-[2.2rem] border-2 border-transparent hover:border-indigo-200 transition-all shadow-sm hover:shadow-lg flex flex-col group relative">

            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]"
                        x-text="String.fromCharCode(65 + index)"></div>

                    <button @click="toggleCorrect(index)" type="button"
                        class="px-4 py-1.5 rounded-lg text-[10px] font-black transition-all border flex items-center gap-2"
                        :class="opt.is_correct == 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'">
                        <i class="fas" :class="opt.is_correct == 1 ? 'fa-check-circle' : 'fa-circle'"></i>
                        <span x-text="opt.is_correct == 1 ? 'BENAR' : 'SALAH'"></span>
                    </button>
                </div>

                <button @click="removeOption(index)"
                    class="w-7 h-7 rounded-full bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>

            <div class="flex-1">
                <x-editor x-model="opt.option_text" height="80px" :mini="true" />
            </div>
        </div>
    </template>
</div>
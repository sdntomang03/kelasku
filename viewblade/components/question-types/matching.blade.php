<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <template x-for="(opt, index) in form.options" :key="index">
        <div
            class="bg-white p-5 rounded-[2.2rem] border-2 border-transparent hover:border-amber-200 transition-all shadow-sm hover:shadow-lg flex flex-col group relative">

            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-black text-[10px]"
                        x-text="index + 1"></div>
                    <span class="text-[10px] font-black text-slate-400 uppercase">Pasangan #<span
                            x-text="index+1"></span></span>
                </div>
                <button @click="removeOption(index)"
                    class="w-7 h-7 rounded-full bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition flex items-center justify-center"><i
                        class="fas fa-times text-xs"></i></button>
            </div>

            <label class="block text-[9px] font-black text-slate-400 uppercase mb-2 px-1">Sisi Kiri (Premis)</label>
            <div class="flex-1 mb-4">
                <x-editor x-model="opt.premise_text" height="80px" :mini="true" />
            </div>

            <div class="pt-4 border-t border-dashed border-slate-200">
                <span class="text-[9px] font-black text-amber-500 uppercase mb-2 ml-1 block">Pasangan Kanan
                    (Target)</span>
                <div class="flex items-center gap-3 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <i class="fas fa-link text-amber-400 text-xs"></i>
                    <input type="text" x-model="opt.target_text"
                        class="w-full bg-transparent border-none p-0 text-sm font-bold text-amber-900 placeholder-amber-400/50 focus:ring-0"
                        placeholder="Ketik pasangan jawaban...">
                </div>
            </div>
        </div>
    </template>
</div>

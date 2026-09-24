@props(['q'])

<div class="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
    <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
            <tr>
                <th class="p-5 text-left">Pernyataan</th>
                <th class="p-5 text-center w-32 text-emerald-600">Benar</th>
                <th class="p-5 text-center w-32 text-rose-600">Salah</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
            <template x-for="opt in q.options" :key="opt.id">
                <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="p-5  text-slate-700 text-lg" x-html="opt.option_text"></td>

                    <td class="p-5 text-center">
                        <label class="cursor-pointer block">
                            <input type="radio" :name="'tf-'+opt.id" @change="saveSubAnswer(q.id, opt.id, 'benar')"
                                :checked="getSubValue(q.id, opt.id) === 'benar'"
                                class="w-6 h-6 text-emerald-500 border-slate-300 focus:ring-emerald-500">
                        </label>
                    </td>

                    <td class="p-5 text-center">
                        <label class="cursor-pointer block">
                            <input type="radio" :name="'tf-'+opt.id" @change="saveSubAnswer(q.id, opt.id, 'salah')"
                                :checked="getSubValue(q.id, opt.id) === 'salah'"
                                class="w-6 h-6 text-rose-500 border-slate-300 focus:ring-rose-500">
                        </label>
                    </td>
                </tr>
            </template>
        </tbody>
    </table>
</div>

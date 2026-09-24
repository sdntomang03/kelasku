@props(['label' => null, 'height' => '200px', 'mini' => false])

<div class="w-full" x-data="richEditor({
         height: '{{ $height }}',
         mini: {{ $mini ? 'true' : 'false' }}
     })" x-modelable="content" {{ $attributes }}>

    @if($label)
    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
        {!! $label !!}
    </label>
    @endif

    <div wire:ignore
        class="{{ $mini ? 'mini-editor rounded-2xl' : 'bg-white rounded-2xl shadow-sm border border-slate-200' }} overflow-hidden">
        <textarea x-ref="sunEditorInput" class="w-full hidden"></textarea>
    </div>
</div>

@once
@push('scripts')
<script>
    document.addEventListener('alpine:init', () => {
            Alpine.data('richEditor', (config) => ({
                editor: null,
                content: '',

                init() {
                    this.$nextTick(() => {

                        // --- DEFINISI TEMPLATE ---
                        const myTemplates = [
                            // 1. Layout 2 Kolom (Menggunakan Table)
                            {
                                name: '2 Kolom (Tabel)',
                                html: '<table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 10px;">' +
                                      '<tbody><tr>' +
                                      '<td style="width: 50%; vertical-align: top; padding: 5px; border: none;">Isi Kolom Kiri</td>' +
                                      '<td style="width: 50%; vertical-align: top; padding: 5px; border: none;">Isi Kolom Kanan</td>' +
                                      '</tr></tbody></table><p><br></p>'
                            },


                            // 3. Kotak Wacana / Cerita
                            {
                                name: 'Kotak Wacana/Cerita',
                                html: '<div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-left: 4px solid #6366f1; padding: 15px; margin-bottom: 15px; border-radius: 0 8px 8px 0;">' +
                                      '<p><strong>Bacalah teks berikut dengan saksama!</strong></p>' +
                                      '<p>Ganti teks ini dengan wacana atau cerita soal...</p>' +
                                      '</div><p><br></p>'
                            },

                            // 4. Sumber / Referensi
                            {
                                name: 'Sumber/Referensi',
                                html: '<div style="margin-top: 10px; padding-top: 5px; border-top: 1px solid #e2e8f0;">' +
                                      '<p style="font-size: 12px; color: #64748b; font-style: italic;">' +
                                      'Sumber: <em>Tuliskan sumber gambar atau kutipan di sini</em>' +
                                      '</p></div><p><br></p>'
                            },

                            // 5. Gambar dengan Caption
                            {
                                name: 'Gambar + Caption',
                                html: '<div style="text-align: center; margin-bottom: 15px;">' +
                                      '<p>[Masukkan Gambar Di Sini]</p>' +
                                      '<p style="font-size: 13px; color: #475569; font-weight: bold; margin-top: 5px; background: #f1f5f9; display: inline-block; padding: 2px 10px; rounded: 4px;">Gambar 1. Keterangan Gambar</p>' +
                                      '</div><p><br></p>'
                            },

                            // 6. Tabel Data (Style Zebra)
                            {
                                name: 'Tabel Data',
                                html: '<table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; margin-bottom: 10px;">' +
                                      '<thead><tr style="background-color: #f8fafc; color: #334155;">' +
                                      '<th style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold;">No</th>' +
                                      '<th style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold;">Data A</th>' +
                                      '<th style="border: 1px solid #e2e8f0; padding: 10px; font-weight: bold;">Data B</th>' +
                                      '</tr></thead>' +
                                      '<tbody><tr>' +
                                      '<td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">1</td>' +
                                      '<td style="border: 1px solid #e2e8f0; padding: 10px;">...</td>' +
                                      '<td style="border: 1px solid #e2e8f0; padding: 10px;">...</td>' +
                                      '</tr></tbody></table><p><br></p>'
                            }
                        ];

                        const toolbar = config.mini
                            ? [['bold', 'italic', 'underline', 'math', 'image', 'template']]
                            : [
                                ['undo', 'redo'],
                                ['formatBlock', 'font', 'fontSize'],
                                ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', 'removeFormat'],
                                ['fontColor', 'hiliteColor', 'list', 'table', 'template', 'math', 'image', 'video', 'codeView']
                            ];

                        const uploadConfig = window.globalUploadConfig || {};

                        this.editor = SUNEDITOR.create(this.$refs.sunEditorInput, {
                            height: 'auto',
                            minHeight: config.height,
                            maxHeight: config.mini ? null : '500px',

                            // Tambahkan template
                            templates: myTemplates,

                            defaultStyle: `
                                font-family: sans-serif;
                                font-size: 18px;
                                img {
                                    max-height: 300px;
                                    width: auto;
                                    max-width: 100%;
                                }
                                /* Pastikan tabel kolom tidak punya border */
                                table { border-collapse: collapse; }
                            `,

                            mode: 'classic',
                            resizingBar: !config.mini,
                            buttonList: toolbar,
                            katex: window.katex,
                            ...uploadConfig
                        });

                        // 1. Initial Load
                        if (this.content) {
                            this.editor.setContents(this.content);
                        }

                        // 2. Editor -> Alpine
                        this.editor.onChange = (contents) => {
                            this.content = contents;
                        };

                        // 3. Alpine -> Editor (Watcher)
                        this.$watch('content', (value) => {
                            if (this.editor && value !== this.editor.getContents()) {
                                this.editor.setContents(value);
                            }
                        });
                    });
                }
            }));
        });
</script>
@endpush
@endonce
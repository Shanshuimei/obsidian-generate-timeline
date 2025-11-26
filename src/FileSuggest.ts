import { App, FuzzySuggestModal, TFile } from 'obsidian';

export class FileSuggestModal extends FuzzySuggestModal<TFile> {
    private resolve: (value: TFile | null) => void;

    constructor(app: App, private settings: {language: string}) {
        super(app);
        this.setPlaceholder(this.settings.language === 'zh-CN' ? "选择一个Markdown文件" : "Select a Markdown file");
    }

    getItems(): TFile[] {
        // 过滤掉timelines文件夹中的Markdown文件
        return this.app.vault.getMarkdownFiles().filter(file => {
            return !file.path.startsWith('timelines/') && file.path !== 'timelines';
        });
    }

    getItemText(file: TFile): string {
        return file.path;
    }

    onChooseItem(file: TFile): void {
        this.resolve(file);
        this.close();
    }

    async openAndGetValue(): Promise<TFile | null> {
        return new Promise<TFile | null>((resolve) => {
            this.resolve = resolve;
            this.open();
        });
    }
}
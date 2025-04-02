import { App, FuzzySuggestModal, TFile } from 'obsidian';

export class FileSuggestModal extends FuzzySuggestModal<TFile> {
    private resolve: (value: TFile | null) => void;

    constructor(app: App) {
        super(app);
        this.setPlaceholder("选择一个Markdown文件");
    }

    getItems(): TFile[] {
        return this.app.vault.getMarkdownFiles();
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
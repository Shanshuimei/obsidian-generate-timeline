import { App, FuzzySuggestModal, TFolder } from 'obsidian';

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
    private resolve: (value: string | null) => void;

    constructor(app: App, private settings: {language: string}) {
        super(app);
        this.setPlaceholder(this.settings.language === 'zh-CN' ? "选择一个文件夹" : "Select a folder");
    }

    getItems(): TFolder[] {
        const folders: TFolder[] = [];
        const pushFolder = (folder: TFolder) => {
            folders.push(folder);
            folder.children
                .filter((child): child is TFolder => child instanceof TFolder)
                .forEach(pushFolder);
        };

        // 获取根文件夹
        const rootFolder = this.app.vault.getRoot();
        pushFolder(rootFolder);

        return folders;
    }

    getItemText(folder: TFolder): string {
        return folder.path;
    }

    onChooseItem(folder: TFolder): void {
        this.resolve(folder.path);
        this.close();
    }
    async openAndGetValue(): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            this.resolve = resolve;
            this.open();
        }).then((value) => {
            if (value === undefined) {
                return null;
            }
            return value;
        });
    }
}
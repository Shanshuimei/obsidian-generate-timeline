import { App, FuzzySuggestModal, TFile } from 'obsidian';

export class TagSuggestModal extends FuzzySuggestModal<string> {
    private resolve: (value: string | null) => void;

    constructor(app: App) {
        super(app);
        this.setPlaceholder("选择一个标签");
    }

    getItems(): string[] {
        const tags = new Set<string>();
        const files = this.app.vault.getMarkdownFiles();
        
        files.forEach(file => {
            const cache = this.app.metadataCache.getFileCache(file);
            cache?.tags?.forEach(tag => {
                // 移除 # 前缀并添加到集合中
                tags.add(tag.tag.replace('#', ''));
            });
            // 搜索属性中的标签
            const frontmatterTags = cache?.frontmatter?.tags;
            if (Array.isArray(frontmatterTags)) {
                frontmatterTags.forEach((tag: string) => {
                    tags.add(tag.replace('#', ''));
                });
            } else if (typeof frontmatterTags === 'string') {
                frontmatterTags.split('-').forEach((tag: string) => {
                    tags.add(tag.trim().replace('#', ''));
                });
            }
        });
        
        const tagArray = Array.from(tags);
        console.log('可用的标签:', tagArray);
        return tagArray;
    }

    getItemText(tag: string): string {
        return tag;
    }

    onChooseItem(tag: string): void {
        console.log('选择的标签:', tag);
        this.resolve(tag);
        this.close();
    }

    async openAndGetValue(): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            this.resolve = resolve;
            this.open();
        });
    }
}
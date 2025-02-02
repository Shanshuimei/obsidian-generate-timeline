import { TFile, TFolder, App } from 'obsidian';
import { TimelineSettings } from './TimelineSettings';

export interface TimelineItem {
    date: Date;
    title: string;
    path: string;
    preview: string;
}

export class Timeline {
    private app: App;
    private settings: TimelineSettings;

    constructor(app: App, settings: TimelineSettings) {
        this.app = app;
        this.settings = settings;
    }

    private async getFilePreview(file: TFile): Promise<string> {
        const content = await this.app.vault.cachedRead(file);
        const previewContent = content.replace(/^---[\s\S]*?---/, '').trim();
        return previewContent.slice(0, 100) + (previewContent.length > 100 ? '...' : '');
    }

    private async createTimelineItem(file: TFile): Promise<TimelineItem | null> {
        const metadata = this.app.metadataCache.getFileCache(file);
        const dateValue = metadata?.frontmatter?.[this.settings.dateAttribute];
        
        if (dateValue) {
            return {
                date: new Date(dateValue),
                title: file.basename,
                path: file.path,
                preview: await this.getFilePreview(file)
            };
        }
        return null;
    }

    private sortItemsByDate(items: TimelineItem[]): TimelineItem[] {
        return items.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async generateFromFolder(folder: TFolder): Promise<TimelineItem[]> {
        if (folder.path === 'timelines') {
            return [];
        }
        
        const timelineItems: TimelineItem[] = [];
        
        // 递归处理文件夹的函数
        const processFolder = async (currentFolder: TFolder) => {
            for (const item of currentFolder.children) {
                if (item instanceof TFile && item.extension === 'md') {
                    const metadata = this.app.metadataCache.getFileCache(item);
                    const dateValue = metadata?.frontmatter?.[this.settings.dateAttribute];
                    
                    if (dateValue) {
                        timelineItems.push({
                            date: new Date(dateValue),
                            title: item.basename,
                            path: item.path,
                            preview: await this.getFilePreview(item)
                        });
                    }
                } else if (item instanceof TFolder && item.path !== 'timelines') {
                    // 递归处理子文件夹
                    await processFolder(item);
                }
            }
        };
        
        // 开始处理文件夹
        await processFolder(folder);
        
        return timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async generateFromTag(tag: string): Promise<TimelineItem[]> {
        const allFiles = this.app.vault.getMarkdownFiles();
        const items: TimelineItem[] = [];
        
        // 移除开头的#号（如果存在）
        const normalizedTag = tag.replace(/^#/, '');
        
        for (const file of allFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // 检查文件是否包含目标标签或其子标签
            const hasMatchingTag = (cache.tags && cache.tags.some(tagObj => {
                const fileTag = tagObj.tag.replace(/^#/, '');
                return fileTag === normalizedTag || // 完全匹配
                       fileTag.startsWith(normalizedTag + '/'); // 子标签匹配
            })) || (cache.frontmatter && cache.frontmatter.tags && cache.frontmatter.tags.some((frontmatterTag: string) => {
                const fileTag = frontmatterTag.replace(/^#/, '');
                return fileTag === normalizedTag || // 完全匹配
                       fileTag.startsWith(normalizedTag + '/'); // 子标签匹配
            }));

            if (hasMatchingTag) {
                const item = await this.createTimelineItem(file);
                if (item) {
                    items.push(item);
                }
            }
        }
        
        // 按日期排序
        return this.sortItemsByDate(items);
    }

    async generateTimelineMarkdown(items: TimelineItem[], title: string, source: { type: 'tag' | 'folder', value: string }): Promise<string> {
        let markdown = `---\ngenerated_from: ${source.type}:${source.value}\n---\n\n`;
        markdown += `# ${title}\n\n`;
        
        let currentYear = null;
        let currentMonth = null;
        
        for (const item of items) {
            const date = item.date;
            const year = date.getFullYear();
            const month = date.getMonth();
            
            if (currentYear !== year) {
                markdown += `\n## ${year}\n\n`;
                currentYear = year;
                currentMonth = null;
            }
            
            if (currentMonth !== month) {
                markdown += `\n### ${date.toLocaleString('default', { month: 'long' })}\n\n`;
                currentMonth = month;
            }
            
            markdown += `#### ${date.toLocaleDateString('zh-CN')} - [[${item.title}]]\n\n`;
        }
        
        return markdown;
    }
}
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
        const normalizedSearchTag = tag.replace('#', '').trim();
        const timelineItems: TimelineItem[] = [];
        const files = this.app.vault.getMarkdownFiles();
        
        for (const file of files) {
            const metadata = this.app.metadataCache.getFileCache(file);
            let hasTag = false;
            
            // 分别检查 frontmatter 标签和内联标签
            if (metadata?.frontmatter?.tags) {
                const frontmatterTags = metadata.frontmatter.tags;
                
                // 检查不同格式的 frontmatter 标签
                if (Array.isArray(frontmatterTags)) {
                    // 处理数组格式的标签
                    hasTag = frontmatterTags.some(t => 
                        String(t).trim().replace('#', '') === normalizedSearchTag
                    );
                } else if (typeof frontmatterTags === 'string') {
                    // 处理字符串格式的标签（可能是YAML列表或逗号分隔的字符串）
                    const tagList = frontmatterTags.includes(',') 
                        ? frontmatterTags.split(',').map(t => t.trim())
                        : frontmatterTags.split('\n').map(t => t.replace(/^-\s*/, '').trim());
                    
                    hasTag = tagList.some(t => t.replace('#', '') === normalizedSearchTag);
                }
            }
            
            // 如果在 frontmatter 中没找到，检查内联标签
            if (!hasTag && metadata?.tags) {
                hasTag = metadata.tags.some((t: {tag: string}) => 
                    t.tag.replace('#', '').trim() === normalizedSearchTag
                );
            }
            
            const time = metadata?.frontmatter?.[this.settings.dateAttribute];
            
            if (hasTag && time) {
                timelineItems.push({
                    date: new Date(time),
                    title: file.basename,
                    path: file.path,
                    preview: await this.getFilePreview(file)
                });
            }
        }
        
        return timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());
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
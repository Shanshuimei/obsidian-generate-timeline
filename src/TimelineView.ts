import { ItemView, WorkspaceLeaf, TFolder, TFile, Notice, App } from 'obsidian';
import { Timeline, TimelineItem } from './Timeline';
import { TimelineSettings } from './TimelineSettings';

export const VIEW_TYPE_TIMELINE = 'timeline-view';

export class TimelineView extends ItemView {
    private timeline: Timeline;
    private settings: TimelineSettings;
    items: TimelineItem[] = [];
    currentTitle: string = ''; // 新增：存储当前标题

    constructor(leaf: WorkspaceLeaf, settings: TimelineSettings) {
        super(leaf);
        // 通过构造函数注入设置，而不是直接访问插件实例
        this.timeline = new Timeline(this.app, settings);
    }

    getViewType(): string {
        return VIEW_TYPE_TIMELINE;
    }

    getDisplayText(): string {
        return '时间轴视图';
    }

    async onOpen() {
        await this.render();
    }

    async render() {
        const container = this.containerEl.children[1];
        container.empty();
        
        // 添加标题显示
        if (this.currentTitle) {
            const titleContainer = container.createEl('div', { cls: 'timeline-header' });
            titleContainer.createEl('h2', { text: this.currentTitle });
        }
        
        const timelineContainer = container.createEl('div', { cls: 'timeline-container' });
        
        // 创建时间轴线容器
        const timelineLine = timelineContainer.createEl('div', { cls: 'timeline-line' });

        // 按年份分组
        const itemsByYear = new Map<number, TimelineItem[]>();
        this.items.forEach(item => {
            const year = item.date.getFullYear();
            if (!itemsByYear.has(year)) {
                itemsByYear.set(year, []);
            }
            itemsByYear.get(year)?.push(item);
        });

        // 渲染每个时间段
        Array.from(itemsByYear.entries())
            .sort(([yearA], [yearB]) => yearB - yearA)
            .forEach(([year, items]) => {
                const era = timelineContainer.createEl('div', { cls: 'timeline-era' });
                
                // 创建年份标题
                era.createEl('div', { 
                    cls: 'timeline-era-title',
                    text: `${year}`
                });

                // 渲染该年份的所有项目
                items.forEach((item, index) => {
                    const itemEl = era.createEl('div', { 
                        cls: 'timeline-item' + 
                             (index === 0 ? ' first-item' : '') + 
                             (index === items.length - 1 ? ' last-item' : '')
                    });

                    // 创建内容卡片
                    const card = itemEl.createEl('div', { cls: 'timeline-card' });

                    // 日期
                    card.createEl('div', { 
                        cls: 'timeline-date',
                        text: item.date.toLocaleDateString('zh-CN')
                    });

                    // 标题
                    const titleEl = card.createEl('div', { 
                        cls: 'timeline-title'
                    });
                    titleEl.innerHTML = item.title;

                    // 预览内容
                    if (item.preview) {
                        const previewEl = card.createEl('div', { 
                            cls: 'timeline-preview'
                        });
                        previewEl.innerHTML = item.preview;
                    }

                    // 点击事件
                    titleEl.addEventListener('click', async () => {
                        const file = this.app.vault.getAbstractFileByPath(item.path);
                        if (file instanceof TFile) {
                            await this.app.workspace.getLeaf().openFile(file);
                        }
                    });
                });
            });
    }

    async updateFromFolder(folderPath: string) {
        const folder = this.app.vault.getAbstractFileByPath(folderPath) as TFolder;
        if (folder) {
            this.currentTitle = `📂 ${folder.name}`; // 设置文件夹标题
            this.items = await this.timeline.generateFromFolder(folder);
            await this.render();
        }
    }

    async updateFromTag(tag: string) {
        try {
            this.currentTitle = `🏷️ ${tag}`;
            const items = await this.timeline.generateFromTag(tag);
            this.items = items;
            
            if (this.items.length === 0) {
                new Notice(`没有找到包含标签 #${tag} 及其子标签的文件`);
                return;
            }

            await this.render();
        } catch (error) {
            new Notice('生成时间轴失败');
            throw error;
        }
    }

    getIcon(): string {
        return 'history'; // 或者使用 'clock', 'alarm-clock' 等
    }
}
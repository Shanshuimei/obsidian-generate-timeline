import { 
	App, 
	Plugin, 
	PluginSettingTab, 
	Setting, 
	TFile, 
	Menu,
	TAbstractFile,
	normalizePath,
	Notice
} from 'obsidian';
import { I18nStrings, zhCN, enUS } from './i18n';
import { TimelineView, VIEW_TYPE_TIMELINE } from './TimelineView';
import { FolderSuggestModal } from './FolderSuggest';
import { TagSuggestModal } from './TagSuggest';
import { FileSuggestModal } from './FileSuggest';
import { TimelineSettings, DEFAULT_SETTINGS } from './TimelineSettings';
import { Timeline } from './Timeline';
import { TFolder } from 'obsidian';

export default class TimelinePlugin extends Plugin {
	settings: TimelineSettings;
	i18n: I18nStrings;

	async onload() {
		await this.loadSettings();
		this.i18n = this.settings.language === 'zh-CN' ? zhCN : enUS;
		
		// 添加设置标签页
		this.addSettingTab(new TimelineSettingTab(this.app, this));
		
		console.log('加载 Timeline 插件');
		
		try {
			this.registerView(
				VIEW_TYPE_TIMELINE,
				(leaf) => new TimelineView(leaf, this.settings, this.i18n)
			);

			// 添加文件菜单项
			this.registerEvent(
				this.app.workspace.on('file-menu', (menu: Menu, abstractFile: TAbstractFile) => {
					// 检查是否是时间轴文件
					if (abstractFile instanceof TFile && 
						abstractFile.path.startsWith('timelines/') && 
						abstractFile.extension === 'md') {
						
						// 读取文件的 frontmatter
						const cache = this.app.metadataCache.getFileCache(abstractFile);
						const generatedFrom = cache?.frontmatter?.generated_from;
						
						if (generatedFrom) {
							const [type, value] = generatedFrom.split(':');
							
							menu.addItem((item) => {
								item
									.setTitle(this.i18n.commands.openTimelineView)
									.setIcon('clock')
									.onClick(async () => {
										await this.activateView(this.settings.defaultPosition);
										const view = this.getTimelineView();
										if (view) {
											if (type === 'folder') {
												await view.updateFromFolder(value);
											} else if (type === 'tag') {
												await view.updateFromTag(value);
											} else if (type === 'file') {
												await view.updateFromFile(value);
											}
										}
									});
							});
						}
					}
				})
			);

			// 从文件夹生成时间轴视图
			this.addCommand({
				id: 'generate-timeline-view-from-folder',
				name: this.i18n.commands.generateFromFolder,
				callback: async () => {
					try {
						const folderPath = await this.selectFolder();
						if (folderPath) {
							await this.activateView(this.settings.defaultPosition);
							const view = this.getTimelineView();
							if (view) {
								await view.updateFromFolder(folderPath);
							}
						}
					} catch (error) {
						console.error('生成文件夹时间轴视图时出错:', error);
					}
				}
			});

			// 从文件夹生成时间轴文件
			this.addCommand({
				id: 'generate-timeline-file-from-folder',
				name: this.i18n.commands.generateFileFromFolder,
				callback: async () => {
					try {
						const folderPath = await this.selectFolder();
						if (folderPath) {
							const folder = this.app.vault.getAbstractFileByPath(folderPath);
							
							if (!(folder instanceof TFolder)) {
								throw new Error(`Invalid folder path: ${folderPath}`);
							}

							const timeline = new Timeline(this.app, this.settings);
							const items = await timeline.generateFromFolder(folder);
							const content = await timeline.generateTimelineMarkdown(items, `Timeline - ${folderPath}`, { type: 'folder', value: folderPath });
							
							// 创建并打开文件
							const { folderPath: targetFolder, fileName } = await this.createNestedFolders(folderPath);
							const finalFileName = this.generateFileName(fileName || folderPath.split('/').pop() || '');
							const filePath = `${targetFolder}/${finalFileName}.md`;
							
							// 检查文件是否存在,如果存在则删除
							const existingFile = this.app.vault.getAbstractFileByPath(filePath);
							if (existingFile) {
								await this.app.vault.delete(existingFile);
							}
							
							const file = await this.app.vault.create(filePath, content);
							await this.app.workspace.getLeaf().openFile(file);
						}
					} catch (error) {
						console.error('生成文件夹时间轴文件时出错:', error);
					}
				}
			});

			// 从标签生成时间轴视图
			this.addCommand({
				id: 'generate-timeline-view-from-tag',
				name: this.i18n.commands.generateFromTag,
				callback: async () => {
					try {
						const tag = await this.selectTag();
						if (tag) {
							await this.activateView(this.settings.defaultPosition);
							const view = this.getTimelineView();
							if (view) {
								await view.updateFromTag(tag);
							}
						}
					} catch (error) {
						console.error('生成标签时间轴视图时出错:', error);
					}
				}
			});

			// 从标签生成时间轴文件
			this.addCommand({
				id: 'generate-timeline-file-from-tag',
				name: this.i18n.commands.generateFileFromTag,
				callback: async () => {
					try {
						const tag = await this.selectTag();
						if (tag) {
							await this.generateTimelineFileFromTag(tag);
						}
					} catch (error) {
						console.error('生成标签时间轴文件时出错:', error);
					}
				}
			});

			// 从文件链接生成时间轴视图
			this.addCommand({
				id: 'generate-timeline-view-from-file-links',
				name: this.i18n.commands.generateFromFileLinks,
				callback: async () => {
					try {
						const file = await this.selectFile();
						if (file) {
							await this.activateView(this.settings.defaultPosition);
							const view = this.getTimelineView();
							if (view) {
								const timeline = new Timeline(this.app, this.settings);
								const items = await timeline.generateFromFileLinks(file);
								view.items = items;
								view.currentTitle = `🔗 ${file.basename} `;
								await view.render();
							}
						}
					} catch (error) {
						console.error('从文件链接生成时间轴视图时出错:', error);
					}
				}
			});

			// 从文件链接生成时间轴文件
			this.addCommand({
				id: 'generate-timeline-file-from-file-links',
				name: this.i18n.commands.generateFileFromFileLinks,
				callback: async () => {
					try {
						const file = await this.selectFile();
						if (file) {
							const timeline = new Timeline(this.app, this.settings);
							const items = await timeline.generateFromFileLinks(file);
							const content = await timeline.generateTimelineMarkdown(
								items, 
								`Timeline - Links in ${file.basename}`, 
								{ type: 'file', value: file.path }
							);
							
							const { folderPath } = await this.createNestedFolders('linked-files');
							const finalFileName = this.generateFileName(file.basename);
							const filePath = `${folderPath}/${finalFileName}.md`;
							
							const existingFile = this.app.vault.getAbstractFileByPath(filePath);
							if (existingFile) {
								await this.app.vault.delete(existingFile);
							}
							
							const newFile = await this.app.vault.create(filePath, content);
							await this.app.workspace.getLeaf().openFile(newFile);
						}
					} catch (error) {
						console.error('从文件链接生成时间轴文件时出错:', error);
					}
				}
			});
			
		} catch (error) {
			console.error('插件加载时出错:', error);
		}
	}
	
	async selectFolder(): Promise<string | null> {
		const modal = new FolderSuggestModal(this.app);
		return await modal.openAndGetValue();
	}

	async selectFile(): Promise<TFile | null> {
		const modal = new FileSuggestModal(this.app);
		return await modal.openAndGetValue();
	}

	async selectTag(): Promise<string | null> {
		const modal = new TagSuggestModal(this.app);
		return await modal.openAndGetValue();
	}

	async activateView(position: 'left' | 'right' = this.settings.defaultPosition) {
		const { workspace } = this.app;
		
		// 获取所有时间轴视图的叶子节点
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TIMELINE);
		
		// 如果已存在时间轴视图，直接使用第一个
		if (leaves.length > 0) {
			workspace.revealLeaf(leaves[0]);
			return leaves[0];
		}

		// 不存在时创建新视图
		const newLeaf = position === 'left' 
			? workspace.getLeftLeaf(false)
			: workspace.getRightLeaf(false);
		
		if (!newLeaf) {
			new Notice('无法创建时间轴视图：请检查侧边栏空间');
			return null;
		}

		await newLeaf.setViewState({ type: VIEW_TYPE_TIMELINE });
		workspace.revealLeaf(newLeaf);
		
		return newLeaf;
	}

	getTimelineView(): TimelineView | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE);
		if (leaves.length === 0) {
			return null;
		}
		return leaves[0].view as TimelineView;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.updateStyles();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateStyles();
	}

	updateStyles() {
		const style = document.createElement('style');
		style.id = 'timeline-custom-styles';
		style.textContent = `
			.timeline-line {
				width: ${this.settings.lineWidth}px !important;
				background: ${this.settings.lineColor} !important;
			}
			.timeline-item::after {
				background: var(--timeline-line-color, ${this.settings.lineColor}) !important;
			}
			.timeline-item {
				margin: ${this.settings.itemSpacing}px 0 !important;
			}
			.timeline-card {
				background: ${this.settings.cardBackground} !important;
				color: ${this.settings.cardTextColor} !important;
				border: 1px solid ${this.settings.cardBorderColor} !important;
				transition: transform ${this.settings.animationDuration}ms !important;
			}
			.timeline-item-milestone .timeline-card {
				background: ${this.settings.milestoneCardBackground} !important;
				color: ${this.settings.milestoneCardTextColor} !important;
				border: 1px solid ${this.settings.milestoneCardBorderColor} !important;
			}
			[data-color-setting="cardTextColor"] {
				color: ${this.settings.cardTextColor} !important;
			}
			[data-color-setting="milestoneCardTextColor"] {
				color: ${this.settings.milestoneCardTextColor} !important;
			}
			.timeline-date {
				color: ${this.settings.cardTextColor} !important;
			}
			.timeline-item-milestone .timeline-date {
				color: ${this.settings.milestoneCardTextColor} !important;
			}
			.timeline-era-title {
				color: var(--timeline-line-color, ${this.settings.lineColor}) !important;
			}
		`;
		// 移除旧样式
		document.getElementById('timeline-custom-styles')?.remove();
		document.head.appendChild(style);
	}

	async createNestedFolders(tagPath: string) {
			// 检查并创建根目录
			const rootPath = 'timelines';
			if (!this.app.vault.getAbstractFileByPath(rootPath)) {
				try {
					await this.app.vault.createFolder(rootPath);
				} catch (error) {
					new Notice(`创建根目录失败: ${rootPath}`);
					throw error;
				}
			}
		
			// 将路径分割为文件夹部分和文件名部分
			const parts = tagPath.split('/');
			const fileName = parts.pop(); // 移除最后一个部分作为文件名
			let currentPath = rootPath;
		
			// 为每个父文件夹创建目录
			for (const part of parts) {
				currentPath = normalizePath(`${currentPath}/${part}`);
				const folder = this.app.vault.getAbstractFileByPath(currentPath);
				if (!folder) {
					try {
						await this.app.vault.createFolder(currentPath);
					} catch (error) {
						new Notice(`创建文件夹失败: ${currentPath}`);
						throw error;
					}
				}
			}
		
			return { folderPath: currentPath, fileName };
		}

	generateFileName(baseName: string): string {
		const prefix = this.settings.fileNamePrefix || '';
		const suffix = this.settings.fileNameSuffix || '';
		return `${prefix}${baseName}${suffix}`;
	}

	async generateTimelineFileFromTag(tag: string) {
		try {
			const tagPath = tag.replace('#', '');
			const { folderPath, fileName } = await this.createNestedFolders(tagPath);
			const finalFileName = this.generateFileName(fileName || '');
			const filePath = `${folderPath}/${finalFileName}.md`;

			// 检查文件是否存在,如果存在则删除
			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile) {
				await this.app.vault.delete(existingFile);
			}
			
			const timeline = new Timeline(this.app, this.settings);
			const items = await timeline.generateFromTag(tag);
			const content = await timeline.generateTimelineMarkdown(items, `Timeline - ${tag}`, { type: 'tag', value: tag });
			
			// 创建并打开文件
			const file = await this.app.vault.create(filePath, content);
			await this.app.workspace.getLeaf().openFile(file);
		} catch (error) {
			console.error('生成标签时间轴文件时出错:', error);
			throw error;
		}
	}
}

class TimelineSettingTab extends PluginSettingTab {
	plugin: TimelinePlugin;

	constructor(app: App, plugin: TimelinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.resetSettings)
			.setDesc(this.plugin.i18n.settings.resetSettingsDesc)
			.addButton(button => button
				.setButtonText(this.plugin.i18n.settings.resetSettingsButton)
				.onClick(async () => {
					this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
					await this.plugin.saveSettings();
					// 重新显示设置面板
					this.display();
				}));

		// 添加语言选择设置
		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.language)
			.setDesc(this.plugin.i18n.settings.languageDesc)
			.addDropdown(dropdown => dropdown
				.addOption('zh-CN', '中文')
				.addOption('en-US', 'English')
				.setValue(this.plugin.settings.language)
				.onChange(async (value) => {
					this.plugin.settings.language = value as 'zh-CN' | 'en-US';
					this.plugin.i18n = value === 'zh-CN' ? zhCN : enUS;
					await this.plugin.saveSettings();
					// 重新显示设置面板以更新语言
					this.display();
				}));

		// 添加里程碑属性设置
		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.milestoneAttribute) 
			.setDesc(this.plugin.i18n.settings.milestoneAttributeDesc) // 
			.addText(text => text
				.setPlaceholder('milestone')
				.setValue(this.plugin.settings.milestoneAttribute)
				.onChange(async (value) => {
					this.plugin.settings.milestoneAttribute = value;
					await this.plugin.saveSettings();
				}));

		// 添加里程碑值设置
		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.milestoneValue) 
			.setDesc(this.plugin.i18n.settings.milestoneValueDesc)
			.addText(text => text
				.setPlaceholder('true or 1 (leave empty to match any value)')
				.setValue(this.plugin.settings.milestoneValue)
				.onChange(async (value) => {
					this.plugin.settings.milestoneValue = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.lineWidth)
			.setDesc(this.plugin.i18n.settings.lineWidthDesc)
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.lineWidth)
				.onChange(async (value) => {
					this.plugin.settings.lineWidth = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.lineColor)
			.setDesc(this.plugin.i18n.settings.lineColorDesc)
			.addColorPicker(color => color
				.setValue(this.plugin.settings.lineColor)
				.onChange(async (value) => {
					this.plugin.settings.lineColor = value;
					await this.plugin.saveSettings();
				}))
			.addText(text => text
				.setPlaceholder(this.plugin.i18n.settings.colorPickerPlaceholder)
				.setValue('')
				.onChange(async (value) => {
					if (value) {
						this.plugin.settings.lineColor = value;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.itemSpacing)
			.setDesc(this.plugin.i18n.settings.itemSpacingDesc)
			.addSlider(slider => slider
				.setLimits(10, 100, 5)
				.setValue(this.plugin.settings.itemSpacing)
				.onChange(async (value) => {
					this.plugin.settings.itemSpacing = value;
					await this.plugin.saveSettings();
				}));

		// 卡片样式设置
		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.cardBackground)
			.setDesc(this.plugin.i18n.settings.cardBackgroundDesc)
			.addColorPicker(color => color
				.setValue(this.plugin.settings.cardBackground)
				.onChange(async (value) => {
					this.plugin.settings.cardBackground = value;
					await this.plugin.saveSettings();
				})
			)
			.setTooltip(this.plugin.i18n.settings.colorPickerPlaceholder);
		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.cardTextColor)
			.setDesc(this.plugin.i18n.settings.cardTextColorDesc)
			.addColorPicker(color => color
				.setValue(this.plugin.settings.cardTextColor)
				.onChange(async (value) => {
					this.plugin.settings.cardTextColor = value;
					await this.plugin.saveSettings();
				})
			)
		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.cardBorderColor)
			.setDesc(this.plugin.i18n.settings.cardBorderColorDesc)
			.addColorPicker(color => color
				.setValue(this.plugin.settings.cardBorderColor)
				.onChange(async (value) => {
					this.plugin.settings.cardBorderColor = value;
					await this.plugin.saveSettings();
				})
			)
		// 里程碑卡片样式设置
		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.milestoneCardBackground)
			.setDesc(this.plugin.i18n.settings.milestoneCardBackgroundDesc)
			.addColorPicker(color => color
				.setValue(this.plugin.settings.milestoneCardBackground)
				.onChange(async (value) => {
					this.plugin.settings.milestoneCardBackground = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.milestoneCardTextColor)
			.setDesc(this.plugin.i18n.settings.milestoneCardTextColorDesc)
			.addColorPicker(color => color
				.setValue(this.plugin.settings.milestoneCardTextColor)
				.onChange(async (value) => {
					this.plugin.settings.milestoneCardTextColor = value;
					await this.plugin.saveSettings();
				})
			)
		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.milestoneCardBorderColor)
			.setDesc(this.plugin.i18n.settings.milestoneCardBorderColorDesc)
			.addColorPicker(color => color
				.setValue(this.plugin.settings.milestoneCardBorderColor)
				.onChange(async (value) => {
					this.plugin.settings.milestoneCardBorderColor = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.animationDuration)
			.setDesc(this.plugin.i18n.settings.animationDurationDesc)
			.addSlider(slider => slider
				.setLimits(0, 1000, 50)
				.setValue(this.plugin.settings.animationDuration)
				.onChange(async (value) => {
					this.plugin.settings.animationDuration = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.dateAttribute)
			.setDesc(this.plugin.i18n.settings.dateAttributeDesc)
			.addText(text => text
				.setPlaceholder('created')
				.setValue(this.plugin.settings.dateAttribute)
				.onChange(async (value) => {
					this.plugin.settings.dateAttribute = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.fileNamePrefix)
			.setDesc(this.plugin.i18n.settings.fileNamePrefixDesc)
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.fileNamePrefix)
				.onChange(async (value) => {
					this.plugin.settings.fileNamePrefix = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.fileNameSuffix)
			.setDesc(this.plugin.i18n.settings.fileNameSuffixDesc)
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.fileNameSuffix)
				.onChange(async (value) => {
					this.plugin.settings.fileNameSuffix = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.plugin.i18n.settings.defaultPosition)
			.setDesc(this.plugin.i18n.settings.defaultPositionDesc)
			.addDropdown(dropdown => dropdown
				.addOption('left', this.plugin.i18n.settings.leftSidebar)
				.addOption('right', this.plugin.i18n.settings.rightSidebar)
				.setValue(this.plugin.settings.defaultPosition)
				.onChange(async (value) => {
					this.plugin.settings.defaultPosition = value as 'left' | 'right';
					await this.plugin.saveSettings();
				})
			);
	}
}

<h1 align="center">
	Generate Timeline
</h1>

<p align="center">
    <a href="https://github.com/Shanshuimei/obsidian-generate-timeline/stargazers"><img src="https://img.shields.io/github/stars/Shanshuimei/obsidian-generate-timeline?colorA=363a4f&colorB=e0ac00&style=for-the-badge" alt="GitHub star count"></a>
    <a href="https://github.com/Shanshuimei/obsidian-generate-timeline/issues"><img src="https://img.shields.io/github/issues/Shanshuimei/obsidian-generate-timeline?colorA=363a4f&colorB=e93147&style=for-the-badge" alt="Open issues on GitHub"></a>
    <a href="https://github.com/Shanshuimei/obsidian-generate-timeline/contributors"><img src="https://img.shields.io/github/contributors/Shanshuimei/obsidian-generate-timeline?colorA=363a4f&colorB=08b94e&style=for-the-badge" alt="List of contributors"></a>
    <a href="./LICENCE"><img src="https://img.shields.io/static/v1.svg?style=for-the-badge&label=License&message=MIT&colorA=363a4f&colorB=b7bdf8" alt="MIT license"/></a>
    <a href="https://github.com/Shanshuimei/obsidian-generate-timeline/releases"><img src="https://img.shields.io/github/downloads/Shanshuimei/obsidian-generate-timeline/total?colorA=363a4f&colorB=1a72f5&style=for-the-badge" alt="Total downloads"></a>
    <br/><br/>
    <b>Generate Timeline</b> It is a plugin that helps users generate timelines based on folders, tags, files, or metadata. With this plugin, users can easily view and manage their notes in chronological order.
</p>
<p align="center"><a href="https://kivgf4fnsy5.feishu.cn/drive/folder/ELWHf58RmlCOv6dBLSKcEG44nRd?from=from_copylink">中文文档</a></p>

## Functional Overview

1. **Generate Timeline Based on Folders**:
   - Select a folder, and the plugin will scan all files (including subfolders) within it to generate a timeline based on the time attributes in the files.
   - Supports both timeline view and Markdown file formats. 
   <p></p>

   https://github.com/user-attachments/assets/10b64bef-4a07-4e2e-bded-152dc82ab241

2. **Generate Timeline Based on Metadata**:
   - Input metadata attributes and its value, the plugin will scan all files with matching metadata to generate a timeline based on time attributes.
   - Supports both timeline view and Markdown file formats.
   <p></p>

3. **Generate Timeline Based on Tags**:
   - Select a tag, and the plugin will scan all content with that tag (including subtags) to generate a timeline based on the time attributes.
   - Supports both timeline view and Markdown file formats.
      <p></p>

   https://github.com/user-attachments/assets/5da9d7ac-67f1-4c65-bbef-f703696463d8

4. **Generate Timeline Based on File Links**:
   - Extract all internal links from a specified file and generate a timeline based on the linked files' time attributes.
   - Supports both timeline view and Markdown file formats.
     <p></p>

   https://github.com/user-attachments/assets/b55edb9a-db6f-4a3d-929b-8bc279bd3c72

5. **Milestone functionality** :
   - milestones can be marked with a custom frontmatter attribute.
   - milestone cards have a special style.
     <p></p>
     
   https://github.com/user-attachments/assets/3e92a73a-2af5-4f75-90be-a13aca6c1375

## How to Use

1. **Generate Timeline from Folder**
   - Open the Command Palette and choose one of the following:
     - `Generate Timeline: Generate Timeline View from Folder` for a timeline view
     - `Generate Timeline: Generate Timeline File from Folder` for a Markdown file
   - Select your target folder and the timeline will be generated automatically

2. **Generate Timeline from Metadata**
   - Open the Command Palette and choose one of the following:
     - `Generate Timeline: Generate Timeline View from Metadata` for a timeline view
     - `Generate Timeline: Generate Timeline File from Metadata` for a Markdown file
   - Select the metadata attributes and values to filter by

3. **Generate Timeline from Tags**
   - Open the Command Palette and choose one of the following:
     - `Generate Timeline: Generate Timeline View from Tags` for a timeline view
     - `Generate Timeline: Generate Timeline File from Tags` for a Markdown file
   - Select your desired tag and the timeline will be generated automatically

4. **Generate Timeline from File Links**
   - Open the Command Palette and choose one of the following:
     - `Generate Timeline: Generate Timeline View from File Links` for a timeline view
     - `Generate Timeline: Generate Timeline File from File Links` for a Markdown file
   - Select the source file containing the links

## Customization Options

The plugin offers various customization settings:

1. **Timeline Appearance**:
   - Timeline line width and color
   - Item spacing
   - Card background color, text color and border color
   - Animation duration
   - Milestone card background color, text color and border color

2. **Content Settings**:
   - Date attribute: Choose which frontmatter date property to use for sorting (e.g., created, updated, date)
   - File name prefix and suffix: Customize the naming pattern for generated timeline files
   - Milestone property settings: custom property names and matching values
   - The card preview preferentially displays the row where the label is located.

3. **View Position**:
   - Choose whether the timeline view appears in the left or right sidebar

4. **Language Settings**:
   - Support Chinese and English

## Contribution

We welcome contributions of any kind! If you have suggestions, questions, or would like to add new features, please submit an Issue or Pull Request on the GitHub repository.

## License

This plugin is released under the MIT License. For more details, please refer to the LICENSE file.

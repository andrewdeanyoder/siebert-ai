# Preingest Transformation Prompt

Used to add proper headings to markdown files before ingestion.

## Prompt
I have a markdown document where all headings are formatted as bold text (e.g., **Heading Name**) regardless of their actual level in the document hierarchy. I need you to convert these bold headings to proper markdown headings (#, ##, ###, etc.) based on their role in the document structure. We will also delete certain content.
Rules:
* Identify the document title and assign it #
* Assign ## to major section headings
* Assign ### to subsections, and #### to sub-subsections, and so on
* Infer hierarchy from context: consider the table of contents (if present), how sections nest within one another, and the relative importance/scope of each heading
* Do not change any other formatting — only convert bold headings to markdown heading syntax
* A line is a heading if it stands alone as a section label; do not convert bold text that is inline within a paragraph or list item (e.g., a bold term being defined in a bullet point should stay bold)
* Remove any sections that exist solely to test the reader's knowledge of the material, such as practice questions, quizzes, and answer keys. A section should be removed if it contains only questions, prompts for the reader to respond to, or answers to those questions — with no explanatory content. Remove both the heading and all content within that section. In your response, note the sections that were removed.
* Remove any images from the document, including any surrounding whitespace or blank lines left behind by their removal. An image in markdown is formatted as ![alt text](url).
* Remove any sections that exist solely to list references, citations, or sources, such as a "Sources," "References," or "Bibliography" section. Remove both the heading and all content within that section.
* Remove any sections that exist only to communicate copyright protections.
* Output the finished document as a downloadable markdown file.

Here is the document:
[PASTE DOCUMENT HERE]
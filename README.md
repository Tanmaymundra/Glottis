# Glottis

Glottis is a VS Code extension that helps keep your JSON translation files in sync across multiple languages. It detects missing keys, creates placeholders for them, and shows a diff preview before applying any changes.

## Features

- Select multiple language JSON files and choose one as the reference
- Highlights missing keys for the other files using diagnostics
- Generates placeholder values (`MISSING_TRANSLATION`) for absent keys
- Shows side-by-side diffs of the original and updated files before changes are applied
- Outputs a summary of all missing keys

## Installation

1. Clone this repository and install dependencies:

   ```bash
   npm install
   ```

2. Compile the extension:

   ```bash
   npm run compile
   ```

3. Launch the extension from VS Code by pressing `F5` to open a new Extension Development Host window.

## Usage

1. Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Run **`Fix Missing Translation Keys`**.
3. Select two or more translation JSON files. The first file is used as the reference.
4. Review the diff previews. Confirm to apply the placeholder values for missing keys.

## Development

- `npm run watch` – compile TypeScript in watch mode
- `npm test` – run extension tests

## Roadmap

Planned improvements include:

- Configuration options for custom placeholder text
- Support for more file formats (e.g. YAML)
- Automatic detection of translation files in the workspace

Contributions and feedback are welcome. Please open an issue or pull request with your ideas.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

<p align="center">
  <img src="assets/icon.png" width="96" alt="Tonight Timer icon" />
</p>

<h1 align="center">Tonight Timer</h1>

<p align="center">
  A small Windows desktop widget that shows how long you have until bedtime—and how much of that time is still available for studying.
</p>

<p align="center">
  <strong>Windows 10/11 · English/中文 · Local only</strong>
</p>

<p align="center"><a href="README.zh-CN.md">简体中文</a> · English</p>

## Why this app exists

> Tomorrow, and tomorrow again—how many tomorrows do we have?

When I procrastinate, I sometimes reach the evening feeling that another day has slipped away and that I have accomplished nothing. But is that really true?

Even if you do not start studying until 9:30 p.m., you may still have 2.5 hours for focused, uninterrupted work. Stop telling yourself you will begin tomorrow—**start tonight.**

This widget will not complete your plans for you. It simply reminds you that today is not over yet, and there is still time to do something meaningful for yourself.

## What it does

Set your bedtime and Tonight Timer continuously displays:

- **Time to bed** — the real time remaining before your next bedtime.
- **Study time left** — time to bed minus your wind-down time (1.5 hours by default).

It handles bedtime after midnight correctly. For example, at 23:30 with bedtime set to 01:00, the remaining time is **1.5 hours**, not a negative number or 23.5 hours.

```text
Study time left = Time to bed − Wind-down time
```

## Preview

| 中文 | English |
|:---:|:---:|
| <img src="docs/images/dashboard-zh.png" alt="Chinese interface" width="420" /> | <img src="docs/images/dashboard-en.png" alt="English interface" width="420" /> |

## Features

- Bedtime countdown across midnight
- Hours or minutes display
- Custom wind-down time
- Complete Chinese and English interface
- Dark, light, and system themes
- Always on top and position lock
- Start with Windows
- System tray support
- Settings and window position saved locally
- No account, network connection, or data upload

## Download

Open the repository's **Releases** page and download one of these files:

- `TonightTimer-Setup-1.1.0-x64.exe` — installer with desktop and Start menu shortcuts
- `TonightTimer-Portable-1.1.0-x64.exe` — portable version; no installation required

The app does not currently use a paid code-signing certificate, so Windows SmartScreen may show **Unknown publisher** on first launch. Verify that the file came from this repository, then choose **More info → Run anyway**.

## Quick start

1. Launch the app and click the gear button.
2. Set your bedtime and choose **Auto** for normal cross-midnight calculation.
3. Adjust the wind-down time if needed.
4. Choose **English** or **中文** under **Language**.
5. Drag the title area to position the widget; enable **Lock position** when finished.

The minus button hides the widget to the system tray. Click the moon tray icon to show it again.

## Build from source

Requires Node.js 20 or later on Windows.

```bash
npm install
npm start
npm test
npm run dist
```

Build outputs are written to `release/`.

## Privacy

All settings stay on your computer. Tonight Timer does not require an account and does not send any data over the internet.

## License

Licensed under the [MIT License](LICENSE).

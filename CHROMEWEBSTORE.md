# Chrome Web Store Listing — SoundScape Studio

> Last Updated: 2026-05-27

## Store Listing

**Extension Name** [REQUIRED]
SoundScape Studio

**Short Description** [REQUIRED]
An immersive premium focus workspace featuring an ambient sound mixer, dynamic Pomodoro timer, notepad, and task checklist.

**Detailed Description** [REQUIRED]
SoundScape Studio transforms your browser into a premium, immersive focus environment designed to help you work, study, and relax without distractions.

Key Features:
- Immersive Ambient Audio Engine: Mix and match high-quality nature sounds (rain, thunder, ocean, campfire, birds, cafe) to create your perfect background noise.
- Authentic Lo-Fi Beats: Enjoy a built-in library of real, offline-ready lo-fi tracks that help you find your flow.
- Procedural Synthesizers: Generative ambient synths (Brown Noise, Space Pads, Alpha/Theta waves) to isolate your brain from background chatter.
- Dynamic Pomodoro Timer: Customizable work and break intervals that sync with your workflow.
- Built-in Task Management: A clean, distraction-free notepad and task checklist right alongside your timer.
- Beautiful UI: Enjoy a sleek, dark-mode focused glassmorphism interface that feels premium and responsive.

How to Use:
1. Open the SoundScape Studio side panel by clicking the extension icon.
2. Select your desired ambient sounds from the mixer and adjust the master volume.
3. Start the Pomodoro timer to begin your focus session.
4. Add your tasks for the session to the checklist.

Privacy Matters:
We do not collect, track, or sell your personal data. Your focus is your business. Your task data and notepad contents remain locally on your device.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Provides an integrated ambient sound mixer, Pomodoro timer, and task manager inside a browser side panel to improve focus.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ⬜ Not created | |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 4 | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 5 | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes
- Screenshot 1: The main side panel view showing the ambient sound mixer and the active Pomodoro timer.
- Screenshot 2: The Lofi and Synthesizer cards showing the premium features.
- Screenshot 3: The task checklist and notepad populated with a daily workflow.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| sidePanel | permissions | Required to render the main interface of the extension as a side panel alongside the user's web browsing. |
| storage | permissions | Required to save the user's task checklist, notepad contents, Pomodoro settings, theme preferences, and premium license status locally across browser sessions. |

**Note:** All ambient/nature sounds are now fully bundled locally with the extension. No external audio requests are made.

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Only when the user voluntarily enters a premium license key.

All core data (tasks, notepad, timer settings, themes, sound preferences) is stored **100% locally** using Chrome's `storage.local` API. Nothing is sent to any server.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Task list & notepad content | Yes | No | Saved locally for the user | No |
| Sound preferences & volume | Yes | No | Saved locally for the user | No |
| Pomodoro session count | Yes | No | Saved locally for the user | No |
| Premium license key (optional) | Yes (only if user pastes one) | Yes (only to Lemon Squeezy when user clicks "Verify") | To validate a purchased license key | Yes (Lemon Squeezy) |
| Any other personal or browsing data | No | No | — | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes
- [x] Core productivity data never leaves the user's device

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
A simple privacy.html file has been created in the project (`privacy.html`). It should be hosted publicly (GitHub Pages, Netlify, etc.) and linked here before submission.

Example final URL: `https://yourdomain.com/soundscape-studio/privacy` or GitHub Pages equivalent.

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free to install (Optional one-time premium license via Lemon Squeezy)

## Developer Info

**Publisher Name** [REQUIRED]
[Your Publisher Name]

**Contact Email** [REQUIRED]
[Your Email]

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-05-27 | All ambient sounds now fully local. Removed external Google audio dependency. Improved Zen mode and PRO gating. | Draft |

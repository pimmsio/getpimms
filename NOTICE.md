# NOTICE

This project is based on [Dub](https://github.com/dubinc/dub), originally developed by Steven Tey, and licensed under the AGPL.

All modifications made to the Dub codebase in this repository are also licensed under the AGPL and reflect the current production version running at https://app.pimms.io.

---

## Modifications – April 14, 2025

The following changes were made across three commits on April 14, 2025, and are currently live in production:

### Rebranding and Initial Configuration
- Renamed the product to "Pimms"
- Updated all brand references, logos, color schemes, and UI text
- Updated internal constants and configuration values:
  - Domain names: `app.pimms.io`, `pim.ms`
  - Cookie names and HTTP headers
- Removed remaining references to the original Dub branding

### Functional Adjustments
- Removed features not required for Pimms:
  - Folders
  - Advanced links functionality
- Split tracking views into two new pages: "Conversions" and "Sales"
- Simplified link and event management logic

### Middleware and Backend Logic
- Rewrote routing and redirection middleware
- Added improved logic for device-based behavior and safer handling of Android intent links

### Integrations and Billing
- Set up and integrated:
  - Stripe app for billing
  - Zapier automation
  - Calendly link support
- Customized billing plans and user tier limits, including support for a lifetime license

### User Interface and Experience
- Applied full rebrand styling to dashboard and login views
- Improved layout spacing and typography
- Rewrote interface copy to match the Pimms tone and structure

---

These changes were implemented in the following commits:
- `feat(branding): update basic brand naming and ui and basic cfg from dub fork`
- `feat: make things work now`
- `feat: add notice`

This repository remains synchronized with the code deployed at https://app.pimms.io.

---

## Future Modifications

- [To be documented here as additional updates are made]

# Onboarding Setup Guides -- Complete Reference

This document describes every onboarding setup wizard as implemented in code, including all steps, props, scripts, verification checks, edge cases, and shared components.

---

## Table of Contents

1. [Shared Components](#shared-components)
2. [Stripe](#stripe)
3. [Brevo](#brevo)
4. [Podia](#podia)
5. [Calendly](#calendly)
6. [Cal.com](#calcom)
7. [Framer](#framer)
8. [Webflow](#webflow)
9. [WordPress / Elementor](#wordpress--elementor)
10. [Tally](#tally)
11. [Systeme.io](#systemeio)
12. [Script-Check API](#script-check-api)

---

## Shared Components

### StepCard

Wrapper card for each step. Renders a title, optional description, and children content inside a bordered white card.

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `title` | `string` | yes | -- |
| `description` | `string` | no | -- |
| `children` | `ReactNode` | yes | -- |
| `className` | `string` | no | -- |

### GuideCard

Displays a link to an external guide with thumbnail, shown at the top of each wizard.

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `title` | `string` | no | `"Guide"` |
| `description` | `string` | no | `"Keep the guide handy while you complete the steps."` |
| `href` | `string` | yes | -- |
| `thumbnail` | `string \| null` | no | -- |

### CopyField

Read-only input with a copy button. Clicking either the input or the button copies the value.

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `label` | `string` | yes | -- |
| `value` | `string` | yes | -- |
| `copyValue` | `string` | no | falls back to `value` |
| `disabled` | `boolean` | no | `false` |

**Edge case:** Only shows "Copied" feedback on successful clipboard write. Failures are silently ignored.

### InstallScriptStep

Displays one or more scripts for the user to copy, with an optional guide link and merge note.

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `title` | `string` | yes | -- |
| `description` | `string` | no | -- |
| `info` | `ReactNode` | no | -- |
| `mergeNote` | `ReactNode` | no | -- |
| `scripts` | `{ label, value }[]` | no | -- |
| `script` | `string` | no | -- |
| `scriptLabel` | `string` | no | `"Script"` |
| `isDone` | `boolean` | yes | -- |
| `onConfirm` | `() => void` | yes | -- |
| `confirmLabel` | `string` | no | `"Next"` |
| `confirmDisabled` | `boolean` | no | -- |
| `guideStepHref` | `string` | no | -- |
| `guideStepLabel` | `string` | no | `"Open step in guide"` |

When both `scripts` and `script` are empty, no copy fields are rendered.

### ScriptInstallVerifyStep

Verifies that scripts and props are correctly installed on a user-provided URL. Calls the `GET /api/onboarding/script-check` endpoint.

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `title` | `string` | yes | -- |
| `description` | `string` | no | -- |
| `required` | (see below) | yes | -- |
| `initialUrlPlaceholder` | `string` | no | `"https://your-site.com"` |
| `autoVerify` | `boolean` | no | `false` |
| `autoVerifyIntervalMs` | `number` | no | `8000` |
| `onNext` | `() => void` | yes | -- |

**`required` type:**

```typescript
{
  detection: boolean;
  injectForm?: boolean | "info";
  expose?: boolean | "info";
  outbound?: string;
  thankYou?: boolean | "info";
  forwardAll?: boolean | "info";
}
```

- `true` = required (red X when missing, blocks "Next")
- `"info"` = recommended (amber warning when missing, does NOT block "Next")

**Verification rows displayed:**

| Check | When shown | Blocking |
|-------|------------|----------|
| Detection script | always | yes |
| Form injection script | `injectForm: true \| "info"` | only if `true` |
| Expose script | `expose: true \| "info"` | only if `true` |
| Outbound domain ({domain}) | `outbound: "domain"` | yes |
| Thank-you tracking | `thankYou: true \| "info"` | only if `true` |
| Forward all links | `forwardAll: true \| "info"` | only if `true` |

Uses `useWorkspace()` internally to pass `workspaceId` to the API (required for auth).

### WebhookConfigStep

Displays one or more read-only fields (URL, secret, etc.) for the user to copy into the external service.

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `title` | `string` | yes | -- |
| `description` | `string` | no | -- |
| `fields` | `{ label, value, disabled? }[]` | yes | -- |
| `isDone` | `boolean` | yes | -- |
| `onConfirm` | `() => void` | yes | -- |
| `confirmLabel` | `string` | no | `"Next"` |
| `confirmDisabled` | `boolean` | no | -- |

### ManualConfirmStep

Generic step where the user manually confirms they've completed an action.

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `title` | `string` | yes | -- |
| `description` | `string` | no | -- |
| `isDone` | `boolean` | yes | -- |
| `confirmLabel` | `string` | no | `"Next"` |
| `showConfirmButton` | `boolean` | no | `true` |
| `confirmDisabled` | `boolean` | no | -- |
| `onConfirm` | `() => void` | yes | -- |
| `actions` | `ReactNode` | no | -- |

### CreateTestLinkStep

Creates a short test link (expires in 24h) pointing to the user's destination URL.

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `title` | `string` | yes | -- |
| `description` | `string` | no | -- |
| `info` | `string` | no | -- |
| `urlValue` | `string` | yes | -- |
| `urlPlaceholder` | `string` | no | `"https://example.com/booking"` |
| `onChangeUrl` | `(string) => void` | yes | -- |
| `creating` | `boolean` | yes | -- |
| `error` | `string \| null` | yes | -- |
| `created` | `OnboardingTestLink \| null` | yes | -- |
| `onCreate` | `() => void` | yes | -- |
| `onOpenCreated` | `() => void` | no | -- |
| `onReset` | `() => void` | no | -- |

**Behaviors:**
- Auto-copies the short link to clipboard when created and shows a toast ("Copied short link to clipboard!").
- Shows "Open test link", "Copy link", and "Create another" buttons once created.

### WaitForLeadStep

Waits for a lead or sale to be detected. Shows a loading spinner while polling and a success message when done.

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `title` | `string` | yes | -- |
| `description` | `string` | no | -- |
| `linkHref` | `string \| null` | no | -- |
| `canStart` | `boolean` | yes | -- |
| `waiting` | `boolean` | yes | -- |
| `done` | `boolean` | yes | -- |
| `onStartWaiting` | `() => void` | no | -- |
| `waitingLabel` | `string` | no | `"Waiting for contact…"` |
| `successLabel` | `string` | no | `"Contact recorded. Tracking works."` |
| `warnings` | `ReactNode[]` | no | -- |

**Behaviors:**
- Polling auto-starts as soon as the test link is created (no manual trigger needed).
- "Open test link" button opens the link in a new tab.
- "Copy link" button copies the link URL to clipboard.
- Warnings are shown in an amber box with bullet points above the buttons.

### useWaitForLinkLead (Hook)

Polls `GET /api/links/{linkId}` every 2 seconds to check if the lead/sale metric meets the minimum threshold.

| Param | Type | Default |
|-------|------|---------|
| `workspaceId` | `string \| null` | -- |
| `linkId` | `string \| null` | -- |
| `metric` | `"leads" \| "sales"` | `"leads"` |
| `min` | `number` | `1` |
| `pollIntervalMs` | `number` | `2000` |

Returns `{ waiting, done }`. Auto-starts polling when `linkId` becomes truthy. Resets when `linkId` changes.

### useCreateOnboardingTestLink (Hook)

Wraps `POST /api/onboarding/test-link` to create ephemeral test links.

Returns `{ url, setUrl, creating, error, created, create, reset }`.

### useSavedThankYouLink (Hook)

Persists thank-you link configuration for Brevo and Podia wizards via `GET/POST/DELETE /api/onboarding/{provider}/thank-you-link`.

Returns `{ loading, saved, setSaved, persist, clear }`.

**Edge case:** Reverts optimistic state if the API call fails.

---

## Stripe

**Provider ID:** `stripe`
**Guide URL:** (passed as `setupGuideHref` prop)
**Steps:** 5 (4 linear + 1 optional)

### Step 1: Connect Stripe

- **Component:** `ManualConfirmStep` (custom actions)
- **Title:** "Connect your Stripe account"
- **Description:** "Click the button to enable the Stripe integration for this workspace."
- **Buttons:** "Connect Stripe" (live mode) and "Connect Stripe (Test)" (test mode)
- **Flow:** Calls `GET /api/onboarding/integration-install-url?integrationSlug=stripe` to get the OAuth install URL. Redirects the browser to Stripe OAuth. Falls back to `/{slug}/settings/integrations/stripe`.
- **Auto-advance:** When `stripeInstalled` becomes true, auto-advances to step 2.

### Step 2: Approve permissions

- **Component:** `ManualConfirmStep`
- **Title:** "Approve permissions"
- **Description:** "Open the PiMMS app in your Stripe Dashboard and accept permissions."
- **Buttons:** "Open Stripe Dashboard" (live) and "Open Stripe Dashboard (Test)"
- **Links:**
  - Live: `https://dashboard.stripe.com/settings/apps/pimms.io`
  - Test: `https://dashboard.stripe.com/test/settings/apps/pimms.io`
- **Confirm label:** "I've done this"

### Step 3: Create a test link

- **Component:** `CreateTestLinkStep`
- **Title:** "Create a test link (expires in 24h)"
- **Description (before):** "Paste a Stripe Payment Link URL."
- **Description (after):** "Test link ready. Open in an incognito tab and make a purchase."
- **URL placeholder:** `https://buy.stripe.com/...`
- **Info:** "This payment link is only for testing. You can delete it afterwards if needed."

### Step 4: Verify tracking works

- **Component:** `WaitForLeadStep`
- **Title:** "Make a test purchase"
- **Description:** "Complete a test purchase using the link above."
- **Metric:** `sales` (min: 1)
- **Labels:** waiting = "Waiting for sale…", success = "Sale recorded. Tracking works."
- **Warnings:**
  - **Use a new email for each test.** (bold)
  - "The purchase must be at least 1 EUR / 1 USD."

### Step 5: Setup on a website (optional)

- **Component:** `StepCard` (custom)
- **Title:** "Setup on a website (optional)"
- **Description:** "Use these guides if you're embedding Stripe on your site or using Stripe Checkout."
- **Always accessible** (not gated by completion of previous steps)
- **Content:** Two guide cards linking to setup and checkout guides.

**Completion:** `completedProviderIds` is updated when a sale is detected.

---

## Brevo

**Provider ID:** `brevoForm`
**Guide URL:** `https://pimms.io/guides/how-to-track-brevo-forms-and-meetings-webhook-integration`
**Steps:** 4

### Step 1: Brevo webhook

- **Component:** `StepCard` (custom, using `CopyField`)
- **Title:** "Brevo webhook"
- **Description:** "Create two webhooks in Brevo: one for Forms and one for Meetings."
- **Fields:**
  - **Webhook URL (Forms):** `https://api.pimms.io/webhook/brevo?workspace_id={workspaceId}&type=form`
  - **Webhook URL (Meetings):** `https://api.pimms.io/webhook/brevo?workspace_id={workspaceId}&type=meeting`
  - **Authentication token (Bearer):** `{workspaceId}`
- **Instructions:** Enable only: Forms → "Form submitted", Meetings → "Meeting booked".

### Step 2: Thank-you link

- **Component:** `StepCard` (custom)
- **Title:** "Create a thank-you redirect link"
- **Description:** "Generate a redirect link, then paste it into Brevo's Thank you URL field."
- **Flow:**
  1. Select tracking domain (dropdown from available workspace domains)
  2. Enter destination URL (the real thank-you page)
  3. Click "Generate thank you redirect link"
- **Creates a link via:** `POST /api/links` with `trackConversion: true`, key pattern `{nanoid(8)}/thankyou`
- **Saved via:** `useSavedThankYouLink` (providerKey: "brevo")
- **After creation:** Shows the short link in a CopyField labeled "Thank-you redirect link (paste into Brevo)".

### Step 3: Test link

- **Component:** `CreateTestLinkStep`
- **Title:** "Create a test link (expires in 24h)"
- **Description (before):** "Paste your Brevo form or meeting URL."
- **Description (after):** "Test link ready. Open in an incognito tab and submit a form or book a meeting."
- **URL placeholder:** `https://...`

### Step 4: Verify

- **Component:** `WaitForLeadStep`
- **Title:** "Verify tracking works"
- **Description:** "Submit a form or book a meeting using the test link."
- **Metric:** `leads` (default)
- **Labels:** waiting = "Waiting for lead…", success = "Contact recorded. Tracking works."
- **Warnings:**
  - **Use a new email for each test.** (bold)

---

## Podia

**Provider ID:** `podia`
**Guide URL:** `https://pimms.io/guides/how-to-track-podia-stripe-payments`
**Steps:** 7

### Step 1: Connect Stripe

- **Component:** `StepCard` (custom)
- **Title:** "Connect Stripe"
- **Description:** "Podia uses Stripe for payments. Connect Stripe to track purchases."
- **Button:** "Open Stripe setup" (adds `stripe` to providerIds and calls `onContinueToStripe()`)
- **Auto-advance:** When `stripeReady` becomes true, auto-advances past step 1.
- **Detection:** Checks if `stripe` is in `providerIds` OR if the Stripe integration is installed.

### Step 2: Pick a tracking domain

- **Component:** `StepCard` (custom)
- **Title:** "Pick a tracking domain"
- **Description:** "Select the domain for the short link used by the Podia detection script."
- **Domain dropdown:** Lists workspace available domains. Default is primary domain.
- **Creates thank-you link via:** `POST /api/links` with `url: "https://www.podia.com/"`, `trackConversion: true`, key pattern `{nanoid(8)}/thankyou`, title "Auto-generated Podia tracking (thank-you)".
- **Saved via:** `useSavedThankYouLink` (providerKey: "podia")
- **Edge case:** Changing domain resets the thank-you link, script state, and test link.

### Step 3: Install detection script

- **Component:** `InstallScriptStep`
- **Title:** "Add the Pimms detection script"
- **Description:** "Copy this script into your Podia site: Settings → Website → Website tracking code."
- **Script generated dynamically:**
  ```html
  <script defer src="https://cdn.pimms.io/analytics/script.detection.js" data-domains='{"thank-you":"{thankYouLink.shortLink}"}'></script>
  ```
- **Info:** "Tracking uses this short link: {thankYouLink.shortLink}"

### Step 4: Verify script installation

- **Component:** `ScriptInstallVerifyStep`
- **Title:** "Verify script installation"
- **Description:** "Paste your Podia site URL to check the script is installed."
- **Required:** `{ detection: true, thankYou: true }`
- **Placeholder:** `https://your-site.podia.com`
- **Auto-verify:** yes
- **Verification rows:** "Detection script" (blocking) + "Thank-you tracking" (blocking)

### Step 5: Require account setup

- **Component:** `StepCard` (custom with `BlurImage`)
- **Title:** "Enable 'Require account setup before checkout'"
- **Description:** "In your Podia product settings, enable this option so the buyer's email is captured before payment."
- **Image:** `/static/guides/podia-option-require-account-before-checkout.webp`
- **Confirm:** "I've done this"

### Step 6: Create test link

- **Component:** `CreateTestLinkStep`
- **Title:** "Create a test link (expires in 24h)"
- **Description (before):** "Paste your Podia product or sales page URL."
- **Description (after):** "Test link ready. Open in an incognito tab and complete a purchase."
- **URL placeholder:** `https://your-site.podia.com/...`

### Step 7: Verify tracking

- **Component:** `WaitForLeadStep`
- **Title:** "Verify tracking works"
- **Description:** "Complete a test purchase using the link above. We detect the sale automatically."
- **Metric:** `sales` (min: 1)
- **Labels:** waiting = "Waiting for sale…", success = "Sale recorded. Tracking works."
- **Warnings:**
  - **Use a new email for each test.** (bold)
  - "The purchase must be at least 1 EUR / 1 USD."

---

## Calendly

**Provider ID:** `calendly`
**Guide URL:** `https://pimms.io/guides/how-to-track-calendly-bookings-marketing-attribution`
**Steps:** 3

### Step 1: Connect Calendly

- **Component:** `ManualConfirmStep` (custom actions)
- **Title:** "Connect your Calendly account"
- **Description:** "Click the button to enable the integration in your workspace."
- **Info box:** "This integration requires at least a Calendly paid plan (Standard)."
- **Button:** "Connect Calendly" (fetches install URL via `GET /api/onboarding/integration-install-url?integrationSlug=calendly`)
- **Auto-advance:** When `calendlyInstalled` becomes true, auto-advances to step 2.

### Step 2: Create a test link

- **Component:** `CreateTestLinkStep`
- **Title:** "Create a test link (expires in 24h)"
- **Description (before):** "Paste your Calendly booking URL."
- **Description (after):** "Test link ready. Open in an incognito tab and book a meeting."
- **URL placeholder:** `https://calendly.com/your-name/30min`

### Step 3: Verify tracking works

- **Component:** `WaitForLeadStep`
- **Title:** "Verify tracking works"
- **Description:** "Book a meeting using the test link above."
- **Metric:** `leads` (default)
- **Warnings:**
  - **Use a new email for each test.** (bold)

---

## Cal.com

**Provider ID:** `calDotCom`
**Guide URL:** `https://pimms.io/guides/calcom-direct-webhook-integration`
**Steps:** 6

### Step 1: Install the script

- **Component:** `InstallScriptStep`
- **Title:** "Add the Pimms script"
- **Description:** "Install the detection script on the page where your Cal.com booking is embedded. It auto-injects pimms_id into Cal.com embeds and links."
- **Script:**
  ```html
  <script defer src="https://cdn.pimms.io/analytics/script.detection.js" data-domains='{"outbound":"cal.com"}'></script>
  ```
- **Merge note:** "Already have the Pimms detection script from another integration? Update the existing `data-domains` attribute to include `cal.com` in the outbound list (e.g. `"outbound":"cal.com,tally.so"`) instead of adding a duplicate script tag."

### Step 2: Verify installation

- **Component:** `ScriptInstallVerifyStep`
- **Title:** "Verify the script is detected"
- **Description:** "Paste the URL of the page where your Cal.com booking is embedded."
- **Required:** `{ detection: true, outbound: "cal.com" }`
- **Placeholder:** `your-site.com/page-with-calcom-booking`
- **Auto-verify:** yes
- **Verification rows:** "Detection script" (blocking) + "Outbound domain (cal.com)" (blocking)

### Step 3: Edit your Cal.com forms

- **Component:** `ManualConfirmStep`
- **Title:** "Add the pimms_id field"
- **Description:** "Follow the guide step and add the field to your Cal.com booking questions."
- **Guide link:** `{GUIDE_URL}#1-add-the-pimms_id-field-to-your-calcom-form`

### Step 4: Set up the webhook in Cal.com

- **Component:** `WebhookConfigStep`
- **Title:** "Webhook configuration"
- **Description:** "Paste these values into Cal.com → Settings → Developer → Webhooks."
- **Fields:**
  - **Subscriber URL:** `https://api.pimms.io/webhook/calcom?workspace_id={workspaceId}`
  - **Secret:** `{workspaceId}`

### Step 5: Create a test link

- **Component:** `CreateTestLinkStep`
- **Description (before):** "Paste the URL of your Cal.com booking page."
- **URL placeholder:** `https://cal.com/your-name/your-event`

### Step 6: Verify tracking works

- **Component:** `WaitForLeadStep`
- **Title:** "Verify tracking works"
- **Description:** "Complete a test booking using the link above."
- **Warnings:**
  - **Use a new email for each test.** (bold)

---

## Framer

**Provider ID:** `framer`
**Guide URL:** `https://pimms.io/guides/how-to-track-framer-form-submissions-marketing-attribution`
**Steps:** 6

### Step 1: Install the script

- **Component:** `InstallScriptStep`
- **Title:** "Add the Pimms script"
- **Description:** "In Framer, add the tracking script in Site settings → Custom Code (Head), and add the form script on pages that contain a form."
- **Scripts:**
  - **Tracking script (Head):**
    ```html
    <script defer src="https://cdn.pimms.io/analytics/script.detection.js"></script>
    ```
  - **Form script (pages with a form):**
    ```html
    <script defer src="https://cdn.pimms.io/analytics/script.inject-form.js"></script>
    ```

### Step 2: Verify installation

- **Component:** `ScriptInstallVerifyStep`
- **Required:** `{ detection: true, injectForm: "info" }`
- **Verification rows:** "Detection script" (blocking) + "Form injection script (recommended)" (non-blocking, amber warning)

### Step 3: Build a compatible form

- **Component:** `ManualConfirmStep`
- **Title:** "Make your form Pimms-compatible"
- **Guide link:** `{GUIDE_URL}#2-build-a-pimms-compatible-form`

### Step 4: Configure webhook

- **Component:** `WebhookConfigStep`
- **Title:** "Add the Framer webhook"
- **Description:** "In Framer forms settings, paste this webhook URL."
- **Fields:**
  - **Webhook URL:** `https://api.pimms.io/framer/webhook?workspace_id={workspaceId}`

### Step 5: Create a test link

- **Component:** `CreateTestLinkStep`
- **URL placeholder:** `https://your-site.com/form`

### Step 6: Verify tracking works

- **Component:** `WaitForLeadStep`
- **Warnings:**
  - **Use a new email for each test.** (bold)

---

## Webflow

**Provider ID:** `webflow`
**Guide URL:** `https://pimms.io/guides/how-to-track-webflow-form-submissions-marketing-attribution`
**Steps:** 6

### Step 1: Install scripts

- **Component:** `InstallScriptStep`
- **Title:** "Add the Pimms scripts"
- **Description:** "Webflow forms require the detection script and the form injection script."
- **Scripts:**
  - **Detection script:**
    ```html
    <script defer src="https://cdn.pimms.io/analytics/script.detection.js"></script>
    ```
  - **Inject form script:**
    ```html
    <script defer src="https://cdn.pimms.io/analytics/script.inject-form.js"></script>
    ```

### Step 2: Verify installation

- **Component:** `ScriptInstallVerifyStep`
- **Required:** `{ detection: true, injectForm: "info" }`
- **Verification rows:** "Detection script" (blocking) + "Form injection script (recommended)" (non-blocking)

### Step 3: Build a compatible form

- **Component:** `ManualConfirmStep`
- **Guide link:** `{GUIDE_URL}#2-build-a-pimms-compatible-form`

### Step 4: Configure webhook

- **Component:** `WebhookConfigStep`
- **Description:** "In Webflow → Site settings → Apps & Integrations → Add Webhook, paste this URL."
- **Fields:**
  - **Webhook URL:** `https://api.pimms.io/webflow/webhook?workspace_id={workspaceId}`

### Step 5: Create a test link

- **Component:** `CreateTestLinkStep`
- **URL placeholder:** `https://your-site.webflow.io/lead-form`

### Step 6: Verify tracking works

- **Component:** `WaitForLeadStep`
- **Warnings:**
  - **Use a new email for each test.** (bold)

---

## WordPress / Elementor

**Provider ID:** `wordpressElementor`
**Guide URL:** `https://pimms.io/guides/how-to-track-elementor-form-leads-conversion-tracking`
**Steps:** 6

### Step 1: Install scripts

- **Component:** `InstallScriptStep`
- **Title:** "Add the Pimms scripts"
- **Description:** "Elementor forms require the detection script and the form injection script. The inject-form script auto-adds a hidden pimms_id field to all forms."
- **Scripts:** Same as Webflow/Framer (detection + inject-form).

### Step 2: Verify installation

- **Component:** `ScriptInstallVerifyStep`
- **Required:** `{ detection: true, injectForm: "info" }`
- **Placeholder:** `your-site.com/page-with-form`

### Step 3: Build a compatible form

- **Component:** `ManualConfirmStep`
- **Title:** "Make your form Pimms-compatible"
- **Description:** "Follow the guide step and add the required fields (including pimms_id)."
- **Guide link:** `{GUIDE_URL}#2-build-a-pimms-compatible-form`

### Step 4: Configure webhook

- **Component:** `WebhookConfigStep`
- **Description:** "In Elementor > Actions After Submit > Webhook, paste this URL."
- **Fields:**
  - **Webhook URL:** `https://api.pimms.io/elementor/webhook?workspace_id={workspaceId}`

### Step 5: Create a test link

- **Component:** `CreateTestLinkStep`
- **URL placeholder:** `https://your-site.com/lead-form`

### Step 6: Verify tracking works

- **Component:** `WaitForLeadStep`
- **Warnings:**
  - **Use a new email for each test.** (bold)

---

## Tally

**Provider ID:** `tally`
**Guide URL:** `https://pimms.io/guides/tally-direct-webhook-integration`
**Steps:** 6

### Step 1: Install the script

- **Component:** `InstallScriptStep`
- **Title:** "Add the Pimms script"
- **Description:** "Install the detection script on the page where your Tally form is embedded. It auto-injects pimms_id into Tally embeds and outbound links."
- **Script:**
  ```html
  <script defer src="https://cdn.pimms.io/analytics/script.detection.js" data-domains='{"outbound":"tally.so"}'></script>
  ```
- **Merge note:** "Already have the Pimms detection script from another integration? Update the existing `data-domains` attribute to include `tally.so` in the outbound list (e.g. `"outbound":"tally.so,cal.com"`) instead of adding a duplicate script tag."

### Step 2: Verify installation

- **Component:** `ScriptInstallVerifyStep`
- **Required:** `{ detection: true, outbound: "tally.so" }`
- **Verification rows:** "Detection script" (blocking) + "Outbound domain (tally.so)" (blocking)

### Step 3: Setup in Tally

- **Component:** `ManualConfirmStep`
- **Title:** "Add the pimms_id field"
- **Description:** "Follow the guide step and add the hidden field to your Tally form."

### Step 4: Set up the webhook in Tally

- **Component:** `WebhookConfigStep`
- **Description:** "Paste these values into Tally.so → Integrations → Webhooks."
- **Fields:**
  - **Webhook URL:** `https://api.pimms.io/webhook/tally?workspace_id={workspaceId}`
  - **Signing Secret:** `{workspaceId}`

### Step 5: Create a test link

- **Component:** `CreateTestLinkStep`
- **URL placeholder:** `https://your-site.com/page-with-tally-form`

### Step 6: Verify tracking works

- **Component:** `WaitForLeadStep`
- **Labels:** waiting = "Waiting for lead…", success = "Contact recorded. Tracking works."
- **Warnings:**
  - **Use a new email for each test.** (bold)

---

## Systeme.io

**Provider ID:** `systemeio`
**Guide URL:** `https://pimms.io/guides/how-to-track-systemeio-sales-and-leads-marketing-attribution`
**Steps:** 5

### Step 1: Install the tracking script

- **Component:** `InstallScriptStep`
- **Title:** "Install the Pimms tracking script"
- **Description:** "Paste this script into Systeme.io → Settings → Sales funnels → Tracking code, then continue."
- **Script:**
  ```html
  <script defer src="https://cdn.pimms.io/analytics/script.detection.js" data-forward-all="true"></script>
  ```
- **Guide link:** `{GUIDE_URL}#1-install-the-tracking-script`

### Step 2: Verify installation

- **Component:** `ScriptInstallVerifyStep`
- **Required:** `{ detection: true, forwardAll: true }`
- **Placeholder:** `youraccount.systeme.io/your-funnel`
- **Verification rows:** "Detection script" (blocking) + "Forward all links" (blocking)

### Step 3: Configure the webhook

- **Component:** `WebhookConfigStep`
- **Description:** "Paste these values in Systeme.io → Settings → Webhooks. Select events: Opt-in + New sale."
- **Fields:**
  - **Webhook URL:** `https://app.pimms.io/api/systemeio/webhook?workspace_id={workspaceId}`
  - **Secret:** `{workspaceId}`

### Step 4: Create a test link

- **Component:** `CreateTestLinkStep`
- **Description (before):** "Paste your Systeme.io funnel page URL."
- **URL placeholder:** `https://youraccount.systeme.io/your-funnel`

### Step 5: Verify tracking works

- **Component:** `WaitForLeadStep`
- **Title:** "Verify tracking works"
- **Description:** "Complete an opt-in using the test link above. Optionally test a purchase too."
- **Labels:** waiting = "Waiting for lead…", success = "Contact recorded. Tracking works."
- **Warnings:**
  - **Use a new email for each test.** (bold)

---

## Script-Check API

**Endpoint:** `GET /api/onboarding/script-check`
**Auth:** `withWorkspace` (requires `workspaceId` query param)

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `url` | `string` (required) | URL to scan |
| `workspaceId` | `string` (required) | Workspace ID for auth |
| `requireInjectForm` | `boolean` | Require inject-form script |
| `requireExpose` | `boolean` | Require expose script |
| `requireOutbound` | `string` | Require specific outbound domain |
| `requireThankYou` | `boolean` | Require `thank-you` in `data-domains` |
| `requireForwardAll` | `boolean` | Require `data-forward-all="true"` |

### Response

```json
{
  "detected": true,
  "error": null,
  "details": {
    "scriptFound": true,
    "injectFormFound": false,
    "exposeFound": false,
    "outboundDomains": ["tally.so"],
    "thankYouFound": true,
    "forwardAllFound": false
  }
}
```

### Detection Logic

1. **Static HTML scan:** Fetches the URL and scans raw HTML for `<script>` tags containing PiMMs CDN URLs.
2. **JS render fallback:** If requirements aren't met, uses Webscraping.ai to render JS and re-scan.
3. **Merge logic:** Results from both scans are merged with `||` -- any `true` from either scan is preserved.

### What is scanned

| Check | How detected |
|-------|-------------|
| Detection script | `src` contains `cdn.pimms.io/analytics/script.detection.js` |
| Inject-form script | `src` contains `cdn.pimms.io/analytics/script.inject-form.js` |
| Expose script | `src` contains `cdn.pimms.io/analytics/script.expose.js` |
| Outbound domains | Parsed from `data-domains` JSON attribute, key `"outbound"` |
| Thank-you tracking | Parsed from `data-domains` JSON attribute, key `"thank-you"` (non-empty) |
| Forward all links | `data-forward-all="true"` attribute on detection script tag |
| Meta tag SDK | `<meta name="pimms-sdk" content="true">` (either attribute order) |
| Inline bundle | Script body contains `@getpimms/analytics` |

### Security

- **SSRF protection:** Blocks private IPs (`127.x`, `10.x`, `172.16-31.x`, `192.168.x`, `169.254.x`), `localhost`, `metadata.google.internal`, IPv6 loopback/private, and non-HTTP(S) schemes.
- **Auth:** Requires authenticated workspace (`withWorkspace`).

### HTML Parsing Edge Cases Handled

- `data-domains` with single-quoted JSON containing double quotes (e.g., `data-domains='{"outbound":"tally.so"}'`)
- HTML-encoded entities in attribute values (e.g., `&quot;` decoded before JSON parsing)
- Multiline script tags (using `[\s\S]*?` instead of `.*?`)
- Meta tags with either `name`-first or `content`-first attribute order

---

## Summary: Verification Requirements per Wizard

| Wizard | Script Verify `required` | Metric | Warnings |
|--------|--------------------------|--------|----------|
| Stripe | N/A | sales | email + min purchase |
| Brevo | N/A | leads | email |
| Podia | `detection + thankYou` | sales | email + min purchase |
| Calendly | N/A | leads | email |
| Cal.com | `detection + outbound:cal.com` | leads | email |
| Framer | `detection + injectForm:info` | leads | email |
| Webflow | `detection + injectForm:info` | leads | email |
| Elementor | `detection + injectForm:info` | leads | email |
| Tally | `detection + outbound:tally.so` | leads | email |
| Systeme.io | `detection + forwardAll` | leads | email |

## Summary: Webhook URLs per Wizard

| Wizard | Webhook URL Pattern |
|--------|-------------------|
| Brevo (Forms) | `https://api.pimms.io/webhook/brevo?workspace_id={id}&type=form` |
| Brevo (Meetings) | `https://api.pimms.io/webhook/brevo?workspace_id={id}&type=meeting` |
| Framer | `https://api.pimms.io/framer/webhook?workspace_id={id}` |
| Webflow | `https://api.pimms.io/webflow/webhook?workspace_id={id}` |
| Elementor | `https://api.pimms.io/elementor/webhook?workspace_id={id}` |
| Tally | `https://api.pimms.io/webhook/tally?workspace_id={id}` |
| Cal.com | `https://api.pimms.io/webhook/calcom?workspace_id={id}` |
| Systeme.io | `https://app.pimms.io/api/systemeio/webhook?workspace_id={id}` |

## Summary: Scripts per Wizard

| Wizard | Detection Script | Additional Scripts / Props |
|--------|-----------------|--------------------------|
| Framer | plain | `script.inject-form.js` |
| Webflow | plain | `script.inject-form.js` |
| Elementor | plain | `script.inject-form.js` |
| Cal.com | `data-domains='{"outbound":"cal.com"}'` | -- |
| Tally | `data-domains='{"outbound":"tally.so"}'` | -- |
| Podia | `data-domains='{"thank-you":"{shortLink}"}'` | -- (dynamically generated) |
| Systeme.io | `data-forward-all="true"` | -- |
| Stripe | N/A (no script) | -- |
| Brevo | N/A (no script) | -- |
| Calendly | N/A (no script) | -- |

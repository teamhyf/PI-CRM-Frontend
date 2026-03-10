## AI Chat Intake Feature – Landing Page Plan

### Goal

Add a **ChatGPT-style AI Assistant on the Landing page** that can intake a case via **text + voice**, **extract & map** details into the existing intake fields, **ask follow-up questions** for missing info, then show the **same preview summary** and **submit into the existing case list**.

### Constraints

- **Do not change existing intake flow/pages** (`/intake` 7-step) or admin portal behavior.
- Implement **only on Landing page first**; later we’ll replicate inside admin.
- Current app is **frontend-only** (localStorage). “AI” will initially be **rule-based** with an option to plug in an LLM/backend later without changing the UI.

---

### 1. UX / Screens

- **Landing page CTA**
  - Add a new button: **“Chat with AI Assistant”** (next to the existing “Start with AI Assistant”).

- **Chat Intake Modal**
  - Layout:
    - Center: **chat thread** (assistant + user bubbles).
    - Bottom: **text input** + **Send** button.
    - **Voice input button** to record a message and convert it to text.
    - Right side (or collapsible panel): **“Case Draft”** live preview (structured fields + completeness).
  - Controls:
    - Header: title (“AI Assistant – Case Intake”) + **Close**.
    - Optional **“Reset / Start over”** to clear the draft and chat.

- **End state**
  - Once required fields are collected, show **Case Preview**:
    - Same style as existing Review step: AI evaluation + AI summary + core details.
    - Button: **“Submit Case”** that creates a new case in the existing list.
  - After submit: close modal and show the existing **thank-you message** on the Landing page.

---

### 2. Data Model Alignment

Use a `caseDraft` object matching the current `IntakeContext` `formData` shape:

- `contact`: `fullName`, `phone`, `email`
- `accident`: `dateOfLoss`, `accidentType`, `collisionType?`, `atFaultIdentified?`, `policeReport?`, `accidentTypeDescription?`
- `insurance`: `clientAutoInsurance`, `otherPartyInsurance`
- `injury`: `injured`, plus optional `treatmentLocation`, `treatmentDates`, `knownInjuries`, `stillTreating`
- `propertyDamage`: `hasDamage`, optional `severity`
- `additionalNotes`: string

The chat module **does not modify** the existing stepper state during the conversation. It only passes `caseDraft` into a submit helper at the end.

---

### 3. Conversation Engine (State Machine)

Implement a small engine that operates on three key pieces of state:

- `messages`: ordered chat history.
- `caseDraft`: the current best guess of structured fields.
- `missingFields`: computed list of required/conditional fields not yet filled.

Loop for each user message:

1. **Ingest message**
   - Append user message (text or voice transcript) to `messages`.

2. **Extract field candidates**
   - Run heuristic parsers over the message to detect:
     - Names, phone numbers, emails.
     - Accident type keywords.
     - Dates and date phrases.
     - Yes/No/Unsure style answers for insurance, injury, property damage.

3. **Merge into `caseDraft`**
   - For each detected field, update the draft with `value`, optionally tracking `confidence` and `sourceMessageId`.

4. **Recompute completeness**
   - Run validation to determine which fields are still missing.

5. **Ask next question**
   - If anything critical is missing, the assistant sends **one focused follow-up question** (e.g., “What is your phone number?”).
   - If all required fields are present, transition to **preview state**.

6. **Preview and submit**
   - Show review panel using the existing AI evaluation + summary utilities.
   - On “Submit Case”, create a new case via the same logic as the existing intake and show the Landing thank-you message.

---

### 4. Validation Rules

**Required (minimal to submit)**:

- `contact.fullName`
- `contact.phone`
- `contact.email`
- `accident.dateOfLoss`
- `accident.accidentType`
- `insurance.clientAutoInsurance`
- `insurance.otherPartyInsurance`
- `injury.injured`
- `propertyDamage.hasDamage`

**Conditional**:

- If `accident.accidentType === "Other"` → `accident.accidentTypeDescription` required.
- If `injury.injured === "Yes"`:
  - Encourage but do not strictly require: `treatmentLocation`, `treatmentDates`, `knownInjuries`, `stillTreating`.
- If `propertyDamage.hasDamage === "Yes"`:
  - Encourage but do not strictly require: `severity`.

The engine chooses the **next question** based on the highest-priority missing field.

---

### 5. Extraction & Mapping Strategy

**MVP (frontend-only, deterministic):**

- Implement `extractCaseFields(messageText)`:
  - Phone: regex for common phone formats.
  - Email: regex for email.
  - Date: parse various formats (`MM/DD/YYYY`, `YYYY-MM-DD`, “Jan 5 2026”, “June 3rd”).
  - Accident type: keyword matching to normalized options:
    - “car crash”, “auto accident” → “Motor vehicle accident”
    - “slipped”, “slip and fall” → “Slip and fall”
    - etc.
  - Yes/No/Unsure classification for binary fields.
- Return a set of field updates and confidence levels.

**Later (optional LLM adapter):**

- Define an interface that can instead call a backend (LLM) which returns the same output shape:

```ts
type ExtractResult = {
  patches: { path: string; value: unknown; confidence: number }[];
  followUpsSuggested?: string[];
};
```

So the UI and engine don’t change when an LLM is introduced.

---

### 6. Voice Input

**Initial implementation:**

- Use the **Web Speech API** (`SpeechRecognition`) where available:
  - Press/hold or toggle **microphone button** to start recording.
  - On recognition result, set transcript into the text input and treat it as a normal user message.
- If not supported:
  - Hide the mic button or show a tooltip: “Voice input not supported in this browser”.

**Future extension:**

- Use `MediaRecorder` to capture audio and send to a backend transcription service.

---

### 7. Preview & Submit Logic

- When validation reports “ready for preview”:
  - Use existing utilities:
    - `evaluateCase(caseDraft)`
    - `generateCaseSummary(caseDraft)`
  - Show a review panel inside the chat modal with:
    - AI viability badge.
    - AI-generated summary.
    - Key structured fields.
  - Buttons:
    - **Back to chat** (if user wants to refine).
    - **Submit Case**:
      - Calls a new helper in `IntakeContext`, e.g. `submitDraftCase(draft)` that:
        - Creates a new case with ID, timestamps, status.
        - Saves to `cases` and localStorage.
      - Closes the modal and triggers the Landing success message:
        - “Thank you for submitting your case. We will get back to you soon.”

---

### 8. Files / Components to Add

- `src/components/ChatIntakeModal.jsx`
  - Modal wrapper with:
    - Chat thread.
    - Input + send.
    - Voice button.
    - Case Draft panel.

- `src/components/VoiceInputButton.jsx`
  - Encapsulates SpeechRecognition and exposes callbacks:
    - `onTranscript(text)`
    - `onError(error)`

- `src/utils/chatIntakeEngine.js`
  - Pure functions to:
    - Update `caseDraft` from a new message.
    - Compute missing fields and next question.
    - Determine when to enter preview state.

- `src/utils/extractCaseFields.js`
  - Deterministic parsing of phone/email/date/yes-no and mapping to the draft.

- `src/utils/caseDraftValidation.js`
  - Implements the required + conditional rules and returns a prioritized list of missing fields.

- `src/context/IntakeContext.jsx`
  - Add `submitDraftCase(draft)` (or equivalent) that mirrors `submitCase` but takes a ready draft and does not rely on the stepper form state.

- `src/pages/Landing.jsx`
  - Add “Chat with AI Assistant” CTA.
  - Manage open/close and success state for `ChatIntakeModal`.

---

### 9. Milestones

**M1 – Text Chat Only**

- Chat UI in modal.
- Deterministic extraction + follow-up questions.
- Draft preview + submit, saving into existing `cases`.

**M2 – Voice Input**

- Add mic button and speech recognition integration.
- Validate UX on supported browsers.

**M3 – Refinements**

- Better extraction heuristics and more robust date parsing.
- Quick “edit field” controls in the Case Draft panel.

**M4 – Optional Backend/LLM**

- Add a pluggable adapter to call a backend LLM for extraction while keeping the same UI and engine interfaces.


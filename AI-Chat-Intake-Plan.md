## AI Chat Intake – Personal Injury Flow Plan

This document defines the **conversation flow** and **LLM usage** for the personal injury intake chatbot. The goal is to collect structured data, gently clarify missing/unclear information, and only use the LLM at the end to predict **case viability**.

---

## High-Level Principles

- **Structured first, free text second**: Use fixed-choice options wherever possible, with free text only when needed (e.g., "Other", descriptions, additional notes).
- **Dynamic steps**: Certain questions change based on the selected **accident type**.
- **Gentle validation**: The bot nudges the user if key data is missing or obviously invalid (e.g., blank phone, impossible date), but does not block on strict formatting.
- **Single LLM call**: The LLM is only used to **score case viability** (and optionally provide short reasoning) just before final submission, based on all collected answers.

---

## Step 1: Contact Information (Common)

**Goal:** Capture basic contact details early.

- **Fields (required but allow “skip for now” with gentle prompts):**
  - `fullName` – Free text.
  - `phone` – Free text, but validate length / basic phone pattern and re-ask gently if clearly invalid.
  - `email` – Free text, validate simple email pattern and re-ask gently if clearly invalid.

**Flow:**
- Ask one question at a time:
  1. "First, may I have your **full name**?"
  2. "What is the best **phone number** to reach you?"
  3. "What is your **email address**, if you have one?"
- If a user refuses or is unsure, accept partial info and continue but mark missing fields as `null` / `unknown`.

---

## Step 2: Accident Type (Common, Required)

**Goal:** Restrict user to predefined personal injury categories to simplify branching logic.

- **Question:** "What type of accident were you involved in?"
- **Options (buttons / chips, no manual typing):**
  - `MOTOR_VEHICLE` – "Motor Vehicle Accident (car, truck, rideshare, etc.)"
  - `PEDESTRIAN` – "Pedestrian hit by a vehicle"
  - `BICYCLE` – "Bicycle accident"
  - `MOTORCYCLE` – "Motorcycle accident"
  - `SLIP_AND_FALL` – "Slip and fall / trip and fall"
  - `OTHER` – "Other personal injury"

- **If `OTHER` selected:**
  - Ask: "Please briefly describe the type of incident."
  - `otherAccidentDescription` – Free text, required if `OTHER`.

Bot should **not** accept arbitrary text instead of the options for this step. If user types something, respond with something like: "I’ll help you choose the closest option. Please tap one of the buttons that best matches your situation."

---

## Step 3: Date of Accident (Common)

**Goal:** Capture when the incident occurred, with flexible input.

- **Question:** "When did the accident happen?"
- **Field:** `accidentDateRaw` – Free text, accept **any** date format:
  - Examples: `2026-01-05`, `05-01-2026`, `Jan 5th 2026`, `about 3 weeks ago`, etc.
- Backend or LLM (in a non-user-facing way) can later normalize to a date if needed, but the bot should:
  - Check for **completely empty** input and gently re-prompt.
  - Optionally ask a clarifying follow-up if the text is clearly not a date/time description (e.g., “soon”, “maybe”).

---

## Step 4: Accident-Specific Liability / Context Questions (Dynamic)

**Goal:** Ask tailored questions depending on `accidentType` from Step 2. All should use **predefined options** (buttons) except where noted.

### 4A. Motor Vehicle–Related (MOTOR_VEHICLE, MOTORCYCLE, possibly BICYCLE if struck by a car)

**Shared fields for any motor-vehicle collision:**

- **Type of collision** (`collisionType`) – Multiple-choice only:
  - Rear-end
  - T-bone / side impact
  - Head-on
  - Sideswipe (same direction)
  - Sideswipe (opposite direction)
  - Multi-vehicle / chain reaction
  - Single-vehicle (no other vehicle hit)
  - Hit while parked
  - Other (if selected → ask for free-text description)

- **At-fault party identified at the scene?** (`atFaultIdentified`)
  - Options: `Yes`, `No`

- **Was a police report taken?** (`policeReport`)
  - Options: `Yes`, `No`, `Unknown`

- **Was an ambulance called?** (`ambulanceCalled`)
  - Options: `Yes`, `No`, `Unknown`

- **Were there any passengers in your vehicle?** (`hadPassengers`)
  - Options: `Yes`, `No`
  - If `Yes`, optional follow-up for count or relationship in free text.

### 4B. Pedestrian Accidents (PEDESTRIAN)

- **How were you involved?** (`pedestrianInvolvement`)
  - Options: Hit by a car, Hit by a truck/bus, Hit by motorcycle/bicycle, Other (with description).
- **Did the driver stop and remain at the scene?** (`driverStayed`)
  - Options: `Yes`, `No`, `Unknown`
- **Was a police report taken?** (`policeReport`) – Same options.
- **Was the area monitored by cameras (traffic, store, building)?** (`possibleVideo`)
  - Options: `Yes`, `No`, `Unsure`

### 4C. Bicycle Accidents (BICYCLE)

- **What were you riding?** (`bicycleType`)
  - Options: Regular bicycle, E-bike, Scooter, Other.
- **What did you collide with?** (`bicycleCollisionWith`)
  - Options: Motor vehicle, Another bicycle/scooter, Pedestrian, Fixed object (e.g., pole, curb), Road defect (pothole / uneven surface), Other.
- **Did the other party stay at the scene?** (`otherPartyStayed`) – Yes / No / Unknown.
- **Was a police report taken?** (`policeReport`) – as above.

### 4D. Slip and Fall / Trip and Fall (SLIP_AND_FALL)

- **Where did the fall happen?** (`fallLocationType`)
  - Options: Store / supermarket, Restaurant / bar, Workplace, Apartment/condo building, Private home, Parking lot / sidewalk, Other (with description).
- **Type of hazard (what caused the fall)?** (`hazardType`)
  - Options: Wet/slippery floor, Ice/snow, Uneven ground, Loose rug/mat, Poor lighting, Object on ground (debris, product), Unknown, Other (with description).
- **Was the hazard marked with a warning sign?** (`warningSignPresent`)
  - Options: Yes, No, Unsure.
- **Did you report the incident to the property owner/manager?** (`incidentReported`)
  - Options: Yes, No.

### 4E. Other Personal Injury (OTHER)

- Focus on **open description** plus minimal structure.
- **Questions:**
  - "Where did this incident happen?" (`incidentLocationFreeText`) – free text.
  - "Who do you believe was responsible (if anyone)?" (`believedResponsibleParty`) – free text.
  - "Was any official report made (police, workplace, store incident report, etc.)?" (`officialReportType`)
    - Options: Police, Workplace report, Store / business report, No, Unsure, Other.

---

## Step 5: Insurance Information (Dynamic by Accident Type)

**Goal:** Only ask insurance questions when relevant; use options, not free text, for yes/no/unsure questions.

### 5A. Motor Vehicle–Related (MOTOR_VEHICLE, MOTORCYCLE, BICYCLE when vehicle is involved)

- **Do you have auto insurance?** (`hasAutoInsurance`)
  - Options: Yes, No, Unsure.
  - If `Yes` (optional follow-up):
    - "Is it your own policy or someone else's (e.g., family member)?" – free text or selection.
- **Do you know if the other party had insurance?** (`otherPartyInsuranceKnown`)
  - Options: Yes, No, Unsure.
  - If `Yes`, optional free-text: "Anything you can share about their insurance (company name, policy type)?".

### 5B. Pedestrian

- Focus on **other party / vehicle**:
  - "Do you know if the driver had insurance?" (`otherPartyInsuranceKnown`) – Yes / No / Unsure.
  - "Do you have any health insurance or coverage (private, through work, government)?" (`hasHealthInsurance`) – Yes / No / Unsure.

### 5C. Slip and Fall

- Usually **property** and **health** insurance relevant:
  - "Do you know if the property owner or business had insurance (if known)?" (`propertyInsuranceKnown`) – Yes / No / Unsure.
  - "Do you have health insurance or any other medical coverage?" (`hasHealthInsurance`) – Yes / No / Unsure.

### 5D. Other

- More generic:
  - "Do you have any insurance that might relate to this incident (auto, homeowners, renters, health, etc.)?" (`anyRelevantInsurance`) – Yes / No / Unsure.
  - If `Yes`, free-text follow-up: "Please briefly describe the type of insurance."

### Skipping Insurance

- If the selected accident type is clearly non-insurance-related (if you add such types later), **skip Step 5 entirely**.
- The flow controller should decide whether to show Step 5 questions based on `accidentType` and flags.

---

## Step 6: Injury & Medical Treatment (Common)

**Goal:** Understand whether the user was injured and their treatment status. This **can be common across all accident types**, with minor wording variations.

**Questions (common):**

- **Were you injured?** (`injured`)
  - Options: Yes, No.
  - If `No`, you may skip some treatment details but still allow them to describe symptoms later in notes.

- **Where did you receive treatment?** (`treatmentLocationType`)
  - Options: ER / Emergency room, Urgent care, Primary care doctor, Specialist, No treatment yet, Other (with description).

- **Date(s) of treatment** (`treatmentDatesRaw`)
  - Free text, allow **any** format and multiple dates:
  - e.g., "Jan 5 and Jan 10, 2026", "about 2 weeks after the accident", etc.

- **Known injuries** (`knownInjuriesDescription`)
  - Free text: "Please list any known injuries, diagnoses, or body parts affected."

- **Are you still treating?** (`stillTreating`)
  - Options: Yes, No.
  - If `Yes`, optional follow-up: "Who are you currently seeing for treatment?" – free text.

**Comment on reusability:** This section can safely be **shared for all accident types**, with small phrasing adjustments (e.g., "after the fall", "after the collision").

---

## Step 7: Property Damage (Dynamic)

**Goal:** Capture property and vehicle damage details, especially for vehicle-related incidents and slip-and-fall where personal property may be damaged (e.g., phone, glasses).

**Base Questions:**

- **Was there damage to your vehicle or property?** (`propertyDamage`)
  - Options: Yes, No.

- If `Yes`:
  - **Approximate severity** (`damageSeverity`)
    - Options: Minor, Moderate, Severe, Total loss, Unknown.
  - If `Total loss` selected:
    - Ask: "Please briefly describe the damage and the item(s) involved." (`totalLossDescription`) – free text.

**Dynamic by accident type:**

- **Motor Vehicle / Motorcycle / Bicycle:**
  - Emphasize **vehicle damage**.
  - Optional follow-up: "Is your vehicle drivable?" (`vehicleDrivable`) – Yes / No / Unsure.
  - Optional: "Have you already gotten a repair estimate?" (`repairEstimate`) – Yes / No.

- **Pedestrian / Slip and Fall / Other:**
  - Emphasize **personal items**:
  - "Were any personal items damaged (phone, glasses, clothing, etc.)?" (`personalItemsDamaged`) – Yes / No.
  - If `Yes`, free-text list: "Please list any items that were damaged."

---

## Step 8: Additional Notes (Common)

**Goal:** Allow the client to share anything they believe is important that wasn’t explicitly covered.

- **Question:** "Is there anything else you think is important for us to know about this incident or your injuries?"
- **Field:** `additionalNotes` – Free text, optional but encouraged.

Bot may gently encourage: "You can skip this if you like, but any extra details can help the attorney better evaluate your case."

---

## Handling Missing or Unclear Information

- For each **required** field (e.g., accident type, basic contact, accident date), if the user response is:
  - Empty, or
  - Obviously invalid (e.g., "asdf" for phone, no recognizable date words at all),
  - Then the bot should:
    - Respond with a friendly clarification, e.g.:
      - "I’m sorry, I didn’t quite catch that. Could you please enter a phone number, or tell me if you prefer not to share it right now?"
    - Offer a way to **skip** (e.g., "skip for now") to avoid trapping the user.
- For less critical details, accept best-effort answers and move forward.

---

## LLM Usage – Case Viability Only

**Key requirement:** The LLM should **not** drive the conversation step-by-step. Instead:

- The frontend and/or backend hold a **structured schema** of all fields above, and control the question sequence.
- After all steps are completed (or skipped where allowed), the system:
  1. Builds a **structured summary** object with all collected data.
  2. Optionally constructs a **natural-language summary** for the LLM (e.g., "User was in a rear-end motor vehicle accident on [date]…").
  3. Sends **one LLM request** asking it to:
     - Predict **case viability score**, e.g., 0–100 or a 1–5 scale.
     - Optionally provide a short explanation / key factors.

**Example LLM prompt intent (conceptual):**

- "Given this personal injury intake data (JSON + brief summary), estimate how viable this case is for a plaintiff personal injury law firm, from 0 to 100, and provide 2–3 bullet reasons. Consider liability clarity, injuries, treatment, time since incident, etc."

**Output used by UI:**

- `viabilityScore` (e.g., integer 0–100).
- `viabilityLabel` (e.g., "Low", "Medium", "High").
- `keyFactors` (short bullet points or sentences).

The **case preview screen** should:

- Show all collected answers in a clean, grouped layout (Contact, Accident Details, Insurance, Injuries, Property Damage, Notes).
- Display the **LLM viability score/label** and a short explanation.
- Only after preview & confirmation should the user submit the case to be saved in the system or sent to staff.

---

## Notes / Suggested Plan Adjustments

- **Numbering fixes:** The original steps repeated Step 4 and 6; in this plan, steps are **renumbered clearly** from 1 to 8.
- **Injury & Treatment (Step 6):** Using a **common section for all accident types** is appropriate and simplifies the flow; only small wording tweaks per type are needed.
- **Dynamic sections:** Accident-specific questions (liability context, insurance, property damage emphasis) are now explicitly tied to the selected accident type, so the chatbot can decide which micro-flows to run.
- **Future extensibility:** If new accident types are added later, they can plug into this structure by defining:
  - Custom Step 4 questions (context/liability).
  - Optional Step 5 insurance logic.
  - Optional tweaks to Step 7 for relevant property damage.


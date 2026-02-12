# AI-Based Personal Injury CRM - Phase 1

A modern, AI-powered CRM system for personal injury law firms. This Phase 1 implementation focuses on intelligent case intake with rule-based AI assistance and case qualification.

## 🚀 Features

### AI-Powered Intake System
- **Multi-step guided form** with 7 comprehensive steps
- **Dynamic AI helper messages** that adapt based on user input
- **Smart conditional rendering** showing relevant fields based on selections
- **Case qualification engine** that evaluates case viability using rule-based scoring
- **AI-generated case summaries** for attorney review

### Case Management Dashboard
- **Comprehensive case list** with all key metrics
- **Case details modal** with full case information
- **Viability badges** (High/Moderate/Low) with color coding
- **Priority levels** for attorney review workflow
- **Sample cases** pre-loaded for demonstration

## 📋 Tech Stack

- **Frontend Framework**: React 18+ (Vite)
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Routing**: React Router DOM
- **Build Tool**: Vite

## 🏗️ Project Structure

```
/src
  /components
    - IntakeStepper.jsx          # Step progress indicator
    - AIHelperText.jsx            # Dynamic AI helper messages
    - StepContactInfo.jsx         # Step 1: Contact information
    - StepAccidentDetails.jsx     # Step 2: Accident details
    - StepInsurance.jsx           # Step 3: Insurance information
    - StepInjuryTreatment.jsx     # Step 4: Injury & treatment
    - StepPropertyDamage.jsx       # Step 5: Property damage
    - StepAdditionalNotes.jsx     # Step 6: Additional notes
    - ReviewSubmit.jsx            # Step 7: Review & submit
    - CaseSummaryModal.jsx        # Case details modal
  /context
    - IntakeContext.jsx           # Global state management
  /utils
    - caseQualificationEngine.js  # Rule-based case scoring
    - generateCaseSummary.js      # AI summary generator
  /data
    - sampleCases.js              # Mock sample cases
  /pages
    - Dashboard.jsx               # Case dashboard
    - IntakeForm.jsx              # Multi-step intake form
```

## 🎯 Intake Steps

1. **Contact Information**: Name, phone, email
2. **Accident Details**: Date, type, collision details (if motor vehicle), at-fault party, police report
3. **Insurance**: Client and other party insurance status
4. **Injury & Treatment**: Injury status, treatment location, dates, known injuries, ongoing treatment
5. **Property Damage**: Damage status, severity, photo upload UI (mock)
6. **Additional Notes**: Free-form text input
7. **Review & Submit**: AI evaluation, case summary, final submission

## 🤖 AI Features

### Case Qualification Engine
The system evaluates cases using a rule-based scoring system:

- **+25 points**: Injury reported
- **+20 points**: Treatment received
- **+15 points**: At-fault party identified
- **+15 points**: Other party insured
- **+10 points**: Police report filed
- **+10 points**: Severe property damage
- **-20 points**: No injury
- **-15 points**: No insurance on either side
- **-10 points**: No treatment

**Viability Levels:**
- **High Viability** (≥70 points): Immediate Attorney Review
- **Moderate Viability** (40-69 points): Standard Review
- **Low Viability** (<40 points): Manual Screening Required

### AI Helper Messages
The system provides contextual guidance:
- Warns when no injury is reported
- Prompts for missing treatment information
- Suggests obtaining police reports
- Highlights insurance coverage concerns

## 🎨 UI/UX Features

- **Professional law firm theme** with blue/gray color palette
- **Smooth step transitions** with progress indicator
- **Animated conditional sections** for better UX
- **Fully responsive design** for all screen sizes
- **Color-coded viability badges** (Green/Yellow/Red)
- **Clean typography** and modern design

## 🚦 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## 📝 Usage

1. **Start the application**: Run `npm run dev`
2. **View Dashboard**: Navigate to `/dashboard` to see sample cases
3. **Create New Case**: Click "New Case Intake" or navigate to `/intake`
4. **Complete Intake Form**: Follow the 7-step guided process
5. **Review AI Evaluation**: See case viability score and summary before submission
6. **Submit Case**: Case is stored locally and appears in dashboard

## 🔮 Phase 2 Roadmap

This Phase 1 implementation is designed to be easily extended with:

- **Backend Integration**: Node.js/Express API
- **Database**: MySQL for persistent storage
- **Real AI Models**: Integration with OpenAI/Claude for enhanced summaries
- **Authentication**: User login and role management
- **Document Upload**: Cloud storage integration (AWS S3/GCP)
- **Automated Follow-ups**: Email/SMS notifications
- **Advanced Analytics**: Case metrics and reporting
- **Client Portal**: Self-service case status updates

## 📊 Data Structure

Cases are stored with the following structure:

```javascript
{
  caseId: "CASE-2026-001",
  contact: { fullName, phone, email },
  accident: { dateOfLoss, accidentType, collisionType, atFaultIdentified, policeReport },
  insurance: { clientAutoInsurance, otherPartyInsurance },
  injury: { injured, treatmentLocation, treatmentDates, knownInjuries, stillTreating },
  propertyDamage: { hasDamage, severity },
  additionalNotes: "",
  aiEvaluation: { score, viabilityLevel, priorityLevel, flags },
  aiSummary: "",
  status: "Pending Attorney Review"
}
```

## 🛠️ Development Notes

- All form validation uses Zod schemas
- State management handled via React Context
- Mock async submission simulates API calls
- Sample cases pre-loaded for demonstration
- Fully client-side implementation (no backend required)

## 📄 License

This project is part of a personal injury CRM system.

---

**Built with ❤️ for modern law firms**

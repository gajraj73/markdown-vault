# SALESFORCE CPQ - COMPLETE INTERVIEW GUIDE
## 70 Questions with Detailed Answers | Monday Interview Prep


---


# TABLE OF CONTENTS


1. [Section 1: Basic/Beginner Questions (Q1-Q12)](#section-1)
2. [Section 2: Intermediate Questions (Q13-Q25)](#section-2)
3. [Section 3: Advanced/Scenario-Based Questions (Q26-Q36)](#section-3)
4. [Section 4: Technical Questions - Objects, Automation, Pricing (Q37-Q48)](#section-4)
5. [Section 5: Specific CPQ Features Deep Dive (Q49-Q60)](#section-5)
6. [Section 6: Behavioral/Process Questions (Q61-Q70)](#section-6)


---


# SECTION 1: BASIC / BEGINNER QUESTIONS


---


## Q1. What is Salesforce CPQ?


Salesforce CPQ (Configure, Price, Quote) is a native Salesforce product (acquired from SteelBrick in 2015) that enables sales teams to quickly and accurately generate quotes. It automates the process of product configuration, pricing calculation, and quote document generation. CPQ lives on the Salesforce platform and extends the standard Opportunity and Quote objects with powerful guided-selling, rule-based pricing, and document-generation capabilities.


**Key Point for Interviews:** "CPQ reduces quoting errors, accelerates the sales cycle, and enforces pricing governance -- all natively within Salesforce."


---


## Q2. What does CPQ stand for, and what does each letter represent in practice?


- **Configure**: Allows reps to select and configure the right combination of products/services. Product rules, option constraints, and guided selling help ensure valid configurations.
- **Price**: Applies list prices, discount schedules, contracted prices, cost-plus markup, percent-of-total pricing, block pricing, and multi-dimensional quoting (MDQ) to calculate the correct price.
- **Quote**: Generates professional quote documents (PDFs) using quote templates, with e-signature integration, and manages the quote lifecycle through approval workflows.


---


## Q3. What are the main objects in Salesforce CPQ?


| Object | API Name | Purpose |
|--------|----------|---------|
| Quote | SBQQ__Quote__c | Header-level info: account, opportunity, dates, totals, status |
| Quote Line | SBQQ__QuoteLine__c | Each product/service being quoted with quantity, prices, discounts |
| Quote Line Group | SBQQ__QuoteLineGroup__c | Optional grouping of quote lines |
| Product | Product2 | Standard product, enhanced with CPQ fields |
| Price Book Entry | PricebookEntry | Links products to price books with list prices |
| Product Option | SBQQ__ProductOption__c | Parent-child relationships for bundles |
| Product Feature | SBQQ__ProductFeature__c | Groups options within a bundle |
| Product Rule | SBQQ__ProductRule__c | Configuration logic enforcement |
| Price Rule | SBQQ__PriceRule__c | Automated price calculations |
| Discount Schedule | SBQQ__DiscountSchedule__c | Volume/term-based discount tiers |
| Subscription | SBQQ__Subscription__c | Active subscriptions for renewals/amendments |
| Contract | Contract | Extended by CPQ for contracted terms |
| Order / Order Product | Order / OrderItem | Order generation from quotes |


---


## Q4. What is the difference between a standard Salesforce Quote and a CPQ Quote?


| Feature | Standard Quote | CPQ Quote (SBQQ__Quote__c) |
|---------|---------------|---------------------------|
| Guided Selling | No | Yes |
| Product Bundles | No | Yes - with option constraints |
| Multi-tier Pricing | Basic | List, Customer, Partner, Net |
| Price Rules | No | Yes - powerful declarative rules |
| Discount Schedules | No | Yes - volume & term-based |
| Approval Workflows | Basic | Advanced Approvals native to CPQ |
| Document Generation | Basic | Professional templates with conditional logic |
| Amendments & Renewals | No | Yes - full lifecycle support |
| Subscription Management | No | Yes - with proration & co-termination |


---


## Q5. What is the Quote Line Editor (QLE)?


The Quote Line Editor is the primary interface in CPQ where users add, configure, and price products on a quote. It provides a spreadsheet-like view of all quote lines.


**Key capabilities:**
- Adding products from the product catalog
- Configuring bundles and options
- Applying additional discounts
- Reordering and grouping lines
- Viewing real-time price calculations
- Saving and quick-saving quote lines


**Customization:** The QLE is customized using **field sets** to control which columns are visible and editable.


---


## Q6. How do you add products in CPQ?


Products are added through the QLE by clicking "Add Products." This opens the product lookup. Methods include:


1. **Direct Search**: Search/filter by product family, features, or search terms
2. **Guided Selling**: Wizard-like flow that asks questions and recommends products
3. **Favorites**: Pre-saved product combinations for quick loading
4. **Twin Quotes**: Cloning lines from existing quotes
5. **API**: Programmatic insertion via SBQQ/ServiceRouter


---


## Q7. What is a Product Bundle in CPQ?


A Product Bundle is a parent product that contains child **Product Options** organized into **Product Features**.


**Example:**
```
Laptop Bundle (Parent)
├── Feature: Storage
│   ├── Option: 256GB SSD
│   └── Option: 512GB SSD
├── Feature: Memory
│   ├── Option: 8GB RAM
│   └── Option: 16GB RAM
└── Feature: Accessories
   ├── Option: Wireless Mouse
   └── Option: Laptop Bag
```


The parent product has `SBQQ__ConfigurationType__c` set to "Allowed" or "Required."


---


## Q8. Explain the difference between Product Features and Product Options.


| Aspect | Product Feature | Product Option |
|--------|----------------|----------------|
| Purpose | Logical category/grouping within a bundle | Specific product available within a feature |
| Example | "Hard Drive" feature | "256GB SSD" option |
| Controls | Min/Max option count selection | Required, Selected, Quantity, Type |
| Object | SBQQ__ProductFeature__c | SBQQ__ProductOption__c |


---


## Q9. What are the different Product Option types?


| Type | Behavior | Example |
|------|----------|---------|
| **Component** | Part of the bundle. Price can roll up to parent. Appears nested. | RAM module in a laptop bundle |
| **Accessory** | Related but priced independently. Separate quote line. | Laptop bag sold with laptop |
| **Related Product** | Loosely associated. Independent line item. | Training course recommended with software |


---


## Q10. What is Guided Selling in CPQ?


Guided Selling provides a question-and-answer wizard that helps sales reps identify the right products.


**How it works:**
1. Admin configures prompts (questions) on the Process object
2. User answers questions like "How many employees?" or "Which industry?"
3. Based on answers, CPQ uses **Suggested Products** and **Filter Rules** to narrow the catalog
4. Reduces quote creation time from 45 minutes to ~10 minutes
5. Eliminates incompatible product selections


---


## Q11. What is a Primary Quote?


- Each Opportunity can have **multiple** CPQ Quotes
- Only **one** can be marked as Primary
- The Primary Quote **syncs** its totals and line items back to the Opportunity
- Populates Opportunity Amount, Products, and other mapped fields
- Ensures the Opportunity always reflects the most current quote


---


## Q12. What are Quote Line Groups?


Quote Line Groups organize quote lines into logical sections:
- Each group can have its own **subtotal**
- Used for **document generation** (separate sections on PDF)
- Useful for **multi-year deals** or presenting multiple options
- Can be used in **Price Rules** for group-level calculations
- Controlled fields: Group Line Subtotal, Group Net Total


---


# SECTION 2: INTERMEDIATE QUESTIONS


---


## Q13. Explain the CPQ Pricing Waterfall (CRITICAL TOPIC)


The CPQ pricing waterfall is the sequence of price calculations applied to each quote line:


```
┌─────────────────────────────────────────────────┐
│  1. LIST PRICE (from Price Book Entry)          │
│          ↓                                       │
│  2. CONTRACTED PRICE (from Account contract)     │
│          ↓                                       │
│  3. SPECIAL PRICE (effective starting price)     │
│          ↓                                       │
│  4. REGULAR PRICE (after Volume Discounts)       │
│          ↓                                       │
│  5. CUSTOMER PRICE (after Additional Discount)   │
│          ↓                                       │
│  6. PARTNER PRICE (after Partner Discount)       │
│          ↓                                       │
│  7. NET PRICE (after Distributor Discount)       │
└─────────────────────────────────────────────────┘
```


Each level cascades, so discounts compound. Price Rules can inject values at various points.


**Interview Tip:** Being able to explain this waterfall clearly is one of the most common and important CPQ interview questions.


---


## Q14. What are the different pricing methods in CPQ?


| Method | Description | Formula | Use Case |
|--------|-------------|---------|----------|
| **List** | Default. Uses Price Book Entry | List Price | Standard catalog pricing |
| **Cost** | Cost-plus pricing | Cost x (1 + Markup%) | Manufacturing, distribution |
| **Block** | Flat amount per quantity range | Lookup from tiers | Bulk/wholesale pricing |
| **Percent of Total** | % of sum of other lines | Base Lines Total x % | Services, maintenance |
| **Custom** | Apex-based pricing | Custom logic | Complex external pricing |


---


## Q15. What are Product Rules and what types exist? (VERY IMPORTANT)


Product Rules enforce business logic during product configuration. **Four types:**


### 1. Validation Rule
- **Blocks** saving if conditions not met
- Shows **error message**
- Example: "If Product A is selected, Product B must also be selected."


### 2. Selection Rule
- **Automatically** adds, removes, shows, hides, enables, or disables options
- Example: "If 'Enterprise License' selected, auto-add 'Premium Support'."


### 3. Alert Rule
- Displays **warning** but does NOT block
- Example: "You have selected a legacy product. Consider upgrading."


### 4. Filter Rule
- **Dynamically filters** products available in lookup
- Example: Show only products compatible with selected platform


### Product Rule Components:
- **Conditions**: When the rule fires (Error Condition objects or Advanced Condition logic)
- **Actions**: What happens (Product Actions for Selection rules)
- **Evaluation Event**: When evaluated (Load, Edit, Save, Always)
- **Scope**: Quote or Product level


---


## Q16. What are Price Rules and how do they differ from Product Rules?


| Aspect | Product Rules | Price Rules |
|--------|--------------|-------------|
| Purpose | Govern product configuration/selection | Automate pricing calculations |
| Components | Error Conditions + Product Actions | Price Conditions + Price Actions |
| Evaluation | Load, Edit, Save, Always | Before Calculate, On Calculate, After Calculate |
| Output | Add/remove products, show errors | Update price fields on quote lines |


**Price Rule Example:** "If the product family is 'Hardware' and quantity > 100, set Additional Discount to 10%."


**Price Rule Components:**
- **Price Conditions**: When the rule fires
- **Price Actions**: What field to update, source (value/formula/field), value
- **Lookup Queries**: Pull data from external objects for pricing matrices


---


## Q17. What are Discount Schedules?


Discount Schedules define tiered discounting based on **quantity** or **term length**:


| Type | Based On | Example |
|------|----------|---------|
| Quantity-based | Units ordered | 1-10 = 0%, 11-50 = 5%, 51-100 = 10% |
| Term-based | Subscription length | 12mo = 0%, 24mo = 5%, 36mo = 10% |


---


## Q18. What is the difference between Slab and Range? (FREQUENTLY ASKED)


### Range Method
The **entire quantity** gets the same discount based on the tier it falls into.


**Example (60 units):** Tier 51-100 = 10% discount → All 60 units get 10%


### Slab Method
Different **portions** get different discounts (like tax brackets).


**Example (60 units):**
- First 10 units: 0% discount
- Next 40 units (11-50): 5% discount
- Remaining 10 units (51-60): 10% discount


```
RANGE:  60 units × $100 × (1 - 10%) = $5,400
SLAB:   (10 × $100) + (40 × $95) + (10 × $90) = $1,000 + $3,800 + $900 = $5,700
```


---


## Q19. Explain the Subscription and Renewal Process in CPQ


```
Step 1: CREATE QUOTE
 └── Quote with subscription products (Subscription Type = "Renewable")


Step 2: CLOSE OPPORTUNITY
 └── Contract auto-generated with Subscription records


Step 3: CONTRACT ACTIVE
 └── Subscription records track each active line item


Step 4: RENEWAL TRIGGER (X days before end date)
 └── Renewal Opportunity + Renewal Quote auto-created


Step 5: RENEWAL QUOTE
 └── Pre-populated with existing subscriptions
 └── Rep adjusts quantities, applies new pricing, uplift
 └── Send to customer for approval
```


**Key Fields:**
- Subscription Type = "Renewable"
- Renewal Uplift Rate (percentage increase on renewal)
- Renewal Pricing Method: Same, List, or Uplift


---


## Q20. What is the Amendment Process in CPQ?


Amendments handle **mid-term changes** to existing contracts:


```
1. ACTIVE CONTRACT → Click "Amend"
2. AMENDMENT OPPORTUNITY + QUOTE created
3. Existing subscription lines pre-loaded (read-only)
4. Rep makes changes (add/remove/change quantities)
5. CPQ calculates PRORATED PRICE for remaining term
6. Close Won → Contract updated with new subscription lines
```


**Key Points:**
- Start date = date of change
- End date = original contract end date
- Proration is automatic
- Multiple amendments can stack


---


## Q21. "Renewable" vs "One-time" Subscription Type


| Aspect | Renewable | One-time |
|--------|-----------|----------|
| Appears on renewal quotes | Yes | No |
| Generates subscriptions | Yes | No |
| Revenue recognition | Over subscription term | At point of sale |
| Example | Annual software license | Setup/implementation fee |


---


## Q22. What is the Subscription Term?


The Subscription Term (on the Quote) defines the length in months. It affects:
- Prorated pricing for amendments
- Renewal quote generation timing
- Term discount schedule application
- MDQ segment calculations
- Contract and subscription end dates


---


## Q23. What are Twin Fields in CPQ?


Twin Fields automatically copy field values from **Product2** to **Quote Line** records:


**How it works:**
- If a custom field on Product2 has the **same API name** as a custom field on SBQQ__QuoteLine__c
- The value is automatically "twinned" (copied) when the product is added to a quote
- No custom automation needed


**Example:** Custom field `Region__c` on Product2 → automatically copied to `Region__c` on SBQQ__QuoteLine__c


---


## Q24. What are Favorite Quotes?


Favorites allow users to save a set of quote lines as a **reusable template**:
- Rep saves frequently quoted product combinations
- Quickly load saved lines into new quotes
- Speeds up quote creation
- Ensures consistency across similar deals


---


## Q25. Required vs Optional SKUs in a Bundle


| Required Options | Optional Options |
|-----------------|------------------|
| Must be included when bundle is added | Available for selection, not mandatory |
| User cannot deselect | User chooses to include or not |
| "Required" checkbox = checked on Product Option | "Required" checkbox = unchecked |
| Feature min/max can further constrain | Feature min/max can set minimum selections |


---


# SECTION 3: ADVANCED / SCENARIO-BASED QUESTIONS


---


## Q26. How do you handle Multi-Dimensional Quoting (MDQ) / Ramp Deals?


**Scenario:** Customer wants a 3-year subscription with different quantities each year.


**Solution: MDQ**


1. Set product's "Dimension Type" to segmented type (Year, Quarter, Month, Custom)
2. CPQ creates separate **Quote Line segments** for each period
3. Each segment has independent quantity, discount, and price


**Example:**
```
Year 1: 500 users × $50/user/month = $300,000
Year 2: 750 users × $52.50/user/month = $472,500  (5% uplift)
Year 3: 1,000 users × $55.13/user/month = $661,500  (5% uplift)
                                   Total = $1,434,000
```


---


## Q27. How to implement "Buy 2 Get 1 Free" in CPQ?


**Approach 1 - Price Rule:**
- Price Condition: product match AND quantity >= 3
- Price Action: Adjust unit price to reflect discount for every 3rd unit


**Approach 2 - Discount Schedule (Slab):**
- Units 1-2: 0% discount
- Every 3rd unit: 100% discount


**Approach 3 - Selection Product Rule:**
- Auto-add a "Free bonus" option when threshold met
- Bonus product has zero price


---


## Q28. Contracted Price + Renewal Uplift Scenario


**Scenario:** Contracted price = $80 (list = $100). Renewal with 5% uplift.


**How CPQ handles it:**
1. Contract has `SBQQ__RenewalUpliftRate__c` = 5%
2. Renewal quote generated → uplift applied
3. New price = $80 × (1 + 5%) = **$84**
4. Prior fields show original values for reference


Uplift precedence: Product-level > Quote-level > Subscription-level


---


## Q29. How do CPQ Advanced Approvals work?


CPQ has its own Advanced Approvals (separate from standard Salesforce):


| Component | Purpose |
|-----------|---------|
| Approval Rules | Define conditions (discount > 20%, total > $100K) |
| Approval Chains | Sequence of approvers (Manager → VP → Deal Desk) |
| Approval Variables | Store threshold values |
| Smart Approvals | Skip re-approval if changes improve terms |


**Features:**
- Sequential or parallel approval chains
- Email + Chatter notifications
- Status tracking: Draft → In Review → Approved → Rejected
- Integrates tightly with CPQ (vs. standard Salesforce approvals)


---


## Q30. Multi-Country / Regional Pricing


| Approach | Implementation |
|----------|---------------|
| Multiple Price Books | Regional price books (US, EU, APAC) per quote |
| Contracted Prices | Account-level pricing per region |
| Price Rules | Adjust pricing based on country field |
| Multi-Currency | Salesforce multi-currency with exchange rates |


---


## Q31. "Percent of Total" Pricing Scenario


**Common scenarios:**
- Implementation services = 20% of total software cost
- Annual maintenance = 18% of hardware cost
- Extended warranty = 5% of equipment total


**Configuration:**
1. Product's Pricing Method = "Percent of Total"
2. Set "Percent of Total (%)" field (e.g., 18%)
3. Optionally set "Percent of Total Base" to target specific products
4. Price dynamically recalculates when base lines change


---


## Q32. How to prevent quoting Product A without Product B?


Use a **Validation Product Rule:**


1. Create Product Rule → Type: Validation, Scope: Quote
2. Create a **Summary Variable**: COUNT of Quote Lines where Product = "Product B"
3. Error Condition: Summary Variable = 0 AND Product A exists on quote
4. Error Message: "Product B is required when quoting Product A."


---


## Q33. When is the "Calculate" button needed?


The Calculate button triggers full server-side recalculation. Needed when:
- Price rules or discount schedules need re-evaluation
- Changes to quantity/discount need to cascade through pricing waterfall
- After adding/removing products that affect percent-of-total lines
- Formula or lookup-based price rules need refreshed data


**Note:** Quick Save = save without recalculation. Save = save with calculation.


---


## Q34. How does CPQ handle proration for amendments?


```
Prorate Multiplier = Remaining Days / Total Days in Contract Term


Example:
- 12-month contract starting Jan 1
- Amendment on Jul 1 (6 months remaining)
- Prorate Multiplier = 183/365 ≈ 0.5014
- Adding 50 new licenses at $50/user/month
- Prorated charge = 50 × $50 × 6 months = $15,000
```


**Settings:** Prorate Precision, Proration Method (Daily/Monthly), Proration Day of Month


---


## Q35. Mutually exclusive options in a bundle?


**Approach 1 - Feature Min/Max (Simplest):**
- Set Feature's Min Options Selected = 1
- Set Feature's Max Options Selected = 1
- Forces exactly one selection


**Approach 2 - Selection Product Rules:**
- Rules that deselect Option A when Option B is selected
- Action type: "Disable" or "Deselect"


**Approach 3 - Configuration Attribute:**
- Picklist-type attribute maps to mutually exclusive options


---


## Q36. Evaluation Event settings: Load, Edit, Save, Always


| Event | Fires When | Best For |
|-------|-----------|----------|
| Load | Configuration page/QLE first loads | Setting defaults |
| Edit | User makes any change | Real-time Selection rules |
| Save | User clicks Save | Validation rules |
| Always | Load + Edit + Save | Critical rules (use cautiously - performance impact) |


---


# SECTION 4: TECHNICAL QUESTIONS


---


## Q37. What are Summary Variables?


Summary Variables aggregate data across quote lines:


| Property | Description |
|----------|-------------|
| Target Object | Usually Quote Line |
| Aggregate Function | SUM, COUNT, MIN, MAX, AVG |
| Aggregate Field | Field to aggregate (e.g., SBQQ__NetTotal__c) |
| Filter Field/Value | Limit which lines are included |
| Composite | Can reference other summary variables |


**Example:** SUM of SBQQ__NetTotal__c where Product Family = "Hardware" → Use in Price Rule to calculate Support as 15% of total hardware.


---


## Q38. What are Configuration Attributes?


Custom fields on the product configuration page for bundles:
- A "Color" picklist on a furniture bundle
- A "Deployment Region" attribute driving option filtering
- Can be Global or product-specific
- Used as conditions in Product Rules
- Can be hidden (logic-only, not displayed)


---


## Q39. CPQ Quote Calculation Sequence


```
1. BEFORE CALCULATE Price Rules fire
     ↓
2. PRICING WATERFALL executes
  (List → Contracted → Special → Discount Schedules → Regular
   → Additional Discount → Customer → Partner Discount → Partner
   → Distributor Discount → Net)
     ↓
3. ON CALCULATE Price Rules fire
     ↓
4. AFTER CALCULATE Price Rules fire
     ↓
5. Quote-level rollups recalculated
     ↓
6. MDQ segments recalculated (if applicable)
     ↓
7. Percent of Total lines recalculated
```


---


## Q40. How do Contracted Prices work?


1. Opportunity Closed Won → Contract created → Subscription prices written as Contracted Prices on Account
2. Record: `SBQQ__ContractedPrice__c` links Account + Product + Price
3. New quotes for that Account automatically use contracted price
4. Overrides list price in the waterfall (after list, before special)
5. Can have effective dates and expiration dates
6. Can be manually created or auto-generated from contracts


---


## Q41. What is the CPQ Calculator Plugin?


The CPQ Calculator Plugin is an Apex interface for custom pricing logic:


**Interface:** `SBQQ.QuoteCalculatorPlugin` (or Plugin2)


**Methods:**
| Method | Fires When |
|--------|-----------|
| onInit | QLE loads |
| onBeforeCalculate | Before pricing engine |
| onAfterCalculate | After pricing, before save |
| onBeforePriceRules | Before Price Rule evaluation |
| onAfterPriceRules | After Price Rule evaluation |
| isFieldEditable | Dynamically control field editability |


**Registration:** CPQ Package Settings > Plugins > Quote Calculator Plugin


---


## Q42. Legacy vs React-based QLE


| Aspect | Legacy QLE | New (React) QLE |
|--------|-----------|-----------------|
| Technology | Visualforce, iframe | LWC / React |
| Performance | Slower | Faster |
| Calculations | Server-side Apex | Client-side JavaScript |
| Plugin | Apex QuoteCalculatorPlugin | JavaScript Quote Calculator |
| UI | Older interface | Modern Lightning UI |


---


## Q43. Quote Document Generation


**Components:**
1. **Quote Templates**: Define structure/layout of PDF
2. **Template Sections**: Header, Line Items, Custom Content (HTML), Footer
3. **Template Content**: Rich text, merge fields from Quote/Account/Opportunity
4. **Line Columns**: Which quote line fields appear as table columns
5. **Conditional Sections**: Show/hide based on quote field values
6. **Additional Documents**: Watermarks, attachments, e-signature integration


**Process:** User clicks "Generate Document" → Select template → CPQ generates PDF → Stored as file attachment


---


## Q44. Important CPQ Field Sets


| Field Set | Object | Controls |
|-----------|--------|----------|
| SBQQ__LineEditor | Quote Line | Columns in QLE |
| SBQQ__SearchFilters | Product2 | Filter fields in product search |
| SBQQ__SearchResults | Product2 | Columns in search results |
| SBQQ__OptionLookup | Product Option | Fields when browsing options |
| SBQQ__OptionConfiguration | Product Option | Editable fields during config |
| SBQQ__GroupFields | Quote Line Group | Fields shown for groups |


---


## Q45. CPQ Apex Interfaces for Customization


| Interface | Purpose |
|-----------|---------|
| SBQQ.QuoteCalculatorPlugin | Custom logic during calculation |
| SBQQ.TriggerHandler | Custom trigger handling |
| SBQQ.ContractManipulator | Customize contract generation |
| SBQQ.OrderManipulator | Customize order generation |
| SBQQ.SubscriptionManipulator | Customize subscription handling |
| SBQQ.RenewalCallback | Custom renewal quote logic |
| SBQQ.AmendCallback | Custom amendment quote logic |
| SBQQ.DocumentStorePlugin | Custom document storage |
| CPQ Quote API (ServiceRouter) | REST API for quote operations |


---


## Q46. Multi-Currency in CPQ


1. Enable multi-currency in Salesforce org
2. Define exchange rates in Setup
3. Quotes inherit Opportunity currency
4. Price Books can be currency-specific
5. CPQ converts using active exchange rate
6. Quote "Currency ISO Code" determines currency
7. Contracted Prices stored in specific currency
8. Documents display in quote currency


---


## Q47. CPQ Package Settings Key Categories


| Category | Settings |
|----------|----------|
| Pricing & Calculation | Calculate immediately, calculation order, proration |
| Quotes | Default subscription term, auto-renewal, uplift |
| Subscriptions | Prorate precision, co-termination, renewal models |
| Order | Auto-create orders, order settings |
| Documents | Template settings, storage |
| Plugins | Plugin class names |
| Line Editor | Page size, field sets, QLE behavior |
| Groups | Default group settings |


---


## Q48. Custom Triggers on CPQ Objects - Best Practices


1. **Use SBQQ.TriggerHandler** interface when possible
2. **Avoid triggers on SBQQ__QuoteLine__c** during calculation (use Price Rules or Plugin instead)
3. Be mindful of **SBQQ__TriggerDisabled__c** flag on User
4. Use "Before/After Calculate" Price Rules as alternatives
5. Test thoroughly to avoid infinite loops
6. CPQ performs bulk DML on quote lines → triggers must handle bulk


---


# SECTION 5: SPECIFIC CPQ FEATURES DEEP DIVE


---


## Q49. What is a Lookup Query?


A Lookup Query dynamically sets field values by looking up data from another object:


| Component | Purpose |
|-----------|---------|
| Lookup Object | The object to query (e.g., custom "Pricing Matrix") |
| Match Fields | Fields used to match records (e.g., Product Family + Region) |
| Return Fields | Values returned and set on the quote line |
| Used With | Price Rules (as source for Price Actions) |


**Power Use Case:** Complex pricing matrices stored in custom objects, pulled dynamically based on quote line attributes.


---


## Q50. Validation Rule vs Alert Rule


| Aspect | Validation Rule | Alert Rule |
|--------|----------------|------------|
| Blocks save | YES - hard stop | NO - soft warning |
| User action | Must fix before proceeding | Can acknowledge and continue |
| Use for | Must-enforce business rules | Recommendations/warnings |
| Example | "Product B required with A" | "Consider upgrading legacy product" |


---


## Q51. What is Co-Termination?


Co-Termination aligns end dates of new subscriptions with existing contracts:


1. Customer with active contract purchases additional products
2. New subscription's end date = existing contract's end date
3. Pricing is prorated for the shorter remaining term
4. All subscriptions renew at the same time


**Configuration:** "Co-Termination Event" field on Contract + enable in CPQ settings.


---


## Q52. Evergreen Subscriptions


- Auto-renew indefinitely, no fixed end date
- "Evergreen" checkbox on subscription/quote line
- NOT included in standard renewal opportunities
- Amendments still possible at any time
- Billing generates invoices indefinitely
- Termination: Amendment zeroing out quantities


---


## Q53. CPQ Quote API (CRITICAL for technical interviews)


**Key endpoints (via SBQQ/ServiceRouter):**


| Operation | Endpoint |
|-----------|----------|
| Read Quote | `?loader=SBQQ.QuoteAPI.QuoteReader` |
| Save Quote | `?saver=SBQQ.QuoteAPI.QuoteSaver` |
| Read Product | `?loader=SBQQ.ProductAPI.ProductLoader` |
| Add Product | `?loader=SBQQ.QuoteAPI.QuoteProductAdder` |


**Use cases:** External configurators, e-commerce integration, custom Lightning components, automated quote generation.


---


## Q54. Floor and Ceiling Pricing


**Approach 1 - Price Rules (Recommended):**
- "After Calculate" evaluation event
- Check if Net Price < floor → set to floor
- Check if Net Price > ceiling → set to ceiling


**Approach 2 - Validation Product Rules:**
- Summary Variable checks prices
- Prevent saving if below floor


**Approach 3 - Approval Rules:**
- Trigger approval when price below floor


**Approach 4 - Calculator Plugin:**
- Implement in `onAfterCalculate` method


---


## Q55. Error Conditions and Advanced Condition Logic


**Error Conditions** = "IF" criteria for Product Rules:
- Tested Object: Quote, Quote Line, Product Option, Summary Variable
- Tested Field: Any field on tested object
- Operator: Equals, Not Equals, Less Than, Greater Than, Contains, etc.
- Filter Type: Value (hardcoded) or Variable (field reference)


**Advanced Condition Logic:**
- Default: All conditions use AND
- Custom: `(1 AND 2) OR 3` to combine with OR logic


---


## Q56. "Bundled" vs "Optional" Pricing


| Setting | Price Behavior | Customer Sees |
|---------|---------------|---------------|
| Bundled = TRUE | Price = $0 (included in parent) | "Included" |
| Bundled = FALSE | Carries own price, adds to total | Charged separately |


Controlled by "Bundled" checkbox on Product Option record.


---


## Q57. Cost and Markup Pricing


1. Pricing Method = "Cost"
2. Set `SBQQ__Cost__c` on Product or Quote Line
3. Set `SBQQ__MarkupRate__c` (percentage)
4. **Formula: Unit Price = Cost × (1 + Markup%)**
5. Markup can be set at product level (default) or overridden at line level
6. Common in manufacturing/distribution where cost fluctuates


---


## Q58. Order and Contract Generation


**Contract Generation:**
- "Contracted" checkbox → auto-create Contract
- "Contract by Quote" → one contract per quote
- Contract inherits subscription info from quote lines


**Order Generation:**
- "Ordered" checkbox → auto-create Order
- Order Products mirror quote lines
- Billing uses Orders as basis for invoicing
- Orders can be split by date, type, or criteria


---


## Q59. Ramp Deal Implementation with MDQ


```
Product: "Enterprise Platform License"
Dimension Type: Year
Subscription Term: 36 months


Year 1:  50 licenses  × $100/month = $60,000
Year 2: 100 licenses  × $100/month = $120,000
Year 3: 200 licenses  × $100/month = $240,000
                           Total  = $420,000
```


Each year = separate segment with independent quantity and discount.


---


## Q60. JavaScript Quote Calculator (Custom Script)


**Client-side JavaScript** running in the QLE for real-time calculations:


| Method | Purpose |
|--------|---------|
| onInit() | When QLE loads |
| onBeforeCalculate() | Before pricing engine |
| onBeforePriceRules() | Before Price Rules |
| onAfterPriceRules() | After Price Rules |
| onAfterCalculate() | After calculation |
| isFieldEditable() | Dynamic field editability |


**Key points:**
- Receives quote model as JSON
- Cannot make server calls (client-side only)
- React/LWC QLE relies heavily on this for performance
- Configured in CPQ Package Settings > Plugins


---


# SECTION 6: BEHAVIORAL / PROCESS QUESTIONS


---


## Q61. CPQ Performance Troubleshooting


| Issue | Solution |
|-------|----------|
| Large quotes (100+ lines) | Use groups or separate quotes |
| Too many Product Rules | Target evaluation events; consolidate rules |
| Complex Price Rules | Minimize count; use Lookup Queries |
| Summary Variables | Reduce complex aggregations |
| Custom Triggers | Disable during calculation (SBQQ__TriggerDisabled__c) |
| Too many QLE fields | Remove unnecessary fields from field sets |
| Server-side calculations | Move to JavaScript Calculator Plugin |
| Very large quotes | Use asynchronous calculation |


---


## Q62. Net Total vs List Total


| Field | API Name | Meaning |
|-------|----------|---------|
| List Total | SBQQ__ListAmount__c | Sum of list prices × quantities (before discounts) |
| Net Total | SBQQ__NetAmount__c | Sum of net prices (after all discounts) |
| Difference | - | Total discount given |


Also available: Customer Total, Partner Total, Regular Total (intermediate waterfall points).


---


## Q63. Partner/Channel Pricing in CPQ


CPQ multi-tier model:
1. **Customer Price** (after rep's additional discount)
2. **Partner Price** (after partner discount/margin)
3. **Net Price** (after distributor discount)


**Implementation:**
- Enable Partner/Distributor Discount fields
- Partner communities expose QLE to partners
- "Price Editable" fields control what partners can change
- Price Rules apply partner-specific discounts


---


## Q64. CPQ Data Migration Considerations


**Migration Order:**
```
1. Products (Product2)
2. Price Book Entries (PricebookEntry)
3. Product Features (SBQQ__ProductFeature__c)
4. Product Options (SBQQ__ProductOption__c)
5. Product Rules + Error Conditions
6. Price Rules + Price Conditions + Price Actions
7. Summary Variables
8. Discount Schedules + Tiers
9. Quote Templates + Sections
10. Contracts + Subscriptions (if applicable)
11. Package Settings (MANUAL - not metadata)
```


**Key Tools:** Salesforce Data Loader, SFDX data import
**Critical Note:** Many CPQ configurations are DATA records, not metadata!


---


## Q65. Quote Status vs Quote Stage


| Aspect | Quote Status (SBQQ__Status__c) | Quote Stage |
|--------|-------------------------------|-------------|
| Tracks | Approval status | Sales lifecycle stage |
| Values | Draft, In Review, Approved, Rejected, Presented, Accepted | Draft, Proposal, Negotiation, Closed Won |
| Controlled by | Approval process | Sales process mapping |
| Maps to | - | Can map to Opportunity Stage |


---


## Q66. Taxation in CPQ


CPQ does NOT have native tax calculation. Options:


| Approach | Details |
|----------|---------|
| Tax-Inclusive Pricing | Include tax in product price (simple, inflexible) |
| Custom Tax Fields | Add tax rate/amount fields; use Price Rules |
| Third-Party Integration | Avalara, Vertex, Thomson Reuters |
| Salesforce Billing | Tax calculated at invoice level |


---


## Q67. What happens when you Clone a CPQ Quote?


1. New Quote record created with most field values copied
2. All Quote Lines cloned as children
3. Quote Line Groups cloned
4. Status reset to "Draft"
5. NOT marked as Primary
6. Line details (quantities, discounts) preserved
7. System fields reset
8. Subscription fields may need clearing


---


## Q68. SBQQ__TriggerDisabled__c Flag


- Checkbox on **User** object
- When checked: CPQ managed package triggers are disabled for that user
- Useful for: data loads, migrations, troubleshooting
- Should be temporary
- Does NOT disable custom triggers
- Common on integration user profiles


---


## Q69. Typical CPQ Implementation Lifecycle


```
1. DISCOVERY     → Gather requirements (catalog, pricing, approvals, integrations)
2. DESIGN        → Data model, pricing strategy, approval chains, templates
3. BUILD         → Configure CPQ in sandbox
4. CUSTOMIZE     → Apex plugins, LWC components, integrations
5. TEST (UAT)    → Business user testing across all scenarios
6. DATA MIGRATE  → Product catalog, historical contracts
7. TRAIN         → Sales reps on QLE, guided selling, documents
8. DEPLOY        → Production deployment
9. HYPERCARE     → Post-go-live support and iterations
```


---


## Q70. CPQ Deployment Between Environments


| Item | Deployment Method |
|------|------------------|
| Custom Objects/Fields | Change Sets / Metadata API / SFDX |
| Product Data | Data Loader / SFDX data import |
| Product Rules & Price Rules | Data Loader (these are DATA records!) |
| Quote Templates | Data Loader (DATA records!) |
| Package Settings | Manual configuration in each org |
| Apex Classes | Change Sets / Metadata API |


**Key Insight:** Many CPQ configs are stored as data records, not metadata -- this complicates standard deployment. Use tools like Copado, Gearset, or Flosum for better CPQ deployment management.


---


# QUICK REFERENCE: TOP 10 INTERVIEW TOPICS


1. **Pricing Waterfall** - Know it cold (List → Contracted → Special → Regular → Customer → Partner → Net)
2. **Product Rules** - 4 types (Validation, Selection, Alert, Filter) + Evaluation Events
3. **Price Rules** - Conditions, Actions, Evaluation Events (Before/On/After Calculate)
4. **Discount Schedules** - Range vs Slab (know the math!)
5. **MDQ (Multi-Dimensional Quoting)** - Ramp deals, yearly segments
6. **Amendments & Renewals** - Full lifecycle, proration, uplift
7. **Product Bundles** - Options, Features, Component/Accessory/Related
8. **Advanced Approvals** - Rules, Chains, Smart Approvals
9. **Twin Fields** - Auto-copy from Product to Quote Line
10. **CPQ Quote API** - ServiceRouter endpoints, programmatic quoting


---


*Prepared for Monday Interview | Good luck! 🎯*




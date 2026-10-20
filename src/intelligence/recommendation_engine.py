"""
Recommendation Engine for FinSense.

Answers FinSense Question 4: "What should I do?"
Generates personalized, prioritized financial action recommendations based on
the unified UserFinancialState produced by FinancialStateEngine.

Coverage:
  - All 4 financial health pillars (Credit, Debt, Liquidity, Discipline)
  - All 9 risk alert types
  - All 6 behavioral personas
  - All 4 health tiers (EXCELLENT, STABLE, VULNERABLE, CRITICAL)
  - Net cash flow analysis (surplus & deficit)
  - Positive reinforcement + wealth-building for healthy profiles
  - Composite & cross-pillar interactions (e.g. good credit + high debt)
"""

from dataclasses import dataclass, asdict
from typing import List, Dict, Any
from src.intelligence.financial_state import UserFinancialState


@dataclass
class ActionableRecommendation:
    """
    Structured action item presented to the user and the AI Assistant.
    """
    action: str
    category: str        # LIQUIDITY, DEBT, CASH_FLOW, BUDGET, CREDIT, DISCIPLINE,
                         # OPTIMIZATION, WEALTH, INCOME, TAX, INSURANCE, MINDSET
    priority: str        # HIGH, MEDIUM, LOW
    impact_estimate: str # Projected financial benefit
    explanation: str     # Rationale tailored to the user's specific numbers

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# Priority weights used for final sort
_PRIORITY_ORDER = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}


class RecommendationEngine:
    """
    Comprehensive rule-based & persona-driven decision engine.

    Maps every active risk alert, pillar score, health tier, behavioral persona,
    and financial metric to concrete, prioritised interventions.  Rules are
    organized into themed sections and deduplicated at the end so a user never
    sees two recommendations that conflict or overlap on the same underlying fix.
    """

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    @classmethod
    def generate_recommendations(cls, state: UserFinancialState) -> List[ActionableRecommendation]:
        recs: List[ActionableRecommendation] = []

        cls._liquidity_rules(state, recs)
        cls._debt_rules(state, recs)
        cls._credit_rules(state, recs)
        cls._cash_flow_rules(state, recs)
        cls._budget_discipline_rules(state, recs)
        cls._income_rules(state, recs)
        cls._savings_investment_rules(state, recs)
        cls._persona_rules(state, recs)
        cls._health_tier_rules(state, recs)
        cls._insurance_protection_rules(state, recs)
        cls._tax_optimization_rules(state, recs)
        cls._positive_reinforcement_rules(state, recs)

        # Deduplicate by action text (keep first occurrence = highest priority)
        seen: set = set()
        unique: List[ActionableRecommendation] = []
        for r in recs:
            key = r.action.lower()
            if key not in seen:
                seen.add(key)
                unique.append(r)

        # Sort: HIGH -> MEDIUM -> LOW
        unique.sort(key=lambda r: _PRIORITY_ORDER.get(r.priority, 3))
        return unique

    # =========================================================================
    # 1. LIQUIDITY & EMERGENCY CUSHION
    # =========================================================================

    @classmethod
    def _liquidity_rules(cls, state: UserFinancialState, recs: list) -> None:

        # --- Critical: no buffer at all ---
        if state.runway_months < 1.0 or "LIQUIDITY_DEFICIT" in state.risk_alerts:
            daily_auto = max(5, round(state.net_cash_flow * 0.05, 0)) if state.net_cash_flow > 0 else 5
            recs.append(ActionableRecommendation(
                action="Build a $1,000 Starter Emergency Buffer -- Do This First",
                category="LIQUIDITY",
                priority="HIGH",
                impact_estimate="Prevents payday borrowing, overdraft fees, and cascading debt during any sudden shock",
                explanation=(
                    f"Your liquid emergency runway is only {state.runway_months:.1f} months -- you are one unexpected "
                    f"expense away from a financial crisis. Before paying down debt or investing, accumulate a minimum "
                    f"$1,000 safety net. Automate a daily micro-transfer of ${daily_auto:.0f} "
                    f"to a separate savings account to get there within weeks."
                )
            ))

        # --- Low: < 3 months ---
        elif state.runway_months < 3.0:
            shortfall = round(state.monthly_burn_rate * (3.0 - state.runway_months), 2)
            income_pct = round(shortfall / 6 / state.monthly_income * 100, 1) if state.monthly_income > 0 else 0
            recs.append(ActionableRecommendation(
                action="Expand Emergency Runway to 3 Months",
                category="LIQUIDITY",
                priority="HIGH",
                impact_estimate=f"Save an additional ${shortfall:,.2f} to reach the 3-month standard baseline",
                explanation=(
                    f"Your runway is {state.runway_months:.1f} months -- below the universally recommended 3-month floor. "
                    f"Open a dedicated high-yield savings account and direct ${round(shortfall / 6, 2):,.2f}/month "
                    f"(~{income_pct}% of income) until the gap is closed."
                )
            ))

        # --- Moderate: 3-6 months (good but not great) ---
        elif state.runway_months < 6.0:
            shortfall = round(state.monthly_burn_rate * (6.0 - state.runway_months), 2)
            recs.append(ActionableRecommendation(
                action="Extend Emergency Fund to 6 Months for Full Stability",
                category="LIQUIDITY",
                priority="MEDIUM",
                impact_estimate=f"${shortfall:,.2f} more unlocks the EXCELLENT liquidity tier and full peace-of-mind",
                explanation=(
                    f"You have {state.runway_months:.1f} months covered -- solid, but financial planning best practice "
                    f"targets 6 months. At your current burn rate of ${state.monthly_burn_rate:,.2f}/month, you need "
                    f"${shortfall:,.2f} more. Add ${round(shortfall / 12, 2):,.2f}/month and you'll be fully cushioned within a year."
                )
            ))

        # --- Exceptional: > 12 months (cash drag risk) ---
        if state.runway_months > 12.0:
            excess_cash = round((state.runway_months - 6) * state.monthly_burn_rate)
            recs.append(ActionableRecommendation(
                action="Redeploy Excess Emergency Cash -- You're Holding Too Much Idle",
                category="OPTIMIZATION",
                priority="LOW",
                impact_estimate="Moving months 7-12+ into investments could generate 5-10% annual returns vs. ~0.5% in checking",
                explanation=(
                    f"Your emergency fund covers {state.runway_months:.1f} months -- well beyond the 6-month target. "
                    f"Keep 6 months in a HYSA, then redirect the surplus (~${excess_cash:,.2f}) into diversified "
                    f"investments or retirement accounts. Idle cash loses value to inflation."
                )
            ))

    # =========================================================================
    # 2. DEBT & LEVERAGE
    # =========================================================================

    @classmethod
    def _debt_rules(cls, state: UserFinancialState, recs: list) -> None:

        # --- Critical DTI (> 43%) ---
        if "CRITICAL_DEBT_BURDEN" in state.risk_alerts or state.debt_pillar < 10.0:
            recs.append(ActionableRecommendation(
                action="Launch Debt Avalanche: Target Highest-Interest Debt First",
                category="DEBT",
                priority="HIGH",
                impact_estimate="Eliminating high-interest obligations can save $200-$800/month and restore DTI below 36%",
                explanation=(
                    f"Your debt-to-income ratio is in critical territory (debt pillar score: {state.debt_pillar:.1f}/25). "
                    f"List all obligations by interest rate. Direct every available dollar above minimum payments to the "
                    f"highest-rate debt first. Once cleared, roll those payments to the next -- this 'avalanche' method "
                    f"minimises total interest paid."
                )
            ))
            recs.append(ActionableRecommendation(
                action="Contact Lenders to Negotiate Lower Interest Rates or a Hardship Plan",
                category="DEBT",
                priority="HIGH",
                impact_estimate="Rate reductions of even 2-5% dramatically accelerate payoff timelines",
                explanation=(
                    "With critical debt burden, proactively call each lender and ask for a rate review. "
                    "Many credit card companies offer temporary hardship programs with reduced APR. "
                    "Balance transfer to a 0% promotional card (if eligible) can also freeze interest accrual for 12-18 months."
                )
            ))

        # --- Elevated DTI (20-43%) ---
        elif state.debt_pillar < 18.0:
            extra_payment = round(state.monthly_burn_rate * 0.10)
            recs.append(ActionableRecommendation(
                action="Accelerate Debt Repayment -- Add 10% Extra to Monthly Payments",
                category="DEBT",
                priority="MEDIUM",
                impact_estimate="An extra 10% on monthly payments can cut repayment timelines by 20-30%",
                explanation=(
                    f"Your debt leverage is elevated (debt pillar: {state.debt_pillar:.1f}/25). "
                    f"You don't need a dramatic overhaul -- simply adding ${extra_payment:,.0f}/month "
                    f"in extra debt payments significantly reduces your total interest and frees up future cash flow."
                )
            ))

        # --- Low DTI + good credit: leverage opportunity ---
        if state.debt_pillar >= 20.0 and state.credit_pillar >= 18.0 and state.net_cash_flow > 500:
            recs.append(ActionableRecommendation(
                action="Leverage Your Low DTI: Access Low-Rate Credit for Productive Use Only",
                category="DEBT",
                priority="LOW",
                impact_estimate="Access to prime rates (6-8%) for investments returning 8-12% creates positive leverage",
                explanation=(
                    f"With strong credit ({state.credit_pillar:.1f}/25) and low leverage ({state.debt_pillar:.1f}/25), "
                    f"you qualify for the most favourable borrowing rates. Consider using low-rate credit for "
                    f"appreciating assets (education, real estate, business) -- never for consumption. "
                    f"Your monthly surplus of ${state.net_cash_flow:,.2f} can comfortably service such debt."
                )
            ))

    # =========================================================================
    # 3. CREDIT SCORE
    # =========================================================================

    @classmethod
    def _credit_rules(cls, state: UserFinancialState, recs: list) -> None:

        # --- Subprime: pillar score maps to ~FICO < 580 ---
        if "POOR_CREDIT_SCORE" in state.risk_alerts or state.credit_pillar < 7.0:
            recs.append(ActionableRecommendation(
                action="Repair Credit Score: Dispute Errors & Reduce Utilisation Below 30%",
                category="CREDIT",
                priority="HIGH",
                impact_estimate="Moving from subprime to fair credit (580->670) can reduce loan APRs by 3-6% and unlock rental options",
                explanation=(
                    f"Your credit pillar score is {state.credit_pillar:.1f}/25, indicating a subprime FICO range. "
                    f"Step 1: Pull your free credit report (annualcreditreport.com) and dispute any errors. "
                    f"Step 2: Get card utilisation below 30% -- the fastest single FICO lever. "
                    f"Step 3: Become an authorised user on a family member's well-managed card to instantly inherit their history."
                )
            ))
            recs.append(ActionableRecommendation(
                action="Open a Secured Credit Card to Build Payment History",
                category="CREDIT",
                priority="HIGH",
                impact_estimate="12 months of on-time payments typically lifts FICO 40-80 points from a subprime base",
                explanation=(
                    "Payment history is 35% of your FICO score. A secured card (deposit-backed) is the safest way "
                    "to build a perfect on-time record without risk of overspending. Use it for one recurring bill "
                    "and set up autopay. After 12 months, graduate to an unsecured card."
                )
            ))

        # --- Near-prime: pillar 7-14 (approx FICO 580-670) ---
        elif state.credit_pillar < 14.0:
            recs.append(ActionableRecommendation(
                action="Boost Credit Score: Pay Balances Twice Monthly & Keep Utilisation Under 10%",
                category="CREDIT",
                priority="MEDIUM",
                impact_estimate="Dropping utilisation from 30% to under 10% can raise FICO by 20-40 points within 60 days",
                explanation=(
                    f"Your credit pillar is {state.credit_pillar:.1f}/25 -- near-prime territory. "
                    f"The fastest legal score boost is paying your credit card balance mid-cycle (before statement close), "
                    f"keeping reported utilisation under 10%. Also, never close old accounts -- account age matters."
                )
            ))

        # --- Good credit: pillar 14-18 ---
        elif state.credit_pillar < 18.0:
            recs.append(ActionableRecommendation(
                action="Optimise Credit Mix to Push Score into the Excellent Tier",
                category="CREDIT",
                priority="LOW",
                impact_estimate="A diverse credit mix (cards + installment loans) accounts for 10% of FICO -- worth 15-25 extra points",
                explanation=(
                    f"Your credit score is good (pillar: {state.credit_pillar:.1f}/25). To reach excellent, ensure you have "
                    f"both revolving credit (cards) and at least one installment loan (auto/personal) on record. "
                    f"Also, request a credit limit increase without a hard pull to automatically lower your utilisation ratio."
                )
            ))

        # --- Excellent: pillar >= 20 ---
        if state.credit_pillar >= 20.0:
            recs.append(ActionableRecommendation(
                action="Leverage Excellent Credit: Apply for a Premium Rewards Card",
                category="OPTIMIZATION",
                priority="LOW",
                impact_estimate="Premium travel or cashback cards return 2-5% on all spending -- $600-$1,500+/year at your spend level",
                explanation=(
                    f"Your credit pillar score is {state.credit_pillar:.1f}/25 -- you have excellent credit. "
                    f"Premium rewards cards (e.g., Chase Sapphire, Amex Gold) require strong FICO and "
                    f"offer outsized sign-up bonuses plus ongoing rewards on everyday categories. "
                    f"Pay in full every month to capture rewards at zero net cost."
                )
            ))

    # =========================================================================
    # 4. CASH FLOW
    # =========================================================================

    @classmethod
    def _cash_flow_rules(cls, state: UserFinancialState, recs: list) -> None:

        # --- Chronic depletion ---
        if "CHRONIC_CASH_DEPLETION" in state.risk_alerts or state.cash_depletion_risk > 0.30:
            recs.append(ActionableRecommendation(
                action="Set Up an Automated $500 Minimum Account Floor",
                category="CASH_FLOW",
                priority="HIGH",
                impact_estimate="Eliminate overdraft fees ($35-$105/event) and prevent zero-balance cash lockouts",
                explanation=(
                    f"{state.cash_depletion_risk*100:.1f}% of your transactions drain your balance to $0. "
                    f"Link a savings account to your checking and configure automatic transfers to maintain a $500 floor. "
                    f"Most banks offer this free. This single automation prevents the most common and costly cash spiral."
                )
            ))

        elif state.cash_depletion_risk > 0.15:
            recs.append(ActionableRecommendation(
                action="Increase Your Checking Account Floor to $300",
                category="CASH_FLOW",
                priority="MEDIUM",
                impact_estimate="Moderate depletion risk -- a small buffer prevents occasional overdraft exposure",
                explanation=(
                    f"Your account hits near-zero {state.cash_depletion_risk*100:.1f}% of the time. "
                    f"Setting a $300 minimum floor via linked savings or an automated rule removes most overdraft risk."
                )
            ))

        # --- Inflow deficit ---
        if "INFLOW_DEFICIT" in state.risk_alerts or state.inflow_replenishment_ratio < 0.85:
            deficit = abs(state.net_cash_flow)
            recs.append(ActionableRecommendation(
                action="Eliminate Monthly Cash Deficit by Realigning Bill Payment Dates",
                category="CASH_FLOW",
                priority="HIGH",
                impact_estimate=f"Plugging the ${deficit:,.2f}/month deficit stops the compounding cash drain",
                explanation=(
                    f"Your inflows cover only {state.inflow_replenishment_ratio*100:.1f}% of outflows -- "
                    f"you are spending ${deficit:,.2f} more per month than you earn into your account. "
                    f"Step 1: Contact utility and subscription providers to shift due dates to 3-5 days after your primary income deposit. "
                    f"Step 2: Identify and eliminate at least ${round(deficit * 0.5):,.0f} in discretionary outflows immediately."
                )
            ))
            recs.append(ActionableRecommendation(
                action="Audit All Recurring Subscriptions and Cancel Unused Services",
                category="CASH_FLOW",
                priority="HIGH",
                impact_estimate="Average household has $150-$300/month in forgotten or duplicate subscriptions",
                explanation=(
                    "With a cash inflow deficit, recurring charges are the fastest source of recoverable cash. "
                    "Use a bank statement export or an app like Rocket Money to surface every subscription. "
                    "Cancel anything you haven't actively used in 30 days."
                )
            ))

        # --- Strong surplus ---
        if state.net_cash_flow > 1000 and state.inflow_replenishment_ratio >= 1.10:
            projected = round(state.net_cash_flow * 12 * 10 * 1.07)
            recs.append(ActionableRecommendation(
                action="Put Your Cash Surplus on Autopilot with Automatic Investment Transfers",
                category="WEALTH",
                priority="MEDIUM",
                impact_estimate=f"Investing your ${state.net_cash_flow:,.2f}/month surplus could grow to ${projected:,.0f}+ over 10 years at 7% annual return",
                explanation=(
                    f"You generate a strong monthly surplus of ${state.net_cash_flow:,.2f}. "
                    f"Set up an automatic transfer on payday to invest a fixed amount before you have a chance to spend it. "
                    f"'Pay yourself first' is the single highest-leverage financial habit."
                )
            ))

        # --- Marginal surplus (0-500) ---
        elif 0 < state.net_cash_flow <= 500:
            weekly_amount = round(min(state.net_cash_flow * 0.3, 50))
            recs.append(ActionableRecommendation(
                action="Capture Your Narrow Surplus: Micro-Invest $25-$50/Week Automatically",
                category="CASH_FLOW",
                priority="MEDIUM",
                impact_estimate="$50/week invested at 7% grows to ~$35,000 in 10 years -- consistency beats amount",
                explanation=(
                    f"Your monthly surplus is ${state.net_cash_flow:,.2f} -- tight, but positive. "
                    f"Even micro-investments via apps like Acorns or Robinhood build the habit and momentum. "
                    f"Automate a ${weekly_amount:,.0f}/week transfer on payday "
                    f"so it moves before discretionary temptation takes over."
                )
            ))

    # =========================================================================
    # 5. BUDGET & SPENDING DISCIPLINE
    # =========================================================================

    @classmethod
    def _budget_discipline_rules(cls, state: UserFinancialState, recs: list) -> None:

        # --- Category concentration ---
        if "CATEGORY_CONCENTRATION_ALERT" in state.risk_alerts or state.largest_category_share > 0.50:
            recs.append(ActionableRecommendation(
                action="Audit and Cap Dominant Merchant Category Spending",
                category="BUDGET",
                priority="MEDIUM",
                impact_estimate="Redistributing 10-15% of concentrated spend to savings = $150-$500/month recovered",
                explanation=(
                    f"Your top spending category accounts for {state.largest_category_share*100:.1f}% of total card spend -- "
                    f"a dangerous single-vector dependency. Review that category line by line: identify duplicate vendors, "
                    f"unused memberships, or auto-renewed services. Set a monthly category cap and track it weekly."
                )
            ))

        elif state.largest_category_share > 0.35:
            recs.append(ActionableRecommendation(
                action="Diversify Spending: No Single Category Should Exceed 35% of Budget",
                category="BUDGET",
                priority="LOW",
                impact_estimate="Balanced category distribution improves financial resilience to price shocks in any one area",
                explanation=(
                    f"Your top category is {state.largest_category_share*100:.1f}% of spend. "
                    f"While not yet critical, concentration above 35% leaves you exposed to price shocks in that sector. "
                    f"Review and gradually redistribute to keep each major category under one-third of your budget."
                )
            ))

        # --- Spending volatility / impulse shock ---
        if "HIGH_SPENDING_VOLATILITY" in state.risk_alerts or state.shock_ratio > 60.0:
            recs.append(ActionableRecommendation(
                action="Enforce a 48-Hour Rule for All Purchases Over $200",
                category="DISCIPLINE",
                priority="MEDIUM",
                impact_estimate="Cooling periods eliminate 20-40% of impulse purchases -- saving $200-$600/month for volatile spenders",
                explanation=(
                    f"Your maximum transaction is {state.shock_ratio:.1f}x your average purchase -- "
                    f"extreme spending volatility that signals impulsive large-ticket buying. "
                    f"Implement a hard rule: any purchase over $200 requires a 48-hour wait. "
                    f"Add it to a wishlist; if you still want it after 48 hours, it's likely a real need."
                )
            ))
            recs.append(ActionableRecommendation(
                action="Set a Hard Monthly Discretionary Spending Cap in Your Banking App",
                category="DISCIPLINE",
                priority="MEDIUM",
                impact_estimate="Enforced caps reduce overspend by 15-25% in high-volatility profiles",
                explanation=(
                    "Most banking apps allow you to set category spending limits with real-time alerts. "
                    f"Given your {state.shock_ratio:.1f}x shock ratio, configure alerts at 75% and 100% of your "
                    "planned discretionary budget. Seeing the limit in real-time changes spending behaviour dramatically."
                )
            ))

        elif state.shock_ratio > 35.0:
            recs.append(ActionableRecommendation(
                action="Monitor Large-Ticket Spending -- Apply a 24-Hour Consideration Period",
                category="DISCIPLINE",
                priority="LOW",
                impact_estimate="Moderate impulse control improvement worth $100-$200/month in avoided regret purchases",
                explanation=(
                    f"Your purchase shock ratio is {state.shock_ratio:.1f}x -- elevated but not critical. "
                    f"A simple 24-hour waiting period for purchases over $100 is enough to significantly reduce regret spending."
                )
            ))

        # --- Low discipline pillar (composite) ---
        if state.discipline_pillar < 10.0:
            recs.append(ActionableRecommendation(
                action="Adopt Zero-Based Budgeting: Every Dollar Gets a Job Before Month Starts",
                category="BUDGET",
                priority="HIGH",
                impact_estimate="Zero-based budgeting users find 15-25% more savings room within the first 3 months",
                explanation=(
                    f"Your discipline pillar score is {state.discipline_pillar:.1f}/25 -- critically low across multiple dimensions. "
                    f"Zero-based budgeting (ZBB) assigns every dollar a specific purpose before the month starts. "
                    f"Income - Expenses - Savings - Investments = $0. Use YNAB, EveryDollar, or a spreadsheet. "
                    f"Start with just 3 categories: needs, wants, savings."
                )
            ))

        elif state.discipline_pillar < 18.0:
            needs = state.monthly_income * 0.5
            wants = state.monthly_income * 0.3
            savings = state.monthly_income * 0.2
            recs.append(ActionableRecommendation(
                action="Switch to the 50/30/20 Budget Rule to Restore Spending Balance",
                category="BUDGET",
                priority="MEDIUM",
                impact_estimate="A structured budget framework typically recovers 10-15% of income toward savings",
                explanation=(
                    f"Your discipline pillar is {state.discipline_pillar:.1f}/25. "
                    f"Apply the 50/30/20 rule to your ${state.monthly_income:,.2f} income: "
                    f"${needs:,.0f} needs | ${wants:,.0f} wants | ${savings:,.0f} savings/debt. "
                    f"Compare this to your current spend and identify the gap."
                )
            ))

    # =========================================================================
    # 6. INCOME
    # =========================================================================

    @classmethod
    def _income_rules(cls, state: UserFinancialState, recs: list) -> None:

        # --- Very low income relative to burn ---
        if state.monthly_income < state.monthly_burn_rate * 0.90:
            recs.append(ActionableRecommendation(
                action="Urgently Increase Income: Explore Gig Work, Overtime, or Side Freelancing",
                category="INCOME",
                priority="HIGH",
                impact_estimate=f"Closing the ${abs(state.net_cash_flow):,.2f}/month income gap stops the deficit spiral",
                explanation=(
                    f"Your monthly income (${state.monthly_income:,.2f}) is outpaced by your burn rate "
                    f"(${state.monthly_burn_rate:,.2f}). This is a structural deficit, not a budgeting problem alone. "
                    f"Explore: freelance platforms (Upwork, Fiverr), gig driving (Uber, DoorDash), selling unused assets, "
                    f"or negotiating a raise. A single side income of ${round(abs(state.net_cash_flow)):,.0f}/month closes the gap."
                )
            ))

        # --- Moderate income: no surplus being captured ---
        elif state.monthly_income > 0 and 0 < state.net_cash_flow < state.monthly_income * 0.10:
            low_raise = state.monthly_income * 0.05
            high_raise = state.monthly_income * 0.10
            surplus_pct = round(state.net_cash_flow / state.monthly_income * 100, 1)
            recs.append(ActionableRecommendation(
                action="Negotiate a Raise -- Your Spending Leaves No Margin for Error",
                category="INCOME",
                priority="MEDIUM",
                impact_estimate=f"A 5-10% raise on your current income adds ${low_raise:,.0f}-${high_raise:,.0f}/month in new capacity",
                explanation=(
                    f"With only a {surplus_pct}% income surplus, any surprise expense derails your finances. "
                    f"Research market rate for your role (Glassdoor, Levels.fyi) and schedule a salary review. "
                    f"Even a modest raise dramatically improves your savings capacity."
                )
            ))

        # --- Income growth opportunity ---
        if state.monthly_income > 0 and state.net_cash_flow > 0 and state.monthly_income < 5000:
            recs.append(ActionableRecommendation(
                action="Invest in an Income-Boosting Skill: Online Certification or Course",
                category="INCOME",
                priority="LOW",
                impact_estimate="Targeted upskilling in tech/finance/healthcare can increase salary 15-30% within 12-18 months",
                explanation=(
                    f"Your current monthly income is ${state.monthly_income:,.2f}. "
                    f"High-ROI certifications (AWS, Google Analytics, PMP, CISSP, CFA) cost $200-$2,000 "
                    f"but deliver salary increases that pay back the investment within 2-3 months. "
                    f"With your current surplus, you can self-fund this without new debt."
                )
            ))

    # =========================================================================
    # 7. SAVINGS & INVESTMENTS
    # =========================================================================

    @classmethod
    def _savings_investment_rules(cls, state: UserFinancialState, recs: list) -> None:

        # --- Not investing at all (good runway but no wealth-building signal) ---
        if state.runway_months >= 3.0 and state.net_cash_flow > 200 and state.debt_pillar >= 15.0:
            monthly_contrib = round(min(583, state.net_cash_flow * 0.5))
            recs.append(ActionableRecommendation(
                action="Open a Roth IRA and Contribute Up to the Annual Limit ($7,000 in 2024)",
                category="WEALTH",
                priority="MEDIUM",
                impact_estimate="Max Roth IRA contributions invested at 7% for 30 years = ~$700,000 in tax-free retirement wealth",
                explanation=(
                    f"You have a positive cash flow of ${state.net_cash_flow:,.2f}/month and a solid emergency foundation. "
                    f"This is the exact moment to start tax-advantaged retirement investing. "
                    f"A Roth IRA grows tax-free and has no RMDs. Contribute ${monthly_contrib:,.0f}/month "
                    f"to max the annual $7,000 limit. If your employer offers a 401k match, capture that first."
                )
            ))

        # --- Employer 401k match not mentioned -- universal nudge ---
        if state.monthly_income > 2000 and state.net_cash_flow > 0:
            recs.append(ActionableRecommendation(
                action="Ensure You're Capturing Your Full 401(k) Employer Match -- It's Free Money",
                category="WEALTH",
                priority="MEDIUM",
                impact_estimate="Not capturing a 4% employer match on $50k salary = $2,000/year in free money left on the table",
                explanation=(
                    "The 401(k) employer match is the highest guaranteed return in personal finance -- 50-100% instantly. "
                    "Confirm with HR the match formula (e.g., '50% of contributions up to 6% of salary'). "
                    "Set your contribution rate to at least the match threshold before allocating surplus elsewhere."
                )
            ))

        # --- High cash surplus: index fund investment ---
        if state.net_cash_flow > 500 and state.runway_months >= 6.0:
            ten_year = round(state.net_cash_flow * 12 * ((1.07**10 - 1) / 0.07))
            recs.append(ActionableRecommendation(
                action="Invest Monthly Surplus into a Low-Cost Broad Market Index Fund (VTI / VXUS)",
                category="WEALTH",
                priority="MEDIUM",
                impact_estimate=f"${state.net_cash_flow:,.0f}/month at 7% annual growth = ${ten_year:,.0f}+ in 10 years",
                explanation=(
                    f"With ${state.net_cash_flow:,.2f}/month surplus and 6+ months emergency coverage, "
                    f"you're ready to build real long-term wealth. Broad market index funds (VTI, VXUS, VOO) "
                    f"have delivered ~10% annually over the past century with minimal fees (<0.05% expense ratio). "
                    f"Automate contributions on the 1st of each month so it's frictionless."
                )
            ))

        # --- Good runway: HYSA for emergency fund ---
        if 3.0 <= state.runway_months < 6.0:
            hysa_annual = round(state.monthly_burn_rate * state.runway_months * 0.045)
            recs.append(ActionableRecommendation(
                action="Move Emergency Fund to a High-Yield Savings Account (HYSA) Earning 4-5% APY",
                category="OPTIMIZATION",
                priority="LOW",
                impact_estimate=f"At {state.runway_months:.1f} months x ${state.monthly_burn_rate:,.0f}/month, a HYSA earns ~${hysa_annual:,.0f}/year passively",
                explanation=(
                    "If your emergency fund sits in a traditional savings account earning 0.01-0.5%, you're losing "
                    "purchasing power to inflation. HYSAs at online banks (SoFi, Ally, Marcus) currently offer 4-5% APY "
                    "on the same FDIC-insured cash with zero risk or lockup period."
                )
            ))

    # =========================================================================
    # 8. PERSONA-SPECIFIC TAILORED RECOMMENDATIONS
    # =========================================================================

    @classmethod
    def _persona_rules(cls, state: UserFinancialState, recs: list) -> None:

        if state.persona == "Digital E-Commerce Native":
            recs.append(ActionableRecommendation(
                action="Switch to a Dedicated E-Commerce Cashback Card with Virtual Card Numbers",
                category="OPTIMIZATION",
                priority="LOW",
                impact_estimate="Earn 3-5% cashback on online spending -- $200-$600/year at typical e-commerce volumes",
                explanation=(
                    "You are a digital-first shopper. A card like Apple Card, Citi Double Cash, or Amazon Prime Visa "
                    "offers 2-5% on online/digital purchases. Pair it with virtual card numbers (Privacy.com) to "
                    "isolate subscriptions, prevent over-billing, and instantly cancel without changing your main card."
                )
            ))
            recs.append(ActionableRecommendation(
                action="Automate Price-Drop Alerts and Use Browser Extension for Coupon Stacking",
                category="OPTIMIZATION",
                priority="LOW",
                impact_estimate="Extensions like Honey + Capital One Shopping recapture 5-15% on purchases you'd make anyway",
                explanation=(
                    "As an online shopper, layering cashback cards with coupon stacking extensions is effortless savings. "
                    "Enable price-drop tracking on Amazon and major retailers. Set a threshold alert so you automatically "
                    "buy at the lowest historical price."
                )
            ))

        elif state.persona == "Asset-Rich Steady Conservative":
            excess = round((state.runway_months - 6) * state.monthly_burn_rate)
            excess_yield = round(excess * 0.05)
            recs.append(ActionableRecommendation(
                action="Sweep Surplus Cash into T-Bills or a Money Market Fund for Risk-Free 5%+ Yield",
                category="WEALTH",
                priority="LOW",
                impact_estimate=f"${excess:,.0f} in excess cash could earn ${excess_yield:,.0f}/year risk-free",
                explanation=(
                    f"You hold {state.runway_months:.1f} months of reserves -- exemplary discipline. "
                    f"Any cash beyond 6 months can be placed in 4-week T-Bills (via TreasuryDirect) or a money market "
                    f"fund like VMFXX. You earn 4.8-5.2% with full liquidity and zero credit risk. "
                    f"It takes 10 minutes to set up and runs on autopilot."
                )
            ))
            recs.append(ActionableRecommendation(
                action="Review Asset Allocation -- Stable Conservative Profiles Often Under-Invest in Equities",
                category="WEALTH",
                priority="LOW",
                impact_estimate="Shifting even 20% from bonds/cash to equities adds ~1.5% expected annual return over 10-year horizon",
                explanation=(
                    "Conservative profiles often hold too much in stable assets and miss out on equity growth. "
                    "With your strong liquidity foundation, a 60/40 or even 70/30 equity/bond allocation is appropriate "
                    "for any funds with a 5+ year horizon. Review your portfolio annually and rebalance if equity "
                    "drift exceeds 5%."
                )
            ))

        elif state.persona == "High-Velocity Daily Spender":
            daily_burn = round(state.monthly_burn_rate / 30, 2)
            recs.append(ActionableRecommendation(
                action="Track Daily Spend with a Real-Time Dashboard -- Set a Daily Dollar Ceiling",
                category="DISCIPLINE",
                priority="MEDIUM",
                impact_estimate="Visibility into daily burn reduces overspend by 15-25% in high-frequency spending profiles",
                explanation=(
                    f"You make frequent daily transactions with an average burn rate of "
                    f"${daily_burn:,.2f}/day. "
                    "Tracking in real-time (Monarch Money, Copilot, or bank app widgets) creates instant awareness. "
                    "Set a daily ceiling (e.g., $80/day) and get a push alert when you hit 80% of it."
                )
            ))
            recs.append(ActionableRecommendation(
                action="Batch Micro-Transactions: Use Weekly Cash Envelope for Daily Discretionary Spending",
                category="DISCIPLINE",
                priority="LOW",
                impact_estimate="Cash envelope users spend 15-20% less on discretionary categories than card users",
                explanation=(
                    "Frequent small purchases add up invisibly. Withdraw a fixed weekly cash envelope for coffee, "
                    "dining, and convenience purchases. When the envelope is empty, the week's discretionary spending "
                    "is done. This tactile constraint is more powerful than digital tracking alone."
                )
            ))

        elif state.persona == "Bulk / Large-Ticket Spender":
            recs.append(ActionableRecommendation(
                action="Pre-Plan Large Purchases: Build a Sinking Fund for Known Big-Ticket Items",
                category="BUDGET",
                priority="MEDIUM",
                impact_estimate="Sinking funds eliminate credit card debt for planned purchases -- saving 18-25% APR financing costs",
                explanation=(
                    f"Your average transaction size is elevated. For predictable large purchases (appliances, travel, "
                    f"medical), open a dedicated sub-savings account and contribute monthly. "
                    f"By the time the purchase date arrives, it's already funded -- no debt, no interest, no stress."
                )
            ))
            recs.append(ActionableRecommendation(
                action="Negotiate Bulk Purchase Discounts -- Always Ask for 5-10% Off on High-Ticket Items",
                category="OPTIMIZATION",
                priority="LOW",
                impact_estimate="On $2,000+ purchases, a 5-10% negotiated discount = $100-$200 per transaction",
                explanation=(
                    "As a large-ticket buyer, your leverage is significant. Retailers have 10-40% margin on most goods. "
                    "Always ask: 'Is this the best price?' or 'Do you offer a cash/check discount?' "
                    "For electronics and appliances, buying floor models or open-box saves 15-25% instantly."
                )
            ))

        elif state.persona == "Cash-Flow Constrained":
            recs.append(ActionableRecommendation(
                action="Apply for a 0% APR Emergency Credit Card BEFORE the Next Crisis Hits",
                category="LIQUIDITY",
                priority="HIGH",
                impact_estimate="Having a 0% APR card available eliminates predatory payday loan rates of 300-400% APR",
                explanation=(
                    f"Your profile shows cash-flow constraints (runway: {state.runway_months:.1f} months, "
                    f"depletion risk: {state.cash_depletion_risk*100:.1f}%). "
                    "When the next emergency hits, the worst outcome is turning to payday lenders. "
                    "Proactively apply for a low-limit card with a 0% introductory APR -- use it ONLY for emergencies "
                    "and pay it in full during the interest-free window."
                )
            ))
            recs.append(ActionableRecommendation(
                action="Identify and Eliminate Your 3 Biggest Non-Essential Recurring Charges This Week",
                category="CASH_FLOW",
                priority="HIGH",
                impact_estimate="Most constrained households have $80-$200/month in cuttable recurring charges",
                explanation=(
                    "When cash flow is constrained, speed matters. Pull last month's bank statement right now. "
                    "Highlight every recurring charge. Mark any you could live without for 3 months. "
                    "Cancel them today -- don't wait for 'later.' Even $80/month recovered = $960/year."
                )
            ))

        elif state.persona == "Balanced Household Spender":
            recs.append(ActionableRecommendation(
                action="Implement a Quarterly Financial Review: 4 Check-Ins per Year Outperform Annual Budgets",
                category="MINDSET",
                priority="LOW",
                impact_estimate="Regular reviews prevent lifestyle creep and keep savings rates on trajectory",
                explanation=(
                    "You're balanced and in control -- a great foundation. The risk for your profile is slow lifestyle "
                    "creep over time. Schedule a 30-minute quarterly financial review: check your savings rate, "
                    "net worth progression, and whether any categories have silently expanded. Adjust before they compound."
                )
            ))
            monthly_increase = round(state.monthly_income * 0.01)
            recs.append(ActionableRecommendation(
                action="Automate Annual Increases to Your Savings Rate by 1% Each January",
                category="WEALTH",
                priority="LOW",
                impact_estimate="Incrementally raising savings rate 1%/year from 10% to 20% doubles wealth-building capacity",
                explanation=(
                    f"With a balanced spending profile and ${state.net_cash_flow:,.2f}/month surplus, "
                    "you have the stability to layer on wealth-building gradually. "
                    f"Each January, increase your automatic investment transfer by 1% of income. "
                    f"At ${state.monthly_income:,.0f}/month income, that's just ${monthly_increase:,.0f} more per month "
                    f"-- barely perceptible, but massive over time."
                )
            ))

    # =========================================================================
    # 9. HEALTH TIER -- Tier-level overarching strategic guidance
    # =========================================================================

    @classmethod
    def _health_tier_rules(cls, state: UserFinancialState, recs: list) -> None:

        if state.health_tier == "CRITICAL":
            recs.append(ActionableRecommendation(
                action="CRITICAL: Follow the Financial Triage Order -- Liquidity > Debt > Income > Invest",
                category="MINDSET",
                priority="HIGH",
                impact_estimate="Following the correct triage sequence prevents compounding damage and recovers stability fastest",
                explanation=(
                    f"Your overall health score is {state.health_score:.1f}/100 -- CRITICAL tier. "
                    f"Do not try to do everything at once. Follow the proven triage sequence: "
                    f"(1) Secure $1,000 liquid buffer. "
                    f"(2) Stop all non-essential outflows. "
                    f"(3) Eliminate cash deficit. "
                    f"(4) Tackle highest-cost debt. "
                    f"(5) Only then consider investing. Tackling out of order wastes scarce resources."
                )
            ))

        elif state.health_tier == "VULNERABLE":
            pillar_scores = [
                ("Credit", state.credit_pillar),
                ("Debt", state.debt_pillar),
                ("Liquidity", state.liquidity_pillar),
                ("Discipline", state.discipline_pillar),
            ]
            recs.append(ActionableRecommendation(
                action="VULNERABLE: Build Stability Systematically -- Fix One Pillar Per Quarter",
                category="MINDSET",
                priority="MEDIUM",
                impact_estimate="Structured pillar-by-pillar recovery avoids overwhelm and delivers measurable progress",
                explanation=(
                    f"Your health score is {state.health_score:.1f}/100. You are vulnerable but not in crisis. "
                    f"Your weakest pillars: "
                    f"Credit ({state.credit_pillar:.1f}/25), Debt ({state.debt_pillar:.1f}/25), "
                    f"Liquidity ({state.liquidity_pillar:.1f}/25), Discipline ({state.discipline_pillar:.1f}/25). "
                    f"Focus on the lowest scorer first for 90 days before moving to the next."
                )
            ))

        elif state.health_tier == "STABLE":
            weakest = min(
                [("Credit", state.credit_pillar), ("Debt", state.debt_pillar),
                 ("Liquidity", state.liquidity_pillar), ("Discipline", state.discipline_pillar)],
                key=lambda x: x[1]
            )
            recs.append(ActionableRecommendation(
                action="STABLE: Shift Focus from Defense to Offense -- Begin Wealth-Building",
                category="WEALTH",
                priority="LOW",
                impact_estimate="The jump from STABLE to EXCELLENT is primarily about increasing savings rate, not cutting more",
                explanation=(
                    f"Your health score is {state.health_score:.1f}/100 -- solid and stable. "
                    f"You've mastered the defensive fundamentals. The next chapter is offensive: "
                    f"maximize retirement contributions, build taxable brokerage accounts, and explore income diversification. "
                    f"Your weakest pillar ({weakest[0]}: {weakest[1]:.1f}/25) is the last item to polish."
                )
            ))

        elif state.health_tier == "EXCELLENT":
            recs.append(ActionableRecommendation(
                action="EXCELLENT: Optimize for Tax Efficiency -- You're Leaving Money on the Table",
                category="TAX",
                priority="LOW",
                impact_estimate="Tax optimization at high financial health levels can recover 2-5% of gross income annually",
                explanation=(
                    f"Your health score is {state.health_score:.1f}/100 -- EXCELLENT. "
                    f"At this level, the highest leverage is tax strategy, not more saving. "
                    f"Explore: maxing HSA contributions (triple tax advantage), tax-loss harvesting in brokerage accounts, "
                    f"backdoor Roth conversions, and donor-advised funds if you give to charity. "
                    f"Consider a fee-only CPA or CFP for a dedicated tax review."
                )
            ))

    # =========================================================================
    # 10. INSURANCE & PROTECTION
    # =========================================================================

    @classmethod
    def _insurance_protection_rules(cls, state: UserFinancialState, recs: list) -> None:

        # Vulnerable & Critical tiers need coverage check
        if state.health_tier in ("CRITICAL", "VULNERABLE"):
            recs.append(ActionableRecommendation(
                action="Verify Your Emergency Insurance Coverage -- One Gap Can Wipe Out Your Recovery",
                category="INSURANCE",
                priority="MEDIUM",
                impact_estimate="A single uninsured medical or auto emergency can create $10,000-$50,000 in new debt overnight",
                explanation=(
                    f"With a {state.health_tier} financial posture, you have limited capacity to absorb shocks. "
                    "The most common financial catastrophes are uninsured medical bills and auto liability claims. "
                    "Confirm: (1) You have active health insurance. (2) Your auto coverage includes liability + collision. "
                    "(3) You have renters/homeowners insurance. If any is missing, address immediately."
                )
            ))

        # Stable/Excellent: prompt for income protection
        if state.health_tier in ("STABLE", "EXCELLENT") and state.monthly_income > 3000:
            recs.append(ActionableRecommendation(
                action="Obtain or Review Long-Term Disability Insurance -- Protect Your Income Stream",
                category="INSURANCE",
                priority="LOW",
                impact_estimate="Disability is 3x more likely than death before 65 -- LTD insurance replaces 60-70% of income",
                explanation=(
                    f"Your income of ${state.monthly_income:,.2f}/month is your greatest financial asset. "
                    "Long-term disability (LTD) insurance protects it if you can't work. "
                    "Check if your employer offers group LTD (often 60% of salary free). "
                    "If not, individual LTD policies cost $50-$150/month -- far cheaper than the risk."
                )
            ))

    # =========================================================================
    # 11. TAX OPTIMIZATION
    # =========================================================================

    @classmethod
    def _tax_optimization_rules(cls, state: UserFinancialState, recs: list) -> None:

        if state.monthly_income > 3500 and state.net_cash_flow > 0:
            recs.append(ActionableRecommendation(
                action="Max Out Your HSA Before Any Taxable Investment Account",
                category="TAX",
                priority="MEDIUM",
                impact_estimate="HSA contributions are triple-tax-advantaged: pre-tax in, tax-free growth, tax-free withdrawal (medical)",
                explanation=(
                    "A Health Savings Account (HSA) is the most tax-efficient account in the US tax code. "
                    "2024 limit: $4,150 individual / $8,300 family. Contributions reduce taxable income, "
                    "growth is tax-free, and withdrawals for medical expenses are tax-free. "
                    "After 65, it converts to a traditional IRA. Prioritize this over taxable brokerage."
                )
            ))

        if state.monthly_income > 5000 and state.net_cash_flow > 300:
            recs.append(ActionableRecommendation(
                action="Explore Tax-Loss Harvesting in Your Brokerage Account Each December",
                category="TAX",
                priority="LOW",
                impact_estimate="Tax-loss harvesting can offset $3,000/year in ordinary income + unlimited capital gains",
                explanation=(
                    "If you hold investments in a taxable brokerage, review positions each December. "
                    "Selling positions at a loss 'harvests' the loss to offset capital gains or up to $3,000 of "
                    "ordinary income per year. Reinvest in a similar (not identical) fund to maintain market exposure. "
                    "This is a free IRS-sanctioned tax reduction strategy."
                )
            ))

    # =========================================================================
    # 12. POSITIVE REINFORCEMENT (for healthy profiles)
    # =========================================================================

    @classmethod
    def _positive_reinforcement_rules(cls, state: UserFinancialState, recs: list) -> None:

        if state.health_score >= 80.0:
            recs.append(ActionableRecommendation(
                action="You're in the Top 20% -- Now Focus on Net Worth Compounding, Not Just Cash Flow",
                category="MINDSET",
                priority="LOW",
                impact_estimate="Shifting attention from monthly budget to quarterly net worth tracking accelerates long-term wealth",
                explanation=(
                    f"Congratulations -- your financial health score is {state.health_score:.1f}/100. "
                    f"At this stage, the monthly budget is already dialled in. Your next metric to obsess over is "
                    f"net worth progression. Track assets vs. liabilities every quarter. "
                    f"Each $100k of invested assets at 7% growth adds $7,000/year in passive wealth -- automatically."
                )
            ))

        if state.runway_months >= 6.0 and state.debt_pillar >= 20.0 and state.credit_pillar >= 18.0:
            recs.append(ActionableRecommendation(
                action="Consider Real Estate or Alternative Investments for Portfolio Diversification",
                category="WEALTH",
                priority="LOW",
                impact_estimate="Adding real estate (REITs or direct) to a stock portfolio reduces volatility and adds rental income upside",
                explanation=(
                    f"With strong credit ({state.credit_pillar:.1f}/25), low debt ({state.debt_pillar:.1f}/25), "
                    f"and {state.runway_months:.1f} months of reserves, you qualify for and can afford "
                    f"portfolio diversification beyond stocks and bonds. "
                    f"REITs (via VNQ) provide real estate exposure with stock liquidity. "
                    f"I-Bonds (up to $10k/year) offer inflation protection at zero risk."
                )
            ))

        if state.net_cash_flow > 1500 and state.health_score >= 70.0:
            recs.append(ActionableRecommendation(
                action="Document a Written Financial Plan -- Intentional Wealth Builders Outperform by 2-3x",
                category="MINDSET",
                priority="LOW",
                impact_estimate="Having written financial goals increases probability of achieving them by 42% (Dominican University study)",
                explanation=(
                    f"You have the cash flow (${state.net_cash_flow:,.2f}/month surplus) and the score "
                    f"({state.health_score:.1f}/100) to build genuine wealth. The highest-leverage next step is a "
                    f"written one-page financial plan: "
                    f"(1) Net worth target in 5 years. (2) Savings rate %. (3) Investment allocation. "
                    f"(4) Debt payoff date. (5) Insurance coverage review date. Review annually."
                )
            ))

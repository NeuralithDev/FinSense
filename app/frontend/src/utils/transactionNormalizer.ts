/**
 * FinSense Deterministic & Heuristic Merchant Normalizer & Auto-Categorizer
 * 
 * Cleans ugly Indian UPI narrations, POS swipe codes, ACH mandates, and NEFT strings
 * into canonical merchant entities with rich metadata, category, and essentiality classification.
 */

export interface RawTransactionInput {
  id?: string;
  date: string;
  narration?: string;
  description?: string;
  merchant?: string;
  amount: number | string;
  type?: 'debit' | 'credit' | 'income' | 'expense';
  balance?: number | string;
  category?: string;
  reference_no?: string;
}

export interface NormalizedTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  raw_merchant: string;
  merchant: string;
  merchant_id: string;
  amount: number;
  category: string;
  is_income: boolean;
  is_recurring: boolean;
  is_essential: boolean;
  balance_after?: number;
  payment_channel: 'UPI' | 'POS_CARD' | 'ACH_MANDATE' | 'NEFT_IMPS' | 'NETBANKING' | 'OTHER';
  confidence_score: number;
  original_currency: string;
}

// Known canonical merchant dictionary with pattern matchers and metadata
interface MerchantSignature {
  id: string;
  canonicalName: string;
  patterns: RegExp[];
  category: string;
  isEssential: boolean;
  cadence: 'MONTHLY' | 'ANNUAL' | 'VARIABLE';
  overlapGroup?: string;
  defaultLogo?: string;
}

export const MERCHANT_SIGNATURES: MerchantSignature[] = [
  // Streaming & Entertainment
  {
    id: 'netflix',
    canonicalName: 'Netflix Premium 4K',
    patterns: [/netflix/i, /nflx/i],
    category: 'Entertainment',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'Streaming Video',
  },
  {
    id: 'amazon_prime',
    canonicalName: 'Amazon Prime Video',
    patterns: [/prime\s*video/i, /amazon\s*prime/i, /amzn\s*prime/i, /amazonpay.*prime/i],
    category: 'Entertainment',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'Streaming Video',
  },
  {
    id: 'jio_hotstar',
    canonicalName: 'JioHotstar Mobile VIP',
    patterns: [/hotstar/i, /jiohotstar/i, /disney.*hotstar/i, /nov26.*disney/i],
    category: 'Entertainment',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'Streaming Video',
  },
  {
    id: 'spotify',
    canonicalName: 'Spotify Premium Student',
    patterns: [/spotify/i, /spotif/i],
    category: 'Music & Audio',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'Music Streaming',
  },
  {
    id: 'youtube_premium',
    canonicalName: 'YouTube Premium',
    patterns: [/youtube.*premium/i, /google.*youtube/i],
    category: 'Entertainment',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'Streaming Video',
  },

  // Health & Fitness
  {
    id: 'cultfit',
    canonicalName: 'Cult.fit Gym & Fitness',
    patterns: [/cult\.?fit/i, /curefit/i, /cultfit/i, /cure\.fit/i],
    category: 'Health & Fitness',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'Fitness & Gym',
  },
  {
    id: 'anytime_fitness',
    canonicalName: 'Anytime Fitness Club',
    patterns: [/anytime\s*fitness/i, /gold['s]?\s*gym/i],
    category: 'Health & Fitness',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'Fitness & Gym',
  },

  // Cloud, AI & Tech Productivity
  {
    id: 'apple_services',
    canonicalName: 'Apple Services (iCloud Student)',
    patterns: [/apple\s*services/i, /apple\.com\/bill/i, /icloud/i, /itunes/i],
    category: 'Cloud & Tech',
    isEssential: true,
    cadence: 'MONTHLY',
    overlapGroup: 'Cloud Storage',
  },
  {
    id: 'google_one',
    canonicalName: 'Google One Storage',
    patterns: [/google\s*one/i, /google\s*storage/i],
    category: 'Cloud & Tech',
    isEssential: true,
    cadence: 'MONTHLY',
    overlapGroup: 'Cloud Storage',
  },
  {
    id: 'chatgpt',
    canonicalName: 'OpenAI ChatGPT Plus',
    patterns: [/openai/i, /chatgpt/i],
    category: 'Cloud & Tech',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'AI Copilots',
  },
  {
    id: 'claude_ai',
    canonicalName: 'Claude AI Pro (Anthropic)',
    patterns: [/anthropic/i, /claude\.ai/i, /claude\s*pro/i],
    category: 'Cloud & Tech',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'AI Copilots',
  },
  {
    id: 'cursor_ai',
    canonicalName: 'Cursor AI Pro Editor',
    patterns: [/cursor\.sh/i, /cursor\s*ai/i, /anysphere/i],
    category: 'Cloud & Tech',
    isEssential: false,
    cadence: 'MONTHLY',
    overlapGroup: 'AI Copilots',
  },
  {
    id: 'aws_cloud',
    canonicalName: 'AWS Cloud Services',
    patterns: [/aws/i, /amazonaws/i, /amazon\s*web/i],
    category: 'Cloud & Tech',
    isEssential: false,
    cadence: 'MONTHLY',
  },

  // Utilities & Internet
  {
    id: 'airtel_fiber',
    canonicalName: 'Airtel Xstream Fiber',
    patterns: [/airtel\s*xstream/i, /airtel\s*broadband/i, /airtel\s*fiber/i, /airtel.*bill/i],
    category: 'Utilities',
    isEssential: true,
    cadence: 'MONTHLY',
  },
  {
    id: 'jio_fiber',
    canonicalName: 'JioFiber Broadband',
    patterns: [/jio\s*fiber/i, /reliance\s*jio.*broadband/i],
    category: 'Utilities',
    isEssential: true,
    cadence: 'MONTHLY',
  },
  {
    id: 'bescom_electricity',
    canonicalName: 'State Electricity & Power Board',
    patterns: [/bescom/i, /tneb/i, /mseb/i, /electricity/i, /power\s*dist/i],
    category: 'Utilities',
    isEssential: true,
    cadence: 'MONTHLY',
  },

  // Food & Dining / Quick Commerce
  {
    id: 'blinkit',
    canonicalName: 'Blinkit Quick Commerce',
    patterns: [/blinkit/i, /grofers/i],
    category: 'Food & Dining',
    isEssential: false,
    cadence: 'VARIABLE',
  },
  {
    id: 'swiggy',
    canonicalName: 'Swiggy Food & Instamart',
    patterns: [/swiggy/i, /bundl\s*technologies/i],
    category: 'Food & Dining',
    isEssential: false,
    cadence: 'VARIABLE',
  },
  {
    id: 'zomato',
    canonicalName: 'Zomato Dining & Delivery',
    patterns: [/zomato/i],
    category: 'Food & Dining',
    isEssential: false,
    cadence: 'VARIABLE',
  },
  {
    id: 'zepto',
    canonicalName: 'Zepto Instant Groceries',
    patterns: [/zepto/i, /kirana\s*kart/i],
    category: 'Food & Dining',
    isEssential: false,
    cadence: 'VARIABLE',
  },
  {
    id: 'dominos',
    canonicalName: "Domino's Pizza",
    patterns: [/dominos/i, /jubilant\s*food/i],
    category: 'Food & Dining',
    isEssential: false,
    cadence: 'VARIABLE',
  },
  {
    id: 'coffee_specialty',
    canonicalName: 'Blue Tokai / Specialty Coffee',
    patterns: [/blue\s*tokai/i, /third\s*wave/i, /starbucks/i, /tata\s*starbucks/i, /caf[eé]\s*coffee/i],
    category: 'Food & Dining',
    isEssential: false,
    cadence: 'VARIABLE',
  },

  // Transit & Rides
  {
    id: 'uber',
    canonicalName: 'Uber Transportation',
    patterns: [/uber/i, /uber\s*india/i, /uber\s*trip/i],
    category: 'Transportation',
    isEssential: false,
    cadence: 'VARIABLE',
  },
  {
    id: 'ola',
    canonicalName: 'Ola Cabs Transit',
    patterns: [/ola\s*cabs/i, /ani\s*technologies/i, /olacabs/i],
    category: 'Transportation',
    isEssential: false,
    cadence: 'VARIABLE',
  },
  {
    id: 'metro_smartcard',
    canonicalName: 'Metro Transit SmartCard',
    patterns: [/dmrc/i, /bmrcl/i, /metro\s*card/i, /metro\s*transit/i, /cmrl/i],
    category: 'Transportation',
    isEssential: true,
    cadence: 'VARIABLE',
  },

  // Investments & Wealth (Excluded from Living Expense Spend Pacing)
  {
    id: 'zerodha',
    canonicalName: 'Zerodha Broking (Equity & SIP)',
    patterns: [/zerodha/i, /zerodha\s*broking/i],
    category: 'Investments',
    isEssential: false,
    cadence: 'MONTHLY',
  },
  {
    id: 'groww',
    canonicalName: 'Groww Mutual Funds & Stocks',
    patterns: [/groww/i, /nextbillion/i],
    category: 'Investments',
    isEssential: false,
    cadence: 'MONTHLY',
  },
  {
    id: 'indmoney',
    canonicalName: 'INDmoney Investments',
    patterns: [/indmoney/i, /finzoom/i],
    category: 'Investments',
    isEssential: false,
    cadence: 'MONTHLY',
  },

  // Housing & Rent
  {
    id: 'room_rent',
    canonicalName: 'Apartment Room Rent & Share',
    patterns: [/room\s*rent/i, /house\s*rent/i, /nobroker/i, /flat\s*rent/i, /nestaway/i],
    category: 'Housing & Rent',
    isEssential: true,
    cadence: 'MONTHLY',
  },
];

/**
 * Extracts payment channel from raw string
 */
export function detectPaymentChannel(raw: string): NormalizedTransaction['payment_channel'] {
  const upper = raw.toUpperCase();
  if (upper.startsWith('UPI') || upper.includes('/UPI/') || upper.includes('@UPI') || upper.includes('@YBL') || upper.includes('@OK')) {
    return 'UPI';
  }
  if (upper.startsWith('POS') || upper.includes('POS ') || upper.includes('SWIPE') || upper.includes('XXXX')) {
    return 'POS_CARD';
  }
  if (upper.startsWith('ACH') || upper.includes('ACH D-') || upper.includes('NACH') || upper.includes('MANDATE')) {
    return 'ACH_MANDATE';
  }
  if (upper.startsWith('NEFT') || upper.startsWith('IMPS') || upper.startsWith('RTGS')) {
    return 'NEFT_IMPS';
  }
  if (upper.includes('NETBANK') || upper.includes('BILLDESK') || upper.includes('INB')) {
    return 'NETBANKING';
  }
  return 'OTHER';
}

/**
 * Parses raw Indian UPI naration into clean readable recipient/merchant
 * Examples:
 *   "UPI/DR/6291048291/NETFLIX COM/UTIB/netflix@axis" -> "Netflix Com"
 *   "UPI/Mr Vaishna/9611199715@slc/burger/SLICE" -> "Mr Vaishna"
 *   "UPI/VELAN FRUI/q507356837@ybl/Paid via S" -> "Velan Fruits"
 *   "ACH D- CULTFIT HEALTHCARE PVT LTD-892182" -> "Cultfit Healthcare Pvt Ltd"
 */
export function cleanRawNarration(rawString: string): string {
  if (!rawString || typeof rawString !== 'string') return 'General Transaction';

  let s = rawString.trim();

  // 1. UPI Narration format: UPI/<Merchant>/<VPA>/<Remarks>/<Bank>
  if (s.toUpperCase().startsWith('UPI/')) {
    const parts = s.split('/');
    // Check which segment has the merchant name
    if (parts.length >= 3) {
      // If parts[1] is DR/CR, merchant is usually parts[3] or parts[2]
      if (['DR', 'CR'].includes(parts[1].toUpperCase())) {
        if (parts[3] && !parts[3].match(/^\d+$/) && parts[3].length > 2) {
          s = parts[3];
        } else if (parts[2]) {
          s = parts[2];
        }
      } else {
        // e.g. UPI/DOMINOSPIZ/dominos.payu@h/...
        s = parts[1];
      }
    }
  }

  // 2. ACH Mandate format: "ACH D- CULTFIT HEALTHCARE PVT LTD-12345"
  s = s.replace(/^(ACH\s*[DC]-?\s*|NACH\s*[DC]-?\s*)/i, '');

  // 3. POS swipe: "POS 4111XXXXXXXX1234 SWIGGY BANGALORE IN"
  s = s.replace(/^POS\s+[X\d]+\s+/i, '');

  // 4. NEFT/IMPS: "NEFT-CR-N12345678-ANAND SEVD-FAMILY"
  s = s.replace(/^(NEFT|IMPS|RTGS)-[A-Z0-9]+-[A-Z0-9]+-/i, '');

  // 5. Remove trailing bank / location noise
  s = s
    .replace(/\s+(BANGALORE|MUMBAI|DELHI|GURGAON|CHENNAI|HYDERABAD|PUNE|IN)\b/gi, '')
    .replace(/\s+(PVT\s*LTD|LIMITED|LLP|INC)\b/gi, '')
    .replace(/[0-9]{8,}/g, '') // remove long transaction reference numbers
    .replace(/[@#*]+/g, ' ')
    .trim();

  // If camelCase or all-caps, convert to Title Case
  if (s === s.toUpperCase() && s.length > 3) {
    s = s
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return s || 'General Transaction';
}

/**
 * Normalizes a single raw transaction row
 */
export function normalizeBankTransaction(
  input: RawTransactionInput,
  index = 0
): NormalizedTransaction {
  const rawText = input.narration || input.description || input.merchant || 'Everyday Transaction';
  const cleanedText = cleanRawNarration(rawText);

  // Check against known canonical signatures
  let matchedSignature: MerchantSignature | undefined;
  for (const sig of MERCHANT_SIGNATURES) {
    if (sig.patterns.some((p) => p.test(rawText) || p.test(cleanedText))) {
      matchedSignature = sig;
      break;
    }
  }

  // Parse amount
  let amt = 0;
  if (typeof input.amount === 'number') {
    amt = Math.abs(input.amount);
  } else if (typeof input.amount === 'string') {
    const cleanAmt = input.amount.replace(/[₹$,\s]/g, '');
    amt = Math.abs(parseFloat(cleanAmt) || 0);
  }

  // Income detection
  const isIncome = Boolean(
    input.type === 'income' ||
    input.type === 'credit' ||
    /salary|payroll|deposit|interest|allowance|refund|cashback|splitwise\s*reimbursement/i.test(rawText)
  );

  const paymentChannel = detectPaymentChannel(rawText);

  // Determine canonical name
  const canonicalMerchant = matchedSignature
    ? matchedSignature.canonicalName
    : cleanedText;

  // Determine category
  let category = matchedSignature ? matchedSignature.category : (input.category || 'General & Everyday');
  if (isIncome && category !== 'Income') {
    category = 'Income';
  } else if (!matchedSignature) {
    // Heuristic categorization
    const lower = rawText.toLowerCase();
    if (/grocery|fruits|provisions|supermarket|vegetables/i.test(lower)) {
      category = 'Food & Dining';
    } else if (/uber|ola|metro|fuel|petrol|transit|flight|train/i.test(lower)) {
      category = 'Transportation';
    } else if (/gym|fitness|cult|pharmacy|medplus|apollo/i.test(lower)) {
      category = 'Health & Fitness';
    } else if (/netflix|prime|hotstar|spotify|cinema|bookmyshow/i.test(lower)) {
      category = 'Entertainment';
    } else if (/zerodha|groww|mutual|fund|sip|securities/i.test(lower)) {
      category = 'Investments';
    } else if (/rent|society|maintenance/i.test(lower)) {
      category = 'Housing & Rent';
    } else if (/airtel|jio|fiber|broadband|electricity|water|utility/i.test(lower)) {
      category = 'Utilities';
    }
  }

  // Recurrence guess
  const isRecurring = Boolean(
    matchedSignature?.cadence === 'MONTHLY' ||
    matchedSignature?.cadence === 'ANNUAL' ||
    /subscription|monthly|sip|rent|broadband|membership|premium/i.test(rawText)
  );

  // Essentiality classification
  const isEssential = matchedSignature
    ? matchedSignature.isEssential
    : ['Housing & Rent', 'Utilities', 'Daily Groceries'].includes(category);

  // Parse date into standard YYYY-MM-DD
  let normalizedDate = input.date;
  if (normalizedDate && normalizedDate.includes('/')) {
    // Check if DD/MM/YYYY or MM/DD/YYYY
    const parts = normalizedDate.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD/MM/YYYY
        normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD
        normalizedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }

  // Closing balance if provided
  let balanceAfter: number | undefined;
  if (input.balance !== undefined && input.balance !== null && input.balance !== '') {
    balanceAfter = Math.abs(parseFloat(String(input.balance).replace(/[₹$,\s]/g, '')) || 0);
  }

  return {
    id: input.id || `tx_${Date.now()}_${index}`,
    date: normalizedDate || new Date().toISOString().split('T')[0],
    raw_merchant: rawText,
    merchant: canonicalMerchant,
    merchant_id: matchedSignature?.id || canonicalMerchant.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    amount: amt,
    category,
    is_income: isIncome,
    is_recurring: isRecurring,
    is_essential: isEssential,
    balance_after: balanceAfter,
    payment_channel: paymentChannel,
    confidence_score: matchedSignature ? 0.95 : 0.75,
    original_currency: 'INR',
  };
}

/**
 * Normalizes an array of raw input rows
 */
export function normalizeTransactionLedger(inputs: RawTransactionInput[]): NormalizedTransaction[] {
  return (inputs || []).map((row, idx) => normalizeBankTransaction(row, idx));
}

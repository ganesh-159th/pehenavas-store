import { auth, db } from '../lib/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ZONE_ALIAS_MAP = {
  'bengaluru': 'Bengaluru',
  'bangalore': 'Bengaluru',
  'hyd': 'Hyderabad',
  'secunderabad': 'Hyderabad',
  'goa': 'Goa',
  'mumbai': 'Mumbai',
  'bombay': 'Mumbai',
  'delhi': 'Delhi',
  'new delhi': 'Delhi',
};

const ALLOWED_ZONES = ['Hyderabad', 'Bengaluru', 'Goa', 'Mumbai', 'Delhi'];

const FIELD_RULES = {
  fullName: { minLen: 2, maxLen: 100 },
  phone: { pattern: /^\d{10}$/ },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  location: { minLen: 3, maxLen: 100 },
};

const BUSINESS_RULES = {
  currencyCode: 'INR',
  maxItemsPerOrder: 50,
  minTotal: 1,
};

class PipelineError extends Error {
  constructor(code, message, layer) {
    super(message);
    this.name = 'PipelineError';
    this.code = code;
    this.layer = layer;
    this.timestamp = new Date().toISOString();
  }
}

function capitalizeName(str) {
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function layer1SyntaxScrutiny(input) {
  const {
    fullName = '',
    phone = '',
    email = '',
    location = '',
  } = input;

  const cleaned = {
    fullName: fullName.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    location: location.trim(),
  };

  if (!cleaned.fullName) {
    throw new PipelineError('L1_ERROR', 'Syntax or missing field anomaly: fullName is blank.', 'L1_SYNTAX');
  }
  if (!cleaned.phone) {
    throw new PipelineError('L1_ERROR', 'Syntax or missing field anomaly: phone is blank.', 'L1_SYNTAX');
  }
  if (!cleaned.email) {
    throw new PipelineError('L1_ERROR', 'Syntax or missing field anomaly: email is blank.', 'L1_SYNTAX');
  }
  if (!cleaned.location) {
    throw new PipelineError('L1_ERROR', 'Syntax or missing field anomaly: location is blank.', 'L1_SYNTAX');
  }

  if (cleaned.fullName.length < FIELD_RULES.fullName.minLen) {
    throw new PipelineError('L1_ERROR', `Syntax anomaly: fullName too short (min ${FIELD_RULES.fullName.minLen} chars).`, 'L1_SYNTAX');
  }
  if (cleaned.fullName.length > FIELD_RULES.fullName.maxLen) {
    throw new PipelineError('L1_ERROR', `Syntax anomaly: fullName too long (max ${FIELD_RULES.fullName.maxLen} chars).`, 'L1_SYNTAX');
  }

  if (!FIELD_RULES.phone.pattern.test(cleaned.phone)) {
    throw new PipelineError('L1_ERROR', 'Syntax anomaly: phone must be exactly 10 digits.', 'L1_SYNTAX');
  }

  if (!FIELD_RULES.email.pattern.test(cleaned.email)) {
    throw new PipelineError('L1_ERROR', 'Syntax anomaly: email must contain an @ symbol and a valid domain.', 'L1_SYNTAX');
  }

  if (cleaned.location.length < FIELD_RULES.location.minLen || cleaned.location.length > FIELD_RULES.location.maxLen) {
    throw new PipelineError('L1_ERROR', `Syntax anomaly: location length must be between ${FIELD_RULES.location.minLen} and ${FIELD_RULES.location.maxLen} chars.`, 'L1_SYNTAX');
  }

  const processed = {
    fullName: capitalizeName(cleaned.fullName),
    phone: cleaned.phone,
    email: cleaned.email,
    location: capitalizeName(cleaned.location),
  };

  return { ...input, ...processed };
}

function layer2LocationVerification(data) {
  const rawLocation = data.location.trim().toLowerCase();

  if (ALLOWED_ZONES.includes(data.location)) {
    return data;
  }

  if (ZONE_ALIAS_MAP[rawLocation]) {
    return { ...data, location: ZONE_ALIAS_MAP[rawLocation] };
  }

  const partialMatch = ALLOWED_ZONES.find(
    zone => zone.toLowerCase().includes(rawLocation) || rawLocation.includes(zone.toLowerCase())
  );
  if (partialMatch) {
    return { ...data, location: partialMatch };
  }

  throw new PipelineError(
    'L2_ERROR',
    `Regional operational boundary violation: "${data.location}" is not in allowed zones: ${ALLOWED_ZONES.join(', ')}.`,
    'L2_LOCATION'
  );
}

function layer3BusinessLogic(data) {
  const { cart = [], total } = data;

  if (!Array.isArray(cart) || cart.length === 0) {
    throw new PipelineError('L3_ERROR', 'Financial recalculation mismatch or empty payload: cart is empty.', 'L3_BUSINESS');
  }

  if (cart.length > BUSINESS_RULES.maxItemsPerOrder) {
    throw new PipelineError('L3_ERROR', `Business rule violation: max ${BUSINESS_RULES.maxItemsPerOrder} items per order.`, 'L3_BUSINESS');
  }

  for (const item of cart) {
    if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
      throw new PipelineError('L3_ERROR', `Financial anomaly: item "${item.name || 'unknown'}" has invalid price.`, 'L3_BUSINESS');
    }
    if (!item.qty || typeof item.qty !== 'number' || item.qty < 1) {
      throw new PipelineError('L3_ERROR', `Financial anomaly: item "${item.name || 'unknown'}" has invalid quantity.`, 'L3_BUSINESS');
    }
  }

  const computedSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (typeof total !== 'number' || total !== computedSubtotal) {
    throw new PipelineError(
      'L3_ERROR',
      `Financial recalculation mismatch: provided total (${total}) does not match computed subtotal (${computedSubtotal}).`,
      'L3_BUSINESS'
    );
  }

  if (total < BUSINESS_RULES.minTotal) {
    throw new PipelineError('L3_ERROR', `Business rule violation: total must be at least ${BUSINESS_RULES.minTotal}.`, 'L3_BUSINESS');
  }

  return { ...data, computedSubtotal };
}

function layer4DataStructuring(data) {
  const { fullName, phone, email, location, cart, total, computedSubtotal } = data;

  if (!fullName || !phone || !email || !location || !Array.isArray(cart)) {
    throw new PipelineError('L4_ERROR', 'Blueprint compilation failure: missing required fields for structuring.', 'L4_STRUCTURE');
  }

  const document = {
    customerProfile: {
      fullName,
      contactPhone: phone,
      gmailId: email,
      verifiedLocation: location,
      updatedAt: serverTimestamp(),
    },
    orderDetails: {
      itemsPurchased: cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        size: item.size || null,
        image: item.image || null,
      })),
      financialSummary: {
        subtotal: computedSubtotal,
        total,
        currency: BUSINESS_RULES.currencyCode,
      },
      fulfillmentStatus: 'pending',
      createdAt: serverTimestamp(),
    },
  };

  return { ...data, firestoreDocument: document };
}

function layer5SessionValidation(data) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new PipelineError(
      'L5_FATAL',
      'Security Alert: No authenticated user session found.',
      'L5_SECURITY'
    );
  }

  if (!currentUser.emailVerified && currentUser.providerData.length > 0) {
    const emailProvider = currentUser.providerData.find(p => p.providerId === 'password');
    if (emailProvider) {
      throw new PipelineError(
        'L5_FATAL',
        'Email not verified. Please verify your email before placing an order. Check your inbox (including spam) for a verification link from Firebase. Need a new one? Go to Account → Resend Verification Email.',
        'L5_SECURITY'
      );
    }
  }

  return { ...data, uid: currentUser.uid };
}

async function layer6DatabaseCommit(data) {
  const { uid, firestoreDocument } = data;

  if (!uid || !firestoreDocument) {
    throw new PipelineError('L6_ERROR', 'Database commit failed: missing uid or document payload.', 'L6_DATABASE');
  }

  const { customerProfile, orderDetails } = firestoreDocument;

  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { customerProfile }, { merge: true });

  const ordersRef = collection(db, 'users', uid, 'orders');
  const orderRef = await addDoc(ordersRef, orderDetails);

  return {
    success: true,
    orderId: orderRef.id,
    uid,
    timestamp: new Date().toISOString(),
  };
}

export async function executeStrictOrderPipeline(input) {
  let data = { ...input };

  data = layer1SyntaxScrutiny(data);
  data = layer2LocationVerification(data);
  data = layer3BusinessLogic(data);
  data = layer4DataStructuring(data);
  data = layer5SessionValidation(data);
  const result = await layer6DatabaseCommit(data);

  return result;
}

export { PipelineError, layer1SyntaxScrutiny, layer2LocationVerification, layer3BusinessLogic, layer4DataStructuring, layer5SessionValidation, layer6DatabaseCommit, ALLOWED_ZONES, FIELD_RULES, BUSINESS_RULES };

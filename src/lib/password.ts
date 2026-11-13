export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3;
  label: 'None' | 'Weak' | 'Fair' | 'Strong';
  labelUr: string;
  rules: {
    minLength: boolean;
    hasLetter: boolean;
    hasNumberOrSymbol: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const minLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'`~]/.test(password);

  if (!password) {
    return {
      score: 0,
      label: 'None',
      labelUr: 'کوئی نہیں',
      rules: { minLength, hasLetter, hasNumberOrSymbol },
    };
  }

  if (!minLength || !hasLetter || !hasNumberOrSymbol) {
    return {
      score: 1,
      label: 'Weak',
      labelUr: 'کمزور',
      rules: { minLength, hasLetter, hasNumberOrSymbol },
    };
  }

  if (password.length < 11) {
    return {
      score: 2,
      label: 'Fair',
      labelUr: 'مناسب',
      rules: { minLength, hasLetter, hasNumberOrSymbol },
    };
  }

  return {
    score: 3,
    label: 'Strong',
    labelUr: 'مضبوط',
    rules: { minLength, hasLetter, hasNumberOrSymbol },
  };
}

export interface PasswordPairValidation {
  valid: boolean;
  matches: boolean;
  strength: PasswordStrengthResult;
  errorEn: string | null;
  errorUr: string | null;
}

export function validatePasswordPair(password: string, confirm: string): PasswordPairValidation {
  const strength = evaluatePasswordStrength(password);
  const matches = password.length > 0 && password === confirm;

  if (!strength.rules.minLength) {
    return {
      valid: false,
      matches,
      strength,
      errorEn: 'Password must be at least 8 characters long.',
      errorUr: 'پاس ورڈ کم از کم 8 حروف کا ہونا ضروری ہے۔',
    };
  }

  if (!strength.rules.hasLetter || !strength.rules.hasNumberOrSymbol) {
    return {
      valid: false,
      matches,
      strength,
      errorEn: 'Include at least one letter and one number or symbol.',
      errorUr: 'کم از کم ایک حرف اور ایک عدد یا علامت شامل کریں۔',
    };
  }

  if (!matches) {
    return {
      valid: false,
      matches,
      strength,
      errorEn: 'Passwords do not match.',
      errorUr: 'دونوں پاس ورڈ ایک جیسے نہیں ہیں۔',
    };
  }

  return {
    valid: true,
    matches: true,
    strength,
    errorEn: null,
    errorUr: null,
  };
}

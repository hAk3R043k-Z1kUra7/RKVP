export const PASSWORD_HINT =
  'Минимум 8 символов, заглавная и строчная буква, цифра и спецсимвол (!@#$% и т.д.).';

export function getPasswordChecks(password) {
  const value = typeof password === 'string' ? password : '';
  return {
    minLength: value.length >= 8,
    lower: /[a-zа-яё]/.test(value),
    upper: /[A-ZА-ЯЁ]/.test(value),
    digit: /\d/.test(value),
    special: /[^A-Za-zА-Яа-яЁё0-9]/.test(value),
  };
}

export function getPasswordError(password) {
  const checks = getPasswordChecks(password);
  if (!checks.minLength) return 'Пароль должен быть не короче 8 символов';
  if (!checks.lower) return 'Пароль должен содержать строчную букву';
  if (!checks.upper) return 'Пароль должен содержать заглавную букву';
  if (!checks.digit) return 'Пароль должен содержать цифру';
  if (!checks.special) return 'Пароль должен содержать спецсимвол (!@#$%^&* и т.д.)';
  return '';
}

export function isPasswordValid(password) {
  return !getPasswordError(password);
}

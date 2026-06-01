const MIN_LENGTH = 8;

const PASSWORD_HINT =
  'Минимум 8 символов, заглавная и строчная буква, цифра и спецсимвол (!@#$% и т.д.).';

function getPasswordValidationError(password) {
  if (typeof password !== 'string' || !password) {
    return 'Пароль обязателен';
  }
  if (password.length < MIN_LENGTH) {
    return `Пароль должен быть не короче ${MIN_LENGTH} символов`;
  }
  if (!/[a-zа-яё]/.test(password)) {
    return 'Пароль должен содержать строчную букву';
  }
  if (!/[A-ZА-ЯЁ]/.test(password)) {
    return 'Пароль должен содержать заглавную букву';
  }
  if (!/\d/.test(password)) {
    return 'Пароль должен содержать цифру';
  }
  if (!/[^A-Za-zА-Яа-яЁё0-9]/.test(password)) {
    return 'Пароль должен содержать спецсимвол (!@#$%^&* и т.д.)';
  }
  return null;
}

function validatePassword(password) {
  return getPasswordValidationError(password) === null;
}

module.exports = {
  MIN_LENGTH,
  PASSWORD_HINT,
  getPasswordValidationError,
  validatePassword,
};

const PASSWORD_RULES_DESCRIPTION =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const validateStrongPassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return PASSWORD_RULES_DESCRIPTION;
  }

  if (!/[a-z]/.test(password)) {
    return PASSWORD_RULES_DESCRIPTION;
  }

  if (!/[A-Z]/.test(password)) {
    return PASSWORD_RULES_DESCRIPTION;
  }

  if (!/\d/.test(password)) {
    return PASSWORD_RULES_DESCRIPTION;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return PASSWORD_RULES_DESCRIPTION;
  }

  return null;
};

export { PASSWORD_RULES_DESCRIPTION, validateStrongPassword };

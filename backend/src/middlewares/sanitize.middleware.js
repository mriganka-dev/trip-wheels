const sanitize = (target) => {
  if (!target || typeof target !== "object") {
    return;
  }

  for (const key of Object.keys(target)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete target[key];
    } else if (typeof target[key] === "object" && target[key] !== null) {
      sanitize(target[key]);
    }
  }
};

export const sanitizeNoSql = (req, res, next) => {
  if (req.body) {
    sanitize(req.body);
  }

  if (req.params) {
    sanitize(req.params);
  }

  if (req.headers) {
    sanitize(req.headers);
  }

  if (req.query) {
    sanitize(req.query);
  }

  next();
};

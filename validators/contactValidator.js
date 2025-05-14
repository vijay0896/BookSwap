const { z } = require("zod");

const contactSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
});

const validateContact = (req, res, next) => {
  const result = contactSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  next();
};

module.exports = { validateContact };

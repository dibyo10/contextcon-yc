import { z } from "zod";

const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .refine((email) => {
        const invalid = ["example.com", "test.com"];
        return !invalid.some((d) => email.includes(d));
    });

export default emailSchema;
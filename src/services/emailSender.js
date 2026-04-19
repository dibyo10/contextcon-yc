import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, body }) {
    if (!to || !subject || !body) {
        throw new Error("Invalid email payload");
    }
    try {
        const { data, error } = await resend.emails.send({
            from: "Dibyo <send@dibyo.work>", // must be a verified sender in Resend
            to,
            subject,
            text: body,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, messageId: data.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
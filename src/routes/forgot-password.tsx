import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { firebaseAuth, isFirebaseConfigured } from "@/services/firebase";
import { AuthShell, authButtonClass, authInputClass, authLabelClass } from "@/components/auth/AuthShell";

const schema = z.object({ email: z.string().trim().email() });
type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!isFirebaseConfigured) {
      toast.error("Firebase not configured");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(firebaseAuth(), values.email);
      setSent(true);
      toast.success("Reset email sent");
    } catch (err) {
      toast.error("Could not send email", { description: err instanceof Error ? err.message : "" });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll send a reset link to your email."
      footer={<><Link to="/login" className="text-primary hover:underline">Back to sign in</Link></>}
    >
      {sent ? (
        <div className="rounded-xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
          Check your inbox for the reset link.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={authLabelClass}>Email</label>
            <input type="email" className={authInputClass} {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={submitting} className={authButtonClass}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset email
          </button>
        </form>
      )}
    </AuthShell>
  );
}

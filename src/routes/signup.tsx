import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { firebaseAuth, isFirebaseConfigured } from "@/services/firebase";
import { useAuth } from "@/store/auth";
import { AuthShell, authButtonClass, authInputClass, authLabelClass } from "@/components/auth/AuthShell";

const schema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(60),
  email: z.string().trim().email(),
  password: z.string().min(6, "At least 6 characters").max(128),
});

type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!isFirebaseConfigured) {
      toast.error("Firebase not configured", { description: "Add your config in src/services/firebase.ts" });
      return;
    }
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth(), values.email, values.password);
      await updateProfile(cred.user, { displayName: values.name });
      toast.success("Account created");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error("Signup failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell
      title="Create account"
      subtitle="Build a disciplined edge — start journaling every trade."
      footer={<>Already a member? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={authLabelClass}>Full name</label>
          <input className={authInputClass} autoComplete="name" {...register("name")} />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <label className={authLabelClass}>Email</label>
          <input type="email" className={authInputClass} autoComplete="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <label className={authLabelClass}>Password</label>
          <input type="password" className={authInputClass} autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </form>
    </AuthShell>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { firebaseAuth, isFirebaseConfigured } from "@/services/firebase";
import { useAuth } from "@/store/auth";
import { AuthShell, authButtonClass, authInputClass, authLabelClass } from "@/components/auth/AuthShell";

const schema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
});

type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!isFirebaseConfigured) {
      toast.error("Firebase not configured", { description: "Add your config in src/services/firebase.ts" });
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth(), values.email, values.password);
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error("Sign-in failed", { description: err instanceof Error ? err.message : "" });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back, trader. Let's review the edge."
      footer={<>Don't have an account? <Link to="/signup" className="text-primary hover:underline">Create one</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={authLabelClass}>Email</label>
          <input type="email" className={authInputClass} autoComplete="email" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className={authLabelClass}>Password</label>
            <Link to="/forgot-password" className="mb-1.5 text-xs text-primary hover:underline">Forgot?</Link>
          </div>
          <input type="password" className={authInputClass} autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>
    </AuthShell>
  );
}

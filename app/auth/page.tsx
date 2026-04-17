import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="paper-panel rounded-[2rem] border border-border/70 px-8 py-10 shadow-paper">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
          Account
        </p>
        <h1 className="mt-3 text-4xl">登录与同步</h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          登录后，你可以更稳定地保存自己的对话轨迹与偏好；如果暂时不登录，也仍然可以直接开始体验。
        </p>
      </section>
      <AuthForm />
    </div>
  );
}

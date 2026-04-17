"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/supabase/auth";
import { isSupabaseEnabled } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const { signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseEnabled()) {
    return (
      <Card className="paper-panel border-border/70">
        <CardHeader>
          <CardTitle>账号同步暂未开放</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">
          当前你仍然可以直接以访客身份体验对话。等同步功能开放后，再回来登录即可。
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="paper-panel border-border/70">
      <CardHeader className="space-y-3">
        <CardTitle>{mode === "sign_in" ? "登录" : "注册"}</CardTitle>
        <p className="text-sm leading-7 text-muted-foreground">
          登录后，你的对话会更容易被长期保存；注册后如需邮箱确认，请按邮件提示完成验证。
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "sign_up" ? (
          <div className="grid gap-3">
            <label className="text-sm text-foreground/85">用户名</label>
            <input
              className="h-12 rounded-[1.2rem] border border-border/70 bg-background/80 px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入你的用户名"
            />
          </div>
        ) : null}
        <div className="grid gap-3">
          <label className="text-sm text-foreground/85">邮箱</label>
          <input
            className="h-12 rounded-[1.2rem] border border-border/70 bg-background/80 px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="grid gap-3">
          <label className="text-sm text-foreground/85">密码</label>
          <input
            className="h-12 rounded-[1.2rem] border border-border/70 bg-background/80 px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 6 位"
          />
        </div>

        {error ? (
          <div className="rounded-[1.2rem] border border-destructive/20 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-[1.2rem] border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground/85">
            {message}
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button
            disabled={submitting || loading}
            onClick={async () => {
              setSubmitting(true);
              setError(null);
              setMessage(null);

              try {
                if (mode === "sign_in") {
                  await signIn(email.trim(), password);
                  router.push("/");
                  router.refresh();
                } else {
                  const trimmedUsername = username.trim();

                  if (!trimmedUsername) {
                    throw new Error("请输入用户名。");
                  }

                  await signUp(email.trim(), password, trimmedUsername);
                  setMessage("注册请求已提交。如果项目开启邮箱确认，请先去邮箱完成验证。");
                }
              } catch (nextError) {
                setError(
                  nextError instanceof Error ? nextError.message : "认证失败，请稍后重试。"
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "处理中..." : mode === "sign_in" ? "登录" : "注册"}
          </Button>
          <Button
            variant="secondary"
            disabled={submitting || loading}
            onClick={() => {
              setMode((current) => (current === "sign_in" ? "sign_up" : "sign_in"));
              setError(null);
              setMessage(null);
            }}
          >
            {mode === "sign_in" ? "切换到注册" : "切换到登录"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

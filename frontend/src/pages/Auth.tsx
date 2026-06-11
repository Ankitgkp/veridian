import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
);

export default function Auth() {
  async function login(provider: "github" | "google") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
    });

    if (error) {
      alert("Error while Signing in");
    } else {
      alert("Signed In");
    }
  }

  return (
    <div>
      <Button onClick={() => login("google")}>Login with Google</Button>
      <Button onClick={() => login("github")}>Login with Github</Button>
    </div>
  );
}

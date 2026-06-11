import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const supabase = createClient();

export default function Auth() {
  async function login(provider: "github" | "google") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
    });

    if (error) {
      console.log("Error while Signing in");
    }
  }

  return (
    <div>
      <Button onClick={() => login("google")}>Login with Google</Button>
      <Button onClick={() => login("github")}>Login with Github</Button>
    </div>
  );
}

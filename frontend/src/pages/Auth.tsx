import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabase = createClient()

export default function Auth() {
  function login() {

  }

  return (
    <div>
      <Button onClick={() => login("google")}>Login with Google</Button>
      <Button onClick={() => login("github")}>Login with Github</Button>
    </div>
  );
}

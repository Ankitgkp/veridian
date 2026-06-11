import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const supabase = createClient();

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getInfo() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    }

    getInfo();
  }, []);

  return (
    <div>
      {!user ? (
        <Button
          onClick={() => {
            navigate("/auth");
          }}
        >
          Sign In
        </Button>
      ) : (
        <span>{user.email}</span>
      )}
      {user && (
        <div>
          <Button
            onClick={() => {
              {
                supabase.auth.signOut();
              }
              setUser(null);
            }}
          >
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}
